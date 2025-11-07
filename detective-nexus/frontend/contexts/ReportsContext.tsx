'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { getUserPermissions, getRankDisplayName } from '@/lib/permissions'

export interface Report {
  id: string
  title: string
  type: 'monthly' | 'weekly' | 'case_summary' | 'performance'
  createdBy: string
  createdByRank: string
  createdAt: string
  downloadUrl?: string
  summary: {
    totalCases: number
    activeCases: number
    closedCases: number
    solveRate: number
  }
}

interface ReportsContextType {
  reports: Report[]
  addReport: (report: Omit<Report, 'id' | 'createdAt' | 'createdBy' | 'createdByRank'>) => void
  refreshReports: () => void
  loading: boolean
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined)

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const permissions = getUserPermissions(user)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  // Загружаем начальные демо-отчеты
  useEffect(() => {
    if (permissions.canViewReports) {
      loadInitialReports()
    } else {
      setLoading(false)
    }
  }, [permissions.canViewReports])

  const loadInitialReports = () => {
    const demoReports: Report[] = [
      {
        id: '1',
        title: 'Месячный отчет - Ноябрь 2025',
        type: 'monthly',
        createdBy: 'Иванов Иван Иванович',
        createdByRank: 'senior_detective',
        createdAt: '2025-11-06T10:30:00Z',
        summary: {
          totalCases: 45,
          activeCases: 12,
          closedCases: 33,
          solveRate: 73
        }
      },
      {
        id: '2',
        title: 'Отчет по эффективности - Q4 2025',
        type: 'performance',
        createdBy: 'Петров Петр Петрович',
        createdByRank: 'lieutenant',
        createdAt: '2025-11-05T14:15:00Z',
        summary: {
          totalCases: 128,
          activeCases: 23,
          closedCases: 105,
          solveRate: 82
        }
      },
      {
        id: '3',
        title: 'Недельная сводка по делам',
        type: 'weekly',
        createdBy: 'Сидоров Сидор Сидорович',
        createdByRank: 'captain',
        createdAt: '2025-11-04T09:00:00Z',
        summary: {
          totalCases: 15,
          activeCases: 8,
          closedCases: 7,
          solveRate: 47
        }
      }
    ]
    
    setReports(demoReports)
    setLoading(false)
  }

  const addReport = (reportData: Omit<Report, 'id' | 'createdAt' | 'createdBy' | 'createdByRank'>) => {
    if (!user) return

    const newReport: Report = {
      ...reportData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      createdBy: user.full_name,
      createdByRank: user.rank
    }

    setReports(prev => [newReport, ...prev]) // Добавляем в начало списка (новые сверху)
  }

  const refreshReports = () => {
    loadInitialReports()
  }

  return (
    <ReportsContext.Provider value={{
      reports,
      addReport,
      refreshReports,
      loading
    }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  const context = useContext(ReportsContext)
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider')
  }
  return context
}