export const maxDuration = 30;
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { KnowledgeGraphData, KnowledgeGraphNode, KnowledgeGraphLink } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const bloodTestId = searchParams.get('bloodTestId')
    const minStrength = parseFloat(searchParams.get('minStrength') || '0.3')

    if (!patientId && !bloodTestId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID or Blood Test ID is required' },
        { status: 400 }
      )
    }

    const where: any = {}
    
    if (patientId) {
      where.patientId = patientId
    }
    
    if (bloodTestId) {
      where.bloodTestId = bloodTestId
    }

    // Get parameters
    const parameters = await prisma.bloodParameter.findMany({
      where,
      include: {
        sourceRelationships: {
          where: {
            strength: {
              gte: minStrength
            }
          },
          include: {
            targetParameter: true
          }
        },
        targetRelationships: {
          where: {
            strength: {
              gte: minStrength
            }
          },
          include: {
            sourceParameter: true
          }
        }
      },
      orderBy: { category: 'asc' }
    })

    // Create nodes
    const nodes: KnowledgeGraphNode[] = parameters.map((param: any) => ({
      id: param.id,
      name: param.name,
      category: param.category,
      value: param.value,
      unit: param.unit,
      isAbnormal: param.isAbnormal,
      referenceRange: param.referenceRange
    }))

    // Create links
    const links: KnowledgeGraphLink[] = []
    const processedRelationships = new Set<string>()

    parameters.forEach((param: any) => {
      // Process source relationships
      param.sourceRelationships.forEach((rel: any) => {
        const linkId = `${rel.sourceParameterId}-${rel.targetParameterId}`
        const reverseLinkId = `${rel.targetParameterId}-${rel.sourceParameterId}`
        
        if (!processedRelationships.has(linkId) && !processedRelationships.has(reverseLinkId)) {
          links.push({
            source: rel.sourceParameterId,
            target: rel.targetParameterId,
            relationshipType: rel.relationshipType,
            strength: rel.strength,
            description: rel.description
          })
          processedRelationships.add(linkId)
        }
      })
      
      // Process target relationships
      param.targetRelationships.forEach((rel: any) => {
        const linkId = `${rel.sourceParameterId}-${rel.targetParameterId}`
        const reverseLinkId = `${rel.targetParameterId}-${rel.sourceParameterId}`
        
        if (!processedRelationships.has(linkId) && !processedRelationships.has(reverseLinkId)) {
          links.push({
            source: rel.sourceParameterId,
            target: rel.targetParameterId,
            relationshipType: rel.relationshipType,
            strength: rel.strength,
            description: rel.description
          })
          processedRelationships.add(linkId)
        }
      })
    })

    // Calculate node positions (simple grid layout)
    const nodesPerRow = Math.ceil(Math.sqrt(nodes.length))
    nodes.forEach((node, index) => {
      node.x = (index % nodesPerRow) * 200
      node.y = Math.floor(index / nodesPerRow) * 150
    })

    const graphData: KnowledgeGraphData = {
      nodes,
      links
    }

    // Calculate graph statistics
    const stats = {
      totalNodes: nodes.length,
      totalLinks: links.length,
      categories: Array.from(new Set(nodes.map(n => n.category))),
      relationshipTypes: Array.from(new Set(links.map(l => l.relationshipType))),
      averageStrength: links.length > 0 
        ? links.reduce((sum, link) => sum + link.strength, 0) / links.length 
        : 0,
      abnormalNodes: nodes.filter(n => n.isAbnormal).length
    }

    return NextResponse.json({
      success: true,
      data: graphData,
      stats
    })
  } catch (error) {
    console.error('Error generating knowledge graph:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate knowledge graph' },
      { status: 500 }
    )
  }
} 