import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { pdfProcessor } from '@/lib/pdf-processor'
import { isValueAbnormal } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (patientId) {
      where.patientId = patientId
    }
    
    if (status) {
      where.status = status
    }

    const [bloodTests, total] = await Promise.all([
      prisma.bloodTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { testDate: 'desc' },
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          },
          parameters: {
            orderBy: { category: 'asc' }
          },
          _count: {
            select: { parameters: true }
          }
        }
      }),
      prisma.bloodTest.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: bloodTests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching blood tests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blood tests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const patientId = formData.get('patientId') as string
    const testDate = formData.get('testDate') as string
    const labName = formData.get('labName') as string
    const reportNumber = formData.get('reportNumber') as string
    const file = formData.get('file') as File

    if (!patientId || !testDate || !file) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create blood test record
    const bloodTest = await prisma.bloodTest.create({
      data: {
        patientId,
        testDate: new Date(testDate),
        labName: labName || null,
        reportNumber: reportNumber || null,
        status: 'PROCESSING',
      },
    })

    try {
      // Process PDF asynchronously
      processPdfAsync(bloodTest.id, buffer)
      
      return NextResponse.json({
        success: true,
        data: bloodTest,
        message: 'Blood test uploaded successfully. Processing in progress...',
      })
    } catch (error) {
      // Update status to failed
      await prisma.bloodTest.update({
        where: { id: bloodTest.id },
        data: { status: 'FAILED' }
      })
      
      throw error
    }
  } catch (error) {
    console.error('Error uploading blood test:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload blood test' },
      { status: 500 }
    )
  }
}

async function processPdfAsync(bloodTestId: string, pdfBuffer: Buffer) {
  try {
    // Process PDF using LangExtract-like functionality
    const extractionResult = await pdfProcessor.processPdf(pdfBuffer)
    
    // Create parameters
    const parameters = await Promise.all(
      extractionResult.parameters.map(async (param) => {
        const isAbnormal = isValueAbnormal(param.value, param.referenceRange)
        
        return prisma.bloodParameter.create({
          data: {
            patientId: (await prisma.bloodTest.findUnique({ where: { id: bloodTestId } }))!.patientId,
            bloodTestId,
            name: param.name,
            value: param.value,
            unit: param.unit,
            referenceRange: param.referenceRange,
            isAbnormal,
            category: param.category,
          },
        })
      })
    )

    // Analyze relationships if we have multiple parameters
    if (parameters.length > 1) {
      const relationships = await pdfProcessor.analyzeParameterRelationships(extractionResult.parameters)
      
      await Promise.all(
        relationships.map(async (rel) => {
          const sourceParam = parameters.find(p => p.name === rel.sourceParameter)
          const targetParam = parameters.find(p => p.name === rel.targetParameter)
          
          if (sourceParam && targetParam) {
            return prisma.parameterRelationship.create({
              data: {
                sourceParameterId: sourceParam.id,
                targetParameterId: targetParam.id,
                relationshipType: rel.relationshipType,
                strength: rel.strength,
                description: rel.description,
              },
            })
          }
        })
      )
    }

    // Update blood test status to completed
    await prisma.bloodTest.update({
      where: { id: bloodTestId },
      data: { status: 'COMPLETED' }
    })

    console.log(`Blood test ${bloodTestId} processed successfully`)
  } catch (error) {
    console.error(`Error processing blood test ${bloodTestId}:`, error)
    
    // Update status to failed
    await prisma.bloodTest.update({
      where: { id: bloodTestId },
      data: { status: 'FAILED' }
    })
  }
} 