'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Filter, 
  Search, 
  AlertTriangle,
  TrendingUp,
  Eye
} from 'lucide-react'
import { getParameterCategoryColor, formatDate } from '@/lib/utils'

interface Patient {
  id: string
  name: string
}

interface Parameter {
  id: string
  name: string
  value: number
  unit?: string
  referenceRange?: string
  isAbnormal: boolean
  category: string
  bloodTest: {
    testDate: string
    labName?: string
  }
  patient: {
    name: string
  }
}

export default function ParametersPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [abnormalOnly, setAbnormalOnly] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    fetchParameters()
  }, [selectedPatient, selectedCategory, abnormalOnly, search])

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
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50',
        ...(selectedPatient && { patientId: selectedPatient }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(abnormalOnly && { abnormalOnly: 'true' }),
        ...(search && { search })
      })

      const response = await fetch(`/api/parameters?${params}`)
      const data = await response.json()

      if (data.success) {
        setParameters(data.data)
      }
    } catch (error) {
      console.error('Error fetching parameters:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'HEMATOLOGY',
    'BIOCHEMISTRY',
    'LIPID_PROFILE',
    'THYROID_FUNCTION',
    'LIVER_FUNCTION',
    'KIDNEY_FUNCTION',
    'DIABETES',
    'CARDIOVASCULAR',
    'INFLAMMATION',
    'OTHER'
  ]

  const ParameterCard = ({ parameter }: { parameter: Parameter }) => (
    <div className={`card p-6 ${parameter.isAbnormal ? 'border-danger-200 bg-danger-50' : 'border-success-200 bg-success-50'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{parameter.name}</h3>
          <p className="text-sm text-gray-600">{parameter.patient.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={getParameterCategoryColor(parameter.category)}>
            {parameter.category.replace('_', ' ')}
          </span>
          {parameter.isAbnormal && (
            <span className="badge badge-danger">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Abnormal
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Value:</span>
          <span className="font-semibold text-gray-900">
            {parameter.value} {parameter.unit}
          </span>
        </div>
        
        {parameter.referenceRange && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Reference Range:</span>
            <span className="text-sm text-gray-700">{parameter.referenceRange}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Test Date:</span>
          <span className="text-sm text-gray-700">{formatDate(parameter.bloodTest.testDate)}</span>
        </div>

        {parameter.bloodTest.labName && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Lab:</span>
            <span className="text-sm text-gray-700">{parameter.bloodTest.labName}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="btn btn-sm btn-outline w-full">
          <TrendingUp className="w-4 h-4 mr-2" />
          View Trends
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blood Parameters</h1>
          <p className="text-gray-600">View and analyze extracted blood test parameters</p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="patient" className="label block mb-2">
                  Patient
                </label>
                <select
                  id="patient"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="input"
                >
                  <option value="">All Patients</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="label block mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="search" className="label block mb-2">
                  Search Parameters
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by parameter name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={abnormalOnly}
                    onChange={(e) => setAbnormalOnly(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Abnormal Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Parameters Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner w-8 h-8"></div>
          </div>
        ) : parameters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parameters.map((parameter) => (
              <ParameterCard key={parameter.id} parameter={parameter} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Parameters Found</h3>
            <p className="text-gray-600">
              {search || selectedPatient || selectedCategory || abnormalOnly
                ? 'Try adjusting your filters'
                : 'No parameters have been extracted yet. Upload a blood test to get started.'
              }
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {parameters.length > 0 && (
          <div className="mt-8 card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{parameters.length}</p>
                  <p className="text-sm text-gray-600">Total Parameters</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-danger-600">
                    {parameters.filter(p => p.isAbnormal).length}
                  </p>
                  <p className="text-sm text-gray-600">Abnormal Results</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">
                    {new Set(parameters.map(p => p.patient.name)).size}
                  </p>
                  <p className="text-sm text-gray-600">Patients</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-600">
                    {new Set(parameters.map(p => p.category)).size}
                  </p>
                  <p className="text-sm text-gray-600">Categories</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 