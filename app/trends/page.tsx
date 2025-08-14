'use client'

import { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { 
  TrendingUp, 
  Filter, 
  Calendar,
  Activity,
  AlertTriangle
} from 'lucide-react'

interface Patient {
  id: string
  name: string
}

interface ParameterTrend {
  date: string
  value: number
  isAbnormal: boolean
  labName?: string
  referenceRange?: string
  unit?: string
}

interface TrendStats {
  count: number
  abnormalCount: number
  abnormalPercentage: number
  min: number | null
  max: number | null
  average: number | null
  latestValue: any
  previousValue: any
}

export default function TrendsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedParameter, setSelectedParameter] = useState('')
  const [parameters, setParameters] = useState<string[]>([])
  const [trends, setTrends] = useState<ParameterTrend[]>([])
  const [stats, setStats] = useState<TrendStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(365)

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      fetchParameters()
    }
  }, [selectedPatient])

  useEffect(() => {
    if (selectedPatient && selectedParameter) {
      fetchTrends()
    }
  }, [selectedPatient, selectedParameter, days])

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

  const fetchParameters = async () => {
    try {
      const response = await fetch(`/api/parameters?patientId=${selectedPatient}`)
      const data = await response.json()
      if (data.success) {
        const uniqueParameters = [...new Set(data.data.map((p: any) => p.name))]
        setParameters(uniqueParameters)
      }
    } catch (error) {
      console.error('Error fetching parameters:', error)
    }
  }

  const fetchTrends = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        patientId: selectedPatient,
        parameterName: selectedParameter,
        days: days.toString()
      })

      const response = await fetch(`/api/parameters/trends?${params}`)
      const data = await response.json()

      if (data.success) {
        setTrends(data.data.trends)
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error('Error fetching trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Parameter Trends</h1>
          <p className="text-gray-600">Analyze parameter changes over time with interactive charts</p>
        </div>

        {/* Controls */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Analysis Controls
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              <div>
                <label htmlFor="parameter" className="label block mb-2">
                  Select Parameter
                </label>
                <select
                  id="parameter"
                  value={selectedParameter}
                  onChange={(e) => setSelectedParameter(e.target.value)}
                  className="input"
                  disabled={!selectedPatient}
                >
                  <option value="">Choose a parameter</option>
                  {parameters.map((parameter) => (
                    <option key={parameter} value={parameter}>
                      {parameter}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="days" className="label block mb-2">
                  Time Range (Days)
                </label>
                <select
                  id="days"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="input"
                >
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={180}>Last 6 months</option>
                  <option value={365}>Last year</option>
                  <option value={730}>Last 2 years</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Tests"
              value={stats.count}
              icon={Activity}
              color="bg-primary-500"
            />
            <StatCard
              title="Abnormal Results"
              value={stats.abnormalCount}
              subtitle={`${stats.abnormalPercentage.toFixed(1)}% of total`}
              icon={AlertTriangle}
              color="bg-danger-500"
            />
            <StatCard
              title="Average Value"
              value={stats.average ? stats.average.toFixed(2) : 'N/A'}
              icon={TrendingUp}
              color="bg-success-500"
            />
            <StatCard
              title="Range"
              value={stats.min && stats.max ? `${stats.min.toFixed(2)} - ${stats.max.toFixed(2)}` : 'N/A'}
              icon={Calendar}
              color="bg-secondary-500"
            />
          </div>
        )}

        {/* Charts */}
        {selectedPatient && selectedParameter && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trend Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Parameter Trend</h3>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="spinner w-8 h-8"></div>
                  </div>
                ) : trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={formatDate}
                        formatter={(value: any, name: any) => [
                          `${value} ${trends[0]?.unit || ''}`,
                          selectedParameter
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-center">
                    <div>
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No trend data available for this parameter</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Abnormal Results Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Abnormal Results</h3>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="spinner w-8 h-8"></div>
                  </div>
                ) : trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trends.filter(t => t.isAbnormal)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={formatDate}
                        formatter={(value: any) => [
                          `${value} ${trends[0]?.unit || ''}`,
                          'Abnormal Value'
                        ]}
                      />
                      <Bar dataKey="value" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-center">
                    <div>
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No abnormal results found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Selection State */}
        {(!selectedPatient || !selectedParameter) && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Patient and Parameter</h3>
            <p className="text-gray-600">Choose a patient and parameter from the controls above to view trends</p>
          </div>
        )}
      </main>
    </div>
  )
} 