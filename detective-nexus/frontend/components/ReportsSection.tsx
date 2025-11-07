'use client'

import { FileText, Download, Calendar, User, TrendingUp, Clock } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getUserPermissions, getRankDisplayName } from '@/lib/permissions'
import { useReports, Report } from '@/contexts/ReportsContext'

export default function ReportsSection() {
  const { user } = useCurrentUser()
  const permissions = getUserPermissions(user)
  const { reports, loading } = useReports()

  const getReportTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'monthly': return <Calendar className="h-5 w-5" />
      case 'weekly': return <Clock className="h-5 w-5" />
      case 'performance': return <TrendingUp className="h-5 w-5" />
      case 'case_summary': return <FileText className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getReportTypeName = (type: Report['type']) => {
    switch (type) {
      case 'monthly': return 'Месячный отчет'
      case 'weekly': return 'Недельный отчет'
      case 'performance': return 'Отчет по эффективности'
      case 'case_summary': return 'Сводка по делам'
      default: return 'Отчет'
    }
  }

  if (!permissions.canViewReports) {
    return (
      <div className="police-card rounded-2xl p-6 text-center">
        <FileText className="h-12 w-12 text-police-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Отчеты недоступны</h3>
        <p className="text-police-300 text-sm">
          Просмотр отчетов доступен с звания старшего детектива и выше
        </p>
        <p className="text-police-400 text-xs mt-2">
          Ваше текущее звание: {getRankDisplayName(user?.rank || '')}
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="police-card rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-police-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-police-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="police-card rounded-2xl shadow-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-police-700/30 bg-police-900/50">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-badge-500 to-badge-600 rounded-full mr-3"></div>
            Отчеты департамента
          </h3>
          <div className="flex items-center gap-2 text-sm text-police-300">
            <User className="h-4 w-4" />
            <span>Доступно для {getRankDisplayName(user?.rank || '')}+</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-police-700/30">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="px-6 py-4 hover:bg-police-800/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 bg-police-800/50 rounded-xl border border-police-700/30">
                    {getReportTypeIcon(report.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-white">{report.title}</h4>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-badge-500/20 text-badge-400 border border-badge-500/30">
                        {getReportTypeName(report.type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-police-300 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-police-400" />
                        <span className="text-white font-medium">{report.createdBy}</span>
                        <span className="px-2 py-1 text-xs bg-badge-500/10 text-badge-400 rounded-full border border-badge-500/20">
                          {getRankDisplayName(report.createdByRank)}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-police-400" />
                        <span>{new Date(report.createdAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-police-800/30 rounded-lg p-2 border border-police-700/20">
                        <div className="text-xs text-police-400">Всего дел</div>
                        <div className="text-sm font-medium text-white">{report.summary.totalCases}</div>
                      </div>
                      <div className="bg-police-800/30 rounded-lg p-2 border border-police-700/20">
                        <div className="text-xs text-police-400">Активных</div>
                        <div className="text-sm font-medium text-warning-400">{report.summary.activeCases}</div>
                      </div>
                      <div className="bg-police-800/30 rounded-lg p-2 border border-police-700/20">
                        <div className="text-xs text-police-400">Закрытых</div>
                        <div className="text-sm font-medium text-success-400">{report.summary.closedCases}</div>
                      </div>
                      <div className="bg-police-800/30 rounded-lg p-2 border border-police-700/20">
                        <div className="text-xs text-police-400">Раскрываемость</div>
                        <div className="text-sm font-medium text-badge-400">{report.summary.solveRate}%</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 bg-police-700 hover:bg-police-600 text-police-300 hover:text-white rounded-lg transition-colors text-sm">
                    <Download className="h-4 w-4" />
                    Скачать
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <FileText className="h-12 w-12 text-police-400 mx-auto mb-4" />
            <p className="text-police-300">Отчеты не найдены</p>
            <p className="text-sm text-police-400 mt-2">Отчеты будут отображаться здесь после создания</p>
          </div>
        )}
      </div>
    </div>
  )
}