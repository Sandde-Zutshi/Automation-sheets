import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PatientSchema } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        bloodTests: {
          orderBy: { testDate: 'desc' },
          include: {
            parameters: {
              orderBy: { category: 'asc' }
            }
          }
        },
        _count: {
          select: { bloodTests: true, parameters: true }
        }
      }
    })

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: patient,
    })
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = PatientSchema.parse(body)
    
    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id: params.id }
    })
    
    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    // Check if email already exists (if changed)
    if (validatedData.email && validatedData.email !== existingPatient.email) {
      const emailExists = await prisma.patient.findUnique({
        where: { email: validatedData.email }
      })
      
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    const patient = await prisma.patient.update({
      where: { id: params.id },
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
      message: 'Patient updated successfully',
    })
  } catch (error) {
    console.error('Error updating patient:', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update patient' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id: params.id }
    })
    
    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Delete patient (cascade will handle related records)
    await prisma.patient.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete patient' },
      { status: 500 }
    )
  }
} 