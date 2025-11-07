const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : 'http://localhost:8000'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Users
  async getUsers() {
    return this.request('/api/users/')
  }

  async getUser(id: number) {
    return this.request(`/api/users/${id}`)
  }

  async createUser(userData: any) {
    return this.request('/api/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(id: number, userData: any) {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: number) {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    })
  }

  // Cases
  async getCases(params?: { status?: string; detective_id?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append('status', params.status)
    if (params?.detective_id) searchParams.append('detective_id', params.detective_id.toString())
    
    const query = searchParams.toString()
    return this.request(`/api/cases/${query ? `?${query}` : ''}`)
  }

  async getCase(id: number) {
    return this.request(`/api/cases/${id}`)
  }

  async createCase(caseData: any) {
    return this.request('/api/cases/', {
      method: 'POST',
      body: JSON.stringify(caseData),
    })
  }

  async updateCase(id: number, caseData: any) {
    return this.request(`/api/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(caseData),
    })
  }

  async deleteCase(id: number) {
    return this.request(`/api/cases/${id}`, {
      method: 'DELETE',
    })
  }

  async deleteCasePermanent(id: number) {
    return this.request(`/api/cases/${id}/permanent`, {
      method: 'DELETE',
    })
  }

  // Evidence
  async getCaseEvidence(caseId: number) {
    return this.request(`/api/cases/${caseId}/evidence`)
  }

  async getCaseSuspects(caseId: number) {
    return this.request(`/api/cases/${caseId}/suspects`)
  }

  async linkSuspectToCaseFromCase(caseId: number, suspectId: number, role: string = 'suspect') {
    return this.request(`/api/cases/${caseId}/suspects/${suspectId}?role_in_case=${role}`, {
      method: 'POST',
    })
  }

  async unlinkSuspectFromCaseFromCase(caseId: number, suspectId: number) {
    return this.request(`/api/cases/${caseId}/suspects/${suspectId}`, {
      method: 'DELETE',
    })
  }

  async createEvidence(evidenceData: any) {
    return this.request('/api/evidence/', {
      method: 'POST',
      body: JSON.stringify(evidenceData),
    })
  }

  async updateEvidence(id: number, evidenceData: any) {
    return this.request(`/api/evidence/${id}`, {
      method: 'PUT',
      body: JSON.stringify(evidenceData),
    })
  }

  async deleteEvidence(id: number) {
    return this.request(`/api/evidence/${id}`, {
      method: 'DELETE',
    })
  }

  // Expose request method for direct API calls
  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request(endpoint, options)
  }

  // Analytics
  async getAnalyticsOverview() {
    return this.request('/api/analytics/overview')
  }

  async getDetectiveStats() {
    return this.request('/api/analytics/detectives')
  }

  async getCasesByMonth() {
    return this.request('/api/analytics/cases-by-month')
  }

  async getCasesByStatus() {
    return this.request('/api/analytics/cases-by-status')
  }

  async getRecentActivity() {
    return this.request('/api/analytics/recent-activity')
  }

  // AI
  async analyzeCase(caseId: number, analysisType: string) {
    return this.request('/api/ai/analyze-case', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId, analysis_type: analysisType }),
    })
  }

  async predictCharges(caseId: number) {
    return this.request(`/api/ai/predict-charges?case_id=${caseId}`, {
      method: 'POST',
    })
  }

  // Suspects
  async getSuspects(params?: { search?: string; status?: string; risk_level?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.risk_level) searchParams.append('risk_level', params.risk_level)
    
    const query = searchParams.toString()
    return this.request(`/api/suspects/${query ? `?${query}` : ''}`)
  }

  async getSuspect(id: number) {
    return this.request(`/api/suspects/${id}`)
  }

  async createSuspect(suspectData: any) {
    return this.request('/api/suspects/', {
      method: 'POST',
      body: JSON.stringify(suspectData),
    })
  }

  async updateSuspect(id: number, suspectData: any) {
    return this.request(`/api/suspects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(suspectData),
    })
  }

  async deleteSuspect(id: number) {
    return this.request(`/api/suspects/${id}`, {
      method: 'DELETE',
    })
  }

  async getSuspectCases(suspectId: number) {
    return this.request(`/api/suspects/${suspectId}/cases`)
  }

  async getSuspectVehicles(suspectId: number) {
    return this.request(`/api/suspects/${suspectId}/vehicles`)
  }

  async createSuspectVehicle(suspectId: number, vehicleData: any) {
    return this.request(`/api/suspects/${suspectId}/vehicles`, {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    })
  }

  async updateSuspectVehicle(suspectId: number, vehicleId: number, vehicleData: any) {
    return this.request(`/api/suspects/${suspectId}/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    })
  }

  async deleteSuspectVehicle(suspectId: number, vehicleId: number) {
    return this.request(`/api/suspects/${suspectId}/vehicles/${vehicleId}`, {
      method: 'DELETE',
    })
  }

  async linkSuspectToCase(suspectId: number, caseId: number, role: string = 'suspect') {
    return this.request(`/api/suspects/${suspectId}/link-case/${caseId}?role_in_case=${role}`, {
      method: 'POST',
    })
  }

  async unlinkSuspectFromCase(suspectId: number, caseId: number) {
    return this.request(`/api/suspects/${suspectId}/unlink-case/${caseId}`, {
      method: 'DELETE',
    })
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

export const api = new ApiClient()
export default api