export const maxDuration = 30;
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { groupParametersByCategory } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const bloodTestId = searchParams.get('bloodTestId')
    const category = searchParams.get('category')
    const abnormalOnly = searchParams.get('abnormalOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (patientId) {
      where.patientId = patientId
    }
    
    if (bloodTestId) {
      where.bloodTestId = bloodTestId
    }
    
    if (category) {
      where.category = category
    }
    
    if (abnormalOnly) {
      where.isAbnormal = true
    }

    const [parameters, total] = await Promise.all([
      prisma.bloodParameter.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ],
        include: {
          bloodTest: {
            select: { testDate: true, labName: true }
          },
          patient: {
            select: { name: true }
          }
        }
      }),
      prisma.bloodParameter.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: parameters,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching parameters:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parameters' },
      { status: 500 }
    )
  }
} 