export const maxDuration = 30;
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const parameterName = searchParams.get('parameterName')
    const days = parseInt(searchParams.get('days') || '365')

    if (!patientId || !parameterName) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and parameter name are required' },
        { status: 400 }
      )
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const parameters = await prisma.bloodParameter.findMany({
      where: {
        patientId,
        name: parameterName,
        bloodTest: {
          testDate: {
            gte: startDate
          }
        }
      },
      include: {
        bloodTest: {
          select: { testDate: true, labName: true }
        }
      },
      orderBy: {
        bloodTest: {
          testDate: 'asc'
        }
      }
    })

    const trends = parameters.map((param: any) => ({
      date: param.bloodTest.testDate,
      value: param.value,
      isAbnormal: param.isAbnormal,
      labName: param.bloodTest.labName,
      referenceRange: param.referenceRange,
      unit: param.unit
    }))

    // Calculate statistics
    const values = parameters.map((p: any) => p.value)
    const abnormalCount = parameters.filter((p: any) => p.isAbnormal).length
    const totalCount = parameters.length

    const stats = {
      count: totalCount,
      abnormalCount,
      abnormalPercentage: totalCount > 0 ? (abnormalCount / totalCount) * 100 : 0,
      min: values.length > 0 ? Math.min(...values) : null,
      max: values.length > 0 ? Math.max(...values) : null,
      average: values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : null,
      latestValue: trends.length > 0 ? trends[trends.length - 1] : null,
      previousValue: trends.length > 1 ? trends[trends.length - 2] : null,
    }

    return NextResponse.json({
      success: true,
      data: {
        parameterName,
        trends,
        stats
      }
    })
  } catch (error) {
    console.error('Error fetching parameter trends:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parameter trends' },
      { status: 500 }
    )
  }
} 