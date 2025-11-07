// Export utilities for Detective Nexus

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  filename?: string
  data: any[]
  columns?: string[]
}

export class ExportService {
  static exportToCSV(data: any[], filename: string = 'export.csv', columns?: string[]) {
    if (data.length === 0) return

    // Get headers from first object or use provided columns
    const headers = columns || Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    this.downloadFile(csvContent, filename, 'text/csv')
  }

  static exportToJSON(data: any[], filename: string = 'export.json') {
    const jsonContent = JSON.stringify(data, null, 2)
    this.downloadFile(jsonContent, filename, 'application/json')
  }

  static exportCasesToCSV(cases: any[]) {
    const columns = [
      'case_number',
      'title', 
      'status',
      'priority',
      'crime_type',
      'location',
      'created_at',
      'updated_at'
    ]
    
    const processedData = cases.map(case_ => ({
      ...case_,
      created_at: new Date(case_.created_at).toLocaleDateString('ru-RU'),
      updated_at: new Date(case_.updated_at).toLocaleDateString('ru-RU'),
      status: case_.status === 'active' ? 'Активно' : 
              case_.status === 'closed' ? 'Закрыто' : 'Архив',
      priority: case_.priority === 'urgent' ? 'Срочно' :
                case_.priority === 'high' ? 'Высокий' :
                case_.priority === 'medium' ? 'Средний' : 'Низкий'
    }))

    this.exportToCSV(processedData, `cases_${new Date().toISOString().split('T')[0]}.csv`, columns)
  }

  static generateReport(stats: any, cases: any[]) {
    const reportData = {
      generated_at: new Date().toISOString(),
      summary: {
        total_cases: stats.total_cases,
        active_cases: stats.active_cases,
        closed_cases: stats.closed_cases,
        solve_rate: stats.solve_rate
      },
      cases: cases.map(case_ => ({
        case_number: case_.case_number,
        title: case_.title,
        status: case_.status,
        priority: case_.priority,
        crime_type: case_.crime_type,
        created_at: case_.created_at,
        days_open: case_.status === 'active' ? 
          Math.floor((new Date().getTime() - new Date(case_.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 
          null
      }))
    }

    this.exportToJSON([reportData], `detective_report_${new Date().toISOString().split('T')[0]}.json`)
  }

  private static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}