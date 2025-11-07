// User types
export interface User {
  id: number
  discord_id: string
  username: string
  full_name: string
  rank: 'detective' | 'senior_detective' | 'lieutenant' | 'captain' | 'major' | 'admin'
  department: string
  badge_number: string
  hire_date: string
  is_active: boolean
  avatar_url?: string
  created_at: string
}

// Role permissions
export interface RolePermissions {
  canCreateReports: boolean
  canEditProfiles: boolean
  canViewReports: boolean
  canManageDetectives: boolean
  canAccessAdmin: boolean
}

// Role hierarchy levels
export const ROLE_HIERARCHY = {
  'detective': 1,
  'senior_detective': 2,
  'lieutenant': 3,
  'captain': 4,
  'major': 5,
  'admin': 6
} as const

export type UserRank = keyof typeof ROLE_HIERARCHY

// Case types
export interface Case {
  id: number
  case_number: string
  title: string
  description: string
  status: 'active' | 'closed' | 'archived' | 'draft'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  crime_type: string
  location: string
  suspect_info?: string
  victim_info?: string
  detective_id: number
  created_at: string
  updated_at: string
  closed_at?: string
}

// Evidence types
export interface Evidence {
  id: number
  case_id: number
  evidence_type: 'document' | 'photo' | 'video' | 'audio' | 'physical' | 'digital'
  title: string
  description: string
  file_url?: string
  file_name?: string
  file_size?: number
  chain_of_custody?: string
  added_by: number
  created_at: string
}

// Analytics types
export interface CaseStats {
  total_cases: number
  active_cases: number
  closed_cases: number
  archived_cases: number
  solve_rate: number
}

export interface DetectiveStats {
  detective_id: number
  detective_name: string
  total_cases: number
  closed_cases: number
  avg_close_time?: number
}

export interface RecentActivity {
  case_id: number
  case_number: string
  title: string
  status: string
  detective_name: string
  updated_at: string
}

// AI types
export interface AIAnalysis {
  id: number
  case_id: number
  analysis_type: string
  result: string
  confidence?: number
  analysis_metadata?: string
  created_at: string
}

export interface AIAnalysisRequest {
  case_id: number
  analysis_type: 'similarity' | 'charge_prediction' | 'priority'
}

export interface AIAnalysisResponse {
  analysis_type: string
  result: string
  confidence?: number
  suggestions: string[]
}

export interface ChargePredictionResponse {
  predicted_charge: string
  confidence: number
  alternative_charges: string[]
  reasoning: string
}

// Notification types
export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  notification_type: string
  is_read: boolean
  related_case_id?: number
  created_at: string
}

// Journal types
export interface JournalEntry {
  id: number
  user_id: number
  shift_date: string
  title: string
  notes: string
  created_at: string
  updated_at: string
}

// Suspect types
export interface Suspect {
  id: number
  full_name: string
  aliases?: string
  date_of_birth?: string
  place_of_birth?: string
  nationality?: string
  gender?: string
  height?: string
  weight?: string
  eye_color?: string
  hair_color?: string
  distinguishing_marks?: string
  last_known_address?: string
  phone_numbers?: string
  email_addresses?: string
  criminal_record?: string
  previous_arrests?: string
  known_associates?: string
  status: 'active' | 'arrested' | 'cleared' | 'deceased' | 'unknown'
  risk_level: 'low' | 'medium' | 'high' | 'extreme'
  occupation?: string
  education?: string
  notes?: string
  photo_url?: string
  // Новые поля
  vehicle_info?: string
  gang_affiliation?: string
  is_informant?: boolean
  connections?: Array<{
    suspect_id: number
    suspect_name: string
    relationship_type: string
    description: string
  }>
  created_by: number
  created_at: string
  updated_at: string
}

// Vehicle types
export interface Vehicle {
  id: number
  suspect_id: number
  make?: string
  color?: string
  owner?: string
  plate?: string
  created_at: string
}