'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  User, 
  Calendar,
  Building,
  Hash,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

interface Patient {
  id: string
  name: string
  email?: string
}

export default function UploadPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [testDate, setTestDate] = useState('')
  const [labName, setLabName] = useState('')
  const [reportNumber, setReportNumber] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchPatients()
  }, [])

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

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === 'application/pdf') {
      setFile(file)
      setErrorMessage('')
    } else {
      setErrorMessage('Please select a valid PDF file')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatient || !testDate || !file) {
      setErrorMessage('Please fill in all required fields and select a PDF file')
      return
    }

    setUploading(true)
    setUploadStatus('uploading')
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('patientId', selectedPatient)
      formData.append('testDate', testDate)
      formData.append('labName', labName)
      formData.append('reportNumber', reportNumber)
      formData.append('file', file)

      const response = await fetch('/api/blood-tests', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setUploadStatus('success')
        setTimeout(() => {
          router.push(`/blood-tests/${data.data.id}`)
        }, 2000)
      } else {
        setUploadStatus('error')
        setErrorMessage(data.error || 'Upload failed')
      }
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage('Network error occurred')
    } finally {
      setUploading(false)
    }
  }

  const UploadZone = () => (
    <div
      {...getRootProps()}
      className={`upload-zone ${isDragActive ? 'dragover' : ''} ${
        file ? 'border-success-400 bg-success-50' : ''
      }`}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success-600" />
          <h3 className="text-lg font-medium text-success-900 mb-2">File Selected</h3>
          <p className="text-success-700 mb-2">{file.name}</p>
          <p className="text-sm text-success-600">{formatFileSize(file.size)}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setFile(null)
            }}
            className="mt-2 text-sm text-success-600 hover:text-success-700 underline"
          >
            Remove file
          </button>
        </div>
      ) : (
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop the PDF here' : 'Upload Blood Test PDF'}
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your PDF file here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Only PDF files are supported
          </p>
        </div>
      )}
    </div>
  )

  const StatusMessage = () => {
    if (uploadStatus === 'idle') return null

    const statusConfig = {
      uploading: {
        icon: Loader,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        text: 'Processing PDF and extracting parameters...'
      },
      success: {
        icon: CheckCircle,
        color: 'text-success-600',
        bgColor: 'bg-success-50',
        text: 'Upload successful! Redirecting to results...'
      },
      error: {
        icon: AlertCircle,
        color: 'text-danger-600',
        bgColor: 'bg-danger-50',
        text: errorMessage
      }
    }

    const config = statusConfig[uploadStatus]
    const Icon = config.icon

    return (
      <div className={`p-4 rounded-lg ${config.bgColor} border border-current ${config.color}`}>
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 ${uploadStatus === 'uploading' ? 'animate-spin' : ''}`} />
          <span className="font-medium">{config.text}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upload Blood Test</h1>
              <p className="text-gray-600">Process PDF reports with AI-powered parameter extraction</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Patient Selection */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Patient Information
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <label htmlFor="patient" className="label block mb-2">
                    Patient *
                  </label>
                  <select
                    id="patient"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} {patient.email && `(${patient.email})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="testDate" className="label block mb-2">
                      Test Date *
                    </label>
                    <input
                      type="date"
                      id="testDate"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="labName" className="label block mb-2">
                      Lab Name
                    </label>
                    <input
                      type="text"
                      id="labName"
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      placeholder="e.g., LabCorp, Quest Diagnostics"
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reportNumber" className="label block mb-2">
                    Report Number
                  </label>
                  <input
                    type="text"
                    id="reportNumber"
                    value={reportNumber}
                    onChange={(e) => setReportNumber(e.target.value)}
                    placeholder="e.g., BT-2024-001"
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                PDF Upload
              </h2>
            </div>
            <div className="card-body">
              <UploadZone />
            </div>
          </div>

          {/* Status Message */}
          <StatusMessage />

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-outline"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedPatient || !testDate || !file}
              className="btn btn-primary"
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Blood Test
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
} 