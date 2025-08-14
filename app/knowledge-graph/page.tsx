'use client'

import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { 
  Network, 
  Filter, 
  Settings, 
  ZoomIn, 
  ZoomOut,
  RefreshCw,
  Info
} from 'lucide-react'
import { KnowledgeGraphData, KnowledgeGraphNode, KnowledgeGraphLink } from '@/types'
import { getParameterCategoryColor, getRelationshipTypeColor } from '@/lib/utils'

interface Patient {
  id: string
  name: string
}

export default function KnowledgeGraphPage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(false)
  const [minStrength, setMinStrength] = useState(0.3)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      fetchGraphData()
    }
  }, [selectedPatient, minStrength])

  useEffect(() => {
    if (graphData.nodes.length > 0) {
      renderGraph()
    }
  }, [graphData])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100')
      const data = await response.json()
      if (data.success) {
        setPatients(data.data)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const fetchGraphData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        patientId: selectedPatient,
        minStrength: minStrength.toString()
      })

      const response = await fetch(`/api/knowledge-graph?${params}`)
      const data = await response.json()

      if (data.success) {
        setGraphData(data.data)
      }
    } catch (error) {
      console.error('Error fetching graph data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderGraph = () => {
    if (!svgRef.current || graphData.nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 800
    const height = 600

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Create links
    const links = svg.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('class', 'knowledge-graph-link')
      .style('stroke-width', (d: any) => d.strength * 5)
      .style('opacity', 0.6)

    // Create nodes
    const nodes = svg.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'knowledge-graph-node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    // Add circles to nodes
    nodes.append('circle')
      .attr('r', 20)
      .style('fill', (d: any) => {
        const colorClass = getParameterCategoryColor(d.category)
        return d.isAbnormal ? '#ef4444' : '#10b981'
      })
      .style('stroke', '#fff')
      .style('stroke-width', 2)

    // Add labels to nodes
    nodes.append('text')
      .text((d: any) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '10px')
      .style('fill', '#fff')
      .style('font-weight', 'bold')

    // Add tooltips
    nodes.append('title')
      .text((d: any) => `${d.name}\nValue: ${d.value} ${d.unit || ''}\nCategory: ${d.category}\n${d.isAbnormal ? 'ABNORMAL' : 'Normal'}`)

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      nodes
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3))
  }

  const handleReset = () => {
    setZoom(1)
    if (selectedPatient) {
      fetchGraphData()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Knowledge Graph</h1>
              <p className="text-gray-600">Explore parameter relationships and correlations</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleZoomIn}
                className="btn btn-sm btn-outline"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="btn btn-sm btn-outline"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="btn btn-sm btn-outline"
                title="Reset View"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Controls Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Graph Controls
                </h2>
              </div>
              <div className="card-body space-y-6">
                {/* Patient Selection */}
                <div>
                  <label htmlFor="patient" className="label block mb-2">
                    Select Patient
                  </label>
                  <select
                    id="patient"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="input"
                  >
                    <option value="">Choose a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Strength Filter */}
                <div>
                  <label htmlFor="strength" className="label block mb-2">
                    Minimum Relationship Strength: {minStrength}
                  </label>
                  <input
                    type="range"
                    id="strength"
                    min="0"
                    max="1"
                    step="0.1"
                    value={minStrength}
                    onChange={(e) => setMinStrength(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.0</span>
                    <span>0.5</span>
                    <span>1.0</span>
                  </div>
                </div>

                {/* Graph Stats */}
                {graphData.nodes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Graph Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nodes:</span>
                        <span className="font-medium">{graphData.nodes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Links:</span>
                        <span className="font-medium">{graphData.links.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Abnormal:</span>
                        <span className="font-medium text-danger-600">
                          {graphData.nodes.filter(n => n.isAbnormal).length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Legend</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-success-500"></div>
                      <span>Normal Parameters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-danger-500"></div>
                      <span>Abnormal Parameters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-0.5 bg-gray-400"></div>
                      <span>Relationships</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graph Visualization */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Network className="w-5 h-5 mr-2" />
                  Parameter Relationships
                </h2>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="spinner w-8 h-8"></div>
                  </div>
                ) : !selectedPatient ? (
                  <div className="flex items-center justify-center h-96 text-center">
                    <div>
                      <Network className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
                      <p className="text-gray-600">Choose a patient from the sidebar to view their parameter relationships</p>
                    </div>
                  </div>
                ) : graphData.nodes.length === 0 ? (
                  <div className="flex items-center justify-center h-96 text-center">
                    <div>
                      <Info className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                      <p className="text-gray-600">This patient has no blood test data or relationships to display</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <svg
                      ref={svgRef}
                      width="100%"
                      height="600"
                      style={{ transform: `scale(${zoom})` }}
                      className="knowledge-graph"
                    ></svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 