import { z } from 'zod'

// Database Types
export interface Patient {
  id: string
  name: string
  email?: string
  dateOfBirth?: Date
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  createdAt: Date
  updatedAt: Date
}

export interface BloodTest {
  id: string
  patientId: string
  testDate: Date
  labName?: string
  reportNumber?: string
  pdfUrl?: string
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: Date
  updatedAt: Date
  patient?: Patient
  parameters?: BloodParameter[]
}

export interface BloodParameter {
  id: string
  patientId: string
  bloodTestId: string
  name: string
  value: number
  unit?: string
  referenceRange?: string
  isAbnormal: boolean
  category: ParameterCategory
  createdAt: Date
  updatedAt: Date
  patient?: Patient
  bloodTest?: BloodTest
  relationships?: ParameterRelationship[]
}

export interface ParameterRelationship {
  id: string
  sourceParameterId: string
  targetParameterId: string
  relationshipType: RelationshipType
  strength: number
  description?: string
  createdAt: Date
  sourceParameter?: BloodParameter
  targetParameter?: BloodParameter
}

export type ParameterCategory = 
  | 'HEMATOLOGY'
  | 'BIOCHEMISTRY'
  | 'LIPID_PROFILE'
  | 'THYROID_FUNCTION'
  | 'LIVER_FUNCTION'
  | 'KIDNEY_FUNCTION'
  | 'DIABETES'
  | 'CARDIOVASCULAR'
  | 'INFLAMMATION'
  | 'OTHER'

export type RelationshipType = 
  | 'POSITIVE_CORRELATION'
  | 'NEGATIVE_CORRELATION'
  | 'INVERSE'
  | 'SYNERGISTIC'
  | 'ANTAGONISTIC'
  | 'CAUSAL'
  | 'ASSOCIATED'

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// PDF Processing Types
export interface ExtractedParameter {
  name: string
  value: number
  unit?: string
  referenceRange?: string
  category: ParameterCategory
  confidence: number
}

export interface PdfExtractionResult {
  patientInfo: {
    name?: string
    dateOfBirth?: string
    gender?: string
  }
  testInfo: {
    testDate?: string
    labName?: string
    reportNumber?: string
  }
  parameters: ExtractedParameter[]
  confidence: number
}

// Chart and Visualization Types
export interface ParameterTrend {
  date: Date
  value: number
  isAbnormal: boolean
}

export interface ParameterComparison {
  parameter: string
  currentValue: number
  previousValue: number
  change: number
  changePercent: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface KnowledgeGraphNode {
  id: string
  name: string
  category: ParameterCategory
  value?: number
  unit?: string
  isAbnormal?: boolean
  referenceRange?: string
  x?: number
  y?: number
}

export interface KnowledgeGraphLink {
  source: string
  target: string
  relationshipType: RelationshipType
  strength: number
  description?: string
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[]
  links: KnowledgeGraphLink[]
}

// Form Validation Schemas
export const PatientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
})

export const BloodTestUploadSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  testDate: z.string().min(1, 'Test date is required'),
  labName: z.string().optional(),
  reportNumber: z.string().optional(),
})

// Component Props Types
export interface ChartProps {
  data: any[]
  width?: number
  height?: number
  className?: string
}

export interface ParameterCardProps {
  parameter: BloodParameter
  showTrend?: boolean
  trendData?: ParameterTrend[]
}

export interface UploadZoneProps {
  onUpload: (file: File) => void
  isLoading?: boolean
  accept?: string
  maxSize?: number
}

// Utility Types
export type StatusColor = 'success' | 'warning' | 'danger' | 'info'

export interface FilterOptions {
  category?: ParameterCategory[]
  dateRange?: {
    start: Date
    end: Date
  }
  abnormalOnly?: boolean
  search?: string
}

export interface SortOptions {
  field: keyof BloodParameter | 'testDate'
  direction: 'asc' | 'desc'
} 