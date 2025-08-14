export const maxDuration = 30;
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PatientSchema } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as any } },
            { email: { contains: search, mode: 'insensitive' as any } },
          ],
        }
      : {}

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { bloodTests: true }
          }
        }
      }),
      prisma.patient.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = PatientSchema.parse(body)
    
    // Check if email already exists
    if (validatedData.email) {
      const existingPatient = await prisma.patient.findUnique({
        where: { email: validatedData.email }
      })
      
      if (existingPatient) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    const patient = await prisma.patient.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        gender: validatedData.gender || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: patient,
      message: 'Patient created successfully',
    })
  } catch (error) {
    console.error('Error creating patient:', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create patient' },
      { status: 500 }
    )
  }
} 