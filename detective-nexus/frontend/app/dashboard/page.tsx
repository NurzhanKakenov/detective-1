'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { api } from '@/lib/api'
import { FileText, Users, CheckCircle, Clock, TrendingUp, AlertTriangle, X, Shield } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { ExportService } from '@/lib/export'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getUserPermissions, getRankDisplayName } from '@/lib/permissions'
import ReportsSection from '@/components/ReportsSection'
import { useReports } from '@/contexts/ReportsContext'

interface CaseStats {
  total_cases: number
  active_cases: number
  closed_cases: number
  archived_cases: number
  solve_rate: number
}

interface RecentActivity {
  case_id: number
  case_number: string
  title: string
  status: string
  detective_name: string
  updated_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { addNotification, addDemoNotification } = useNotifications()
  const { user, loading: userLoading } = useCurrentUser()
  const permissions = getUserPermissions(user)
  const { addReport } = useReports()
  
  const [stats, setStats] = useState<CaseStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showAddDetectiveModal, setShowAddDetectiveModal] = useState(false)
  const [showCreateReportModal, setShowCreateReportModal] = useState(false)
  
  // Report form state
  const [reportForm, setReportForm] = useState({
    type: 'case_summary' as 'monthly' | 'weekly' | 'case_summary' | 'performance',
    title: ''
  })

  // Form state for adding detective
  const [newDetective, setNewDetective] = useState({
    username: '',
    full_name: '',
    email: '',
    rank: '',
    department: '',
    badge_number: ''
  })
  const [addingDetective, setAddingDetective] = useState(false)

  useEffect(() => {
    loadDashboardData()
    
    // Set up periodic refresh for real-time updates (much less frequent)
    const interval = setInterval(() => {
      loadDashboardData()
    }, 300000) // Refresh every 5 minutes instead of 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getRecentActivity()
      ])
      
      setStats(statsData as CaseStats)
      setRecentActivity(activityData as RecentActivity[])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Quick action handlers
  const handleCreateCase = () => {
    router.push('/cases?action=create')
  }

  const handleAddDetective = () => {
    if (!permissions.canManageDetectives) {
      addNotification({
        type: 'error',
        title: 'Доступ запрещен',
        message: 'У вас нет прав для добавления детективов. Требуется звание лейтенанта или выше.'
      })
      return
    }
    setShowAddDetectiveModal(true)
  }

  const handleCreateReport = () => {
    if (!permissions.canCreateReports) {
      addNotification({
        type: 'error',
        title: 'Доступ запрещен',
        message: 'У вас нет прав для создания отчетов. Требуется звание старшего детектива или выше.'
      })
      return
    }
    setShowCreateReportModal(true)
  }

  const handleAddDetectiveSubmit = async () => {
    setAddingDetective(true)
    try {
      // Генерируем уникальный discord_id для демо
      const detectiveData = {
        ...newDetective,
        discord_id: `demo_${newDetective.username}_${Date.now()}`,
        hire_date: new Date().toISOString()
      }
      
      console.log('Создаем пользователя с данными:', detectiveData)
      await api.createUser(detectiveData)
      
      addNotification({
        type: 'success',
        title: 'Детектив добавлен',
        message: `Детектив ${newDetective.full_name} успешно добавлен в систему`,
        action: {
          label: 'Посмотреть профиль',
          href: '/admin'
        }
      })
      
      setShowAddDetectiveModal(false)
      setNewDetective({
        username: '',
        full_name: '',
        email: '',
        rank: '',
        department: '',
        badge_number: ''
      })
    } catch (error) {
      console.error('Failed to add detective:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      addNotification({
        type: 'error',
        title: 'Ошибка добавления детектива',
        message: `Не удалось добавить детектива: ${errorMessage}`
      })
    } finally {
      setAddingDetective(false)
    }
  }

  const handleCreateReportSubmit = async () => {
    try {
      // Get current cases for report
      const cases = await api.getCases()
      
      // Generate and download report
      if (stats) {
        ExportService.generateReport(stats, cases as any[])
        
        // Добавляем отчет в контекст для отображения
        const reportTitle = reportForm.title || `Отчет от ${new Date().toLocaleDateString('ru-RU')} - ${getRankDisplayName(user?.rank || '')}`
        addReport({
          title: reportTitle,
          type: reportForm.type,
          summary: {
            totalCases: stats.total_cases,
            activeCases: stats.active_cases,
            closedCases: stats.closed_cases,
            solveRate: stats.solve_rate
          }
        })
        
        // Сбрасываем форму
        setReportForm({
          type: 'case_summary',
          title: ''
        })
        
        // Уведомление для старших детективов и руководителей
        addNotification({
          type: 'success',
          title: 'Отчет создан',
          message: `Отчет создан ${getRankDisplayName(user?.rank || '')} ${user?.full_name}. Отчет доступен для просмотра старшим детективам и руководителям.`,
          action: {
            label: 'Создать еще один',
            onClick: () => setShowCreateReportModal(true)
          }
        })
        
        // Дополнительное уведомление о том, кто может видеть отчет
        addNotification({
          type: 'info',
          title: 'Отчет доступен',
          message: 'Отчет отображается у всех старших детективов, лейтенантов, капитанов и майоров в системе.'
        })
      }
      
      setShowCreateReportModal(false)
    } catch (error) {
      console.error('Failed to create report:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка создания отчета',
        message: 'Не удалось создать отчет. Попробуйте еще раз.'
      })
    }
  }

  if (loading || userLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-police-700 rounded-full animate-spin mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-transparent border-t-badge-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-police-200 font-medium animate-pulse">Загрузка данных...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="police-card rounded-2xl shadow-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Всего дел</p>
                <p className="text-3xl font-bold text-white">
                  {stats?.total_cases || 0}
                </p>
                <p className="text-xs text-success-300 mt-1">↗ +12% за месяц</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-badge-500 to-badge-600 rounded-2xl shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="police-card rounded-2xl shadow-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Активных дел</p>
                <p className="text-3xl font-bold text-warning-300">
                  {stats?.active_cases || 0}
                </p>
                <p className="text-xs text-warning-400 mt-1">⚡ Требуют внимания</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-badge-500 to-badge-600 rounded-2xl shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="police-card rounded-2xl shadow-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Закрытых дел</p>
                <p className="text-3xl font-bold text-success-300">
                  {stats?.closed_cases || 0}
                </p>
                <p className="text-xs text-success-400 mt-1">✓ Успешно завершено</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl shadow-lg">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="police-card rounded-2xl shadow-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Раскрываемость</p>
                <p className="text-3xl font-bold text-badge-300">
                  {stats?.solve_rate || 0}%
                </p>
                <p className="text-xs text-badge-400 mt-1">📈 Эффективность</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-police-600 to-police-700 rounded-2xl shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* User Info & Permissions */}
        {user && (
          <div className="police-card rounded-2xl shadow-xl p-6 border-l-4 border-badge-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-badge-500 to-badge-600 rounded-xl shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{user.full_name}</h3>
                  <p className="text-police-300 text-sm">{getRankDisplayName(user.rank)} • {user.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-police-400">Значок</p>
                <p className="text-sm font-medium text-white">{user.badge_number}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`text-center p-3 rounded-lg border ${permissions.canCreateReports ? 'bg-success-500/10 border-success-500/30' : 'bg-police-800/30 border-police-600/30'}`}>
                <div className="text-xs text-police-400 mb-1">Отчеты</div>
                <div className={`text-sm font-medium ${permissions.canCreateReports ? 'text-success-400' : 'text-police-500'}`}>
                  {permissions.canCreateReports ? '✓ Доступно' : '✗ Нет доступа'}
                </div>
              </div>
              
              <div className={`text-center p-3 rounded-lg border ${permissions.canEditProfiles ? 'bg-success-500/10 border-success-500/30' : 'bg-police-800/30 border-police-600/30'}`}>
                <div className="text-xs text-police-400 mb-1">Профили</div>
                <div className={`text-sm font-medium ${permissions.canEditProfiles ? 'text-success-400' : 'text-police-500'}`}>
                  {permissions.canEditProfiles ? '✓ Редактирование' : '✗ Только просмотр'}
                </div>
              </div>
              
              <div className={`text-center p-3 rounded-lg border ${permissions.canManageDetectives ? 'bg-success-500/10 border-success-500/30' : 'bg-police-800/30 border-police-600/30'}`}>
                <div className="text-xs text-police-400 mb-1">Управление</div>
                <div className={`text-sm font-medium ${permissions.canManageDetectives ? 'text-success-400' : 'text-police-500'}`}>
                  {permissions.canManageDetectives ? '✓ Детективы' : '✗ Нет прав'}
                </div>
              </div>
              
              <div className={`text-center p-3 rounded-lg border ${permissions.canAccessAdmin ? 'bg-success-500/10 border-success-500/30' : 'bg-police-800/30 border-police-600/30'}`}>
                <div className="text-xs text-police-400 mb-1">Админ</div>
                <div className={`text-sm font-medium ${permissions.canAccessAdmin ? 'text-success-400' : 'text-police-500'}`}>
                  {permissions.canAccessAdmin ? '✓ Доступ' : '✗ Нет доступа'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="police-card rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-badge-500 to-badge-600 rounded-full mr-3"></div>
            Быстрые действия
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleCreateCase}
              className="group flex items-center justify-center px-6 py-4 bg-gradient-to-r from-badge-500 to-badge-600 hover:from-badge-600 hover:to-badge-700 rounded-xl shadow-lg hover:shadow-xl text-white font-medium transition-all duration-200 transform hover:scale-105"
            >
              <FileText className="h-5 w-5 mr-3 group-hover:animate-pulse" />
              Создать дело
            </button>
            
            <button 
              onClick={handleAddDetective}
              disabled={!permissions.canManageDetectives}
              className={`group flex items-center justify-center px-6 py-4 rounded-xl shadow-lg text-white font-medium transition-all duration-200 ${
                permissions.canManageDetectives 
                  ? 'bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 hover:shadow-xl transform hover:scale-105' 
                  : 'bg-police-700 cursor-not-allowed opacity-50'
              }`}
            >
              <Users className="h-5 w-5 mr-3 group-hover:animate-pulse" />
              Добавить детектива
              {!permissions.canManageDetectives && (
                <span className="ml-2 text-xs bg-police-600 px-2 py-1 rounded-full">Лейтенант+</span>
              )}
            </button>
            
            <button 
              onClick={handleCreateReport}
              disabled={!permissions.canCreateReports}
              className={`group flex items-center justify-center px-6 py-4 rounded-xl shadow-lg text-white font-medium transition-all duration-200 ${
                permissions.canCreateReports 
                  ? 'bg-gradient-to-r from-police-600 to-police-700 hover:from-police-700 hover:to-police-800 hover:shadow-xl transform hover:scale-105' 
                  : 'bg-police-700 cursor-not-allowed opacity-50'
              }`}
            >
              <TrendingUp className="h-5 w-5 mr-3 group-hover:animate-pulse" />
              Создать отчет
              {!permissions.canCreateReports && (
                <span className="ml-2 text-xs bg-police-600 px-2 py-1 rounded-full">Ст. детектив+</span>
              )}
            </button>
          </div>
          
          {(!permissions.canCreateReports || !permissions.canManageDetectives) && (
            <div className="mt-4 p-4 bg-warning-500/10 border border-warning-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-warning-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Ограниченный доступ:</span>
              </div>
              <ul className="mt-2 text-xs text-warning-300 space-y-1">
                {!permissions.canCreateReports && (
                  <li>• Создание отчетов доступно с звания "Старший детектив"</li>
                )}
                {!permissions.canManageDetectives && (
                  <li>• Управление детективами доступно с звания "Лейтенант"</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Reports Section - Only for Senior Detectives and above */}
        <ReportsSection />

        {/* Recent Activity */}
        <div className="police-card rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-police-700/30 bg-police-900/50">
            <h3 className="text-xl font-bold text-white flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-badge-500 to-badge-600 rounded-full mr-3"></div>
              Последняя активность
            </h3>
          </div>
          <div className="divide-y divide-police-700/30">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.case_id} className="px-6 py-4 hover:bg-police-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-police-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">
                          {activity.case_number}: {activity.title}
                        </p>
                        <p className="text-sm text-police-300">
                          Детектив: {activity.detective_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-semibold rounded-full border
                        ${activity.status === 'active' ? 'bg-warning-500/20 text-warning-400 border-warning-500/30' : 
                          activity.status === 'closed' ? 'bg-success-500/20 text-success-400 border-success-500/30' : 
                          'bg-police-500/20 text-police-400 border-police-500/30'}
                      `}>
                        {activity.status === 'active' ? 'Активно' : 
                         activity.status === 'closed' ? 'Закрыто' : 'Архив'}
                      </span>
                      <span className="ml-2 text-sm text-police-400">
                        {new Date(activity.updated_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <AlertTriangle className="h-12 w-12 text-police-400 mx-auto mb-4" />
                <p className="text-police-300">Нет недавней активности</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Notifications */}
        <div className="police-card border-2 border-purple-600/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <div className="text-2xl">🤖</div>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-purple-300">
                  AI Рекомендации
                </h3>
                <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                  В разработке
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-police-800/30 rounded-xl border border-police-700/20 opacity-70">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm text-police-200">Анализ активности дел (демо)</span>
                </div>
                <div className="flex items-center p-3 bg-police-800/30 rounded-xl border border-police-700/20 opacity-70">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-sm text-police-200">Поиск связей между делами (демо)</span>
                </div>
                <div className="flex items-center p-3 bg-police-800/30 rounded-xl border border-police-700/20 opacity-70">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-sm text-police-200">Умные напоминания (демо)</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-purple-300">
                  💡 Полноценный AI модуль будет доступен в следующих версиях
                </div>
                <button
                  onClick={addDemoNotification}
                  className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full hover:bg-purple-500/30 hover:text-purple-200 transition-colors border border-purple-500/30"
                >
                  Тест уведомления
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Detective Modal */}
      {showAddDetectiveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="police-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Добавить детектива</h3>
              <button 
                onClick={() => {
                  setShowAddDetectiveModal(false)
                  setNewDetective({
                    username: '',
                    full_name: '',
                    email: '',
                    rank: '',
                    department: '',
                    badge_number: ''
                  })
                }}
                className="text-police-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Имя пользователя *
                </label>
                <input
                  type="text"
                  value={newDetective.username}
                  onChange={(e) => setNewDetective({...newDetective, username: e.target.value})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                  placeholder="Введите имя пользователя"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Полное имя *
                </label>
                <input
                  type="text"
                  value={newDetective.full_name}
                  onChange={(e) => setNewDetective({...newDetective, full_name: e.target.value})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                  placeholder="Введите полное имя"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newDetective.email}
                  onChange={(e) => setNewDetective({...newDetective, email: e.target.value})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                  placeholder="detective@example.com"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Звание *
                  </label>
                  <select 
                    value={newDetective.rank}
                    onChange={(e) => setNewDetective({...newDetective, rank: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    required
                  >
                    <option value="">Выберите звание</option>
                    <option value="detective">Детектив</option>
                    <option value="senior_detective">Старший детектив</option>
                    <option value="lieutenant">Лейтенант</option>
                    <option value="captain">Капитан</option>
                    <option value="major">Майор</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Номер значка *
                  </label>
                  <input
                    type="text"
                    value={newDetective.badge_number}
                    onChange={(e) => setNewDetective({...newDetective, badge_number: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                    placeholder="Например: 12345"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Отдел *
                </label>
                <select 
                  value={newDetective.department}
                  onChange={(e) => setNewDetective({...newDetective, department: e.target.value})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                  required
                >
                  <option value="">Выберите отдел</option>
                  <option value="Отдел по расследованию убийств">Отдел по расследованию убийств</option>
                  <option value="Отдел по борьбе с наркотиками">Отдел по борьбе с наркотиками</option>
                  <option value="Отдел по борьбе с мошенничеством">Отдел по борьбе с мошенничеством</option>
                  <option value="Отдел по кибер-преступлениям">Отдел по кибер-преступлениям</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddDetectiveModal(false)
                  setNewDetective({
                    username: '',
                    full_name: '',
                    email: '',
                    rank: '',
                    department: '',
                    badge_number: ''
                  })
                }}
                disabled={addingDetective}
                className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button 
                onClick={handleAddDetectiveSubmit}
                disabled={addingDetective || !newDetective.username || !newDetective.full_name || !newDetective.email || !newDetective.rank || !newDetective.department || !newDetective.badge_number}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-success-600 to-success-700 text-white rounded-xl hover:from-success-700 hover:to-success-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingDetective ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Добавление...
                  </>
                ) : (
                  'Добавить детектива'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="police-card rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Создать отчет</h3>
              <button 
                onClick={() => {
                  setShowCreateReportModal(false)
                  setReportForm({ type: 'case_summary', title: '' })
                }}
                className="text-police-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Название отчета
                </label>
                <input
                  type="text"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                  placeholder="Введите название отчета (необязательно)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Тип отчета
                </label>
                <select 
                  value={reportForm.type}
                  onChange={(e) => setReportForm({...reportForm, type: e.target.value as any})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                >
                  <option value="monthly">Месячный отчет</option>
                  <option value="weekly">Недельный отчет</option>
                  <option value="case_summary">Сводка по делам</option>
                  <option value="performance">Отчет по эффективности</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Период
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    className="px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                  />
                  <input
                    type="date"
                    className="px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Дополнительные параметры
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 text-badge-500" />
                    <span className="text-police-300 text-sm">Включить графики</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 text-badge-500" />
                    <span className="text-police-300 text-sm">Детальная статистика</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 text-badge-500" />
                    <span className="text-police-300 text-sm">Экспорт в PDF</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateReportModal(false)
                  setReportForm({ type: 'case_summary', title: '' })
                }}
                className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleCreateReportSubmit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-police-600 to-police-700 text-white rounded-xl hover:from-police-700 hover:to-police-800 transition-all"
              >
                Создать отчет
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}