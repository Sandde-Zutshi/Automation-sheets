'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2,
  Eye,
  Calendar,
  Mail
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Patient {
  id: string
  name: string
  email?: string
  dateOfBirth?: string
  gender?: string
  createdAt: string
  _count: {
    bloodTests: number
  }
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchPatients()
  }, [page, search])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search })
      })

      const response = await fetch(`/api/patients?${params}`)
      const data = await response.json()

      if (data.success) {
        setPatients(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPatients()
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
    }
  }

  const PatientCard = ({ patient }: { patient: Patient }) => (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
            {patient.gender && (
              <span className="badge badge-info">{patient.gender}</span>
            )}
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            {patient.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.dateOfBirth && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(patient.dateOfBirth)}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span>Blood Tests: {patient._count.bloodTests}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href={`/patients/${patient.id}`}
            className="btn btn-sm btn-outline"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/patients/${patient.id}/edit`}
            className="btn btn-sm btn-outline"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleDelete(patient.id)}
            className="btn btn-sm btn-outline text-danger-600 hover:bg-danger-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
              <p className="text-gray-600">Manage patient records and blood test history</p>
            </div>
            <Link href="/patients/new" className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search patients by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <button className="btn btn-outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Patients Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner w-8 h-8"></div>
          </div>
        ) : patients.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {patients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} patients
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn btn-sm btn-outline disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="btn btn-sm btn-outline disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600 mb-6">
              {search ? 'Try adjusting your search terms' : 'Get started by adding your first patient'}
            </p>
            {!search && (
              <Link href="/patients/new" className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
} 