'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Network, 
  Upload, 
  Activity,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    bloodTests: 0,
    parameters: 0,
    abnormalResults: 0
  })

  const [recentTests, setRecentTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const [patientsRes, bloodTestsRes, parametersRes] = await Promise.all([
        fetch('/api/patients?limit=1'),
        fetch('/api/blood-tests?limit=1'),
        fetch('/api/parameters?limit=1')
      ])

      const patientsData = await patientsRes.json()
      const bloodTestsData = await bloodTestsRes.json()
      const parametersData = await parametersRes.json()

      setStats({
        patients: patientsData.pagination?.total || 0,
        bloodTests: bloodTestsData.pagination?.total || 0,
        parameters: parametersData.pagination?.total || 0,
        abnormalResults: 0 // Will be calculated separately
      })

      // Fetch recent blood tests
      const recentRes = await fetch('/api/blood-tests?limit=5')
      const recentData = await recentRes.json()
      setRecentTests(recentData.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</p>
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  const QuickAction = ({ title, description, icon: Icon, href, color }: any) => (
    <Link href={href} className="card p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-4">
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Comprehensive PDF analysis with AI-powered insights</p>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value={stats.patients}
            icon={Users}
            color="bg-primary-500"
          />
          <StatCard
            title="Blood Tests"
            value={stats.bloodTests}
            icon={FileText}
            color="bg-secondary-500"
          />
          <StatCard
            title="Parameters"
            value={stats.parameters}
            icon={Activity}
            color="bg-success-500"
          />
          <StatCard
            title="Abnormal Results"
            value={stats.abnormalResults}
            icon={TrendingUp}
            color="bg-warning-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickAction
              title="Add Patient"
              description="Create a new patient record"
              icon={Plus}
              href="/patients/new"
              color="bg-primary-500"
            />
            <QuickAction
              title="Upload Blood Test"
              description="Process a new PDF report"
              icon={Upload}
              href="/blood-tests/upload"
              color="bg-secondary-500"
            />
            <QuickAction
              title="View Trends"
              description="Analyze parameter trends over time"
              icon={TrendingUp}
              href="/trends"
              color="bg-success-500"
            />
            <QuickAction
              title="Knowledge Graph"
              description="Explore parameter relationships"
              icon={Network}
              href="/knowledge-graph"
              color="bg-warning-500"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Blood Tests */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Recent Blood Tests</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="spinner w-8 h-8"></div>
                </div>
              ) : recentTests.length > 0 ? (
                <div className="space-y-4">
                  {recentTests.map((test: any) => (
                    <div key={test.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{test.patient?.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(test.testDate).toLocaleDateString()} • {test.labName}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          'status-indicator',
                          test.status === 'COMPLETED' ? 'status-completed' :
                          test.status === 'FAILED' ? 'status-failed' : 'status-processing'
                        )}>
                          {test.status}
                        </span>
                        <Link href={`/blood-tests/${test.id}`} className="text-primary-600 hover:text-primary-700">
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No blood tests uploaded yet</p>
                  <Link href="/blood-tests/upload" className="text-primary-600 hover:text-primary-700">
                    Upload your first test
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">PDF Processing</span>
                  <span className="badge badge-success">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AI Analysis</span>
                  <span className="badge badge-success">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database</span>
                  <span className="badge badge-success">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Knowledge Graph</span>
                  <span className="badge badge-success">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 