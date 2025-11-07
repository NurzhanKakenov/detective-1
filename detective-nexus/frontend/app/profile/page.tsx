'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { api } from '@/lib/api'
import { User, FileText, Calendar, Bell, BookOpen, Award, X, Save, Clock, Shield } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getUserPermissions, getRankDisplayName } from '@/lib/permissions'

interface UserProfile {
  id: number
  username: string
  full_name: string
  rank: string
  department: string
  badge_number: string
  hire_date: string
  avatar_url?: string
}

interface PersonalStats {
  total_cases: number
  active_cases: number
  closed_cases: number
  solve_rate: number
}

export default function ProfilePage() {
  const { addNotification } = useNotifications()
  const { user: currentUser } = useCurrentUser()
  const permissions = getUserPermissions(currentUser)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<PersonalStats | null>(null)
  const [myCases, setMyCases] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [caseFilter, setCaseFilter] = useState('all')
  const [editForm, setEditForm] = useState({
    full_name: '',
    rank: '',
    department: '',
    badge_number: ''
  })

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      // Для демо используем первого пользователя
      const userData = await api.getUser(1)
      setProfile(userData as UserProfile)
      
      // Загружаем дела пользователя
      const casesData = await api.getCases({ detective_id: 1 }) as any[]
      setMyCases(casesData)
      
      // Вычисляем статистику
      const totalCases = casesData.length
      const activeCases = casesData.filter((c: any) => c.status === 'active').length
      const closedCases = casesData.filter((c: any) => c.status === 'closed').length
      const solveRate = totalCases > 0 ? (closedCases / totalCases * 100) : 0
      
      setStats({
        total_cases: totalCases,
        active_cases: activeCases,
        closed_cases: closedCases,
        solve_rate: Math.round(solveRate)
      })

      // Initialize edit form
      if (userData) {
        setEditForm({
          full_name: (userData as UserProfile).full_name || '',
          rank: (userData as UserProfile).rank || '',
          department: (userData as UserProfile).department || '',
          badge_number: (userData as UserProfile).badge_number || ''
        })
      }
      
    } catch (error) {
      console.error('Failed to load profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = () => {
    if (!permissions.canEditProfiles) {
      addNotification({
        type: 'error',
        title: 'Доступ запрещен',
        message: 'У вас нет прав для редактирования профилей. Требуется звание старшего детектива или выше.'
      })
      return
    }
    
    setShowEditModal(true)
    // Show info notification
    addNotification({
      type: 'info',
      title: 'Редактирование профиля',
      message: 'Измените необходимые поля и нажмите "Сохранить" для обновления профиля'
    })
  }

  const handleViewCase = async (case_: any) => {
    setSelectedCase(case_)
    
    // Load evidence for this case
    try {
      const evidence = await api.getCaseEvidence(case_.id)
      setSelectedCase({
        ...case_,
        evidence: evidence || []
      })
    } catch (error) {
      console.error('Failed to load evidence:', error)
      // Use demo evidence as fallback
      setSelectedCase({
        ...case_,
        evidence: [
          {
            id: 1,
            evidence_type: 'photo',
            title: 'Фотографии с места происшествия',
            description: 'Детальные фотографии места преступления, включая следы и улики',
            file_url: 'https://example.com/evidence/photos/crime-scene-001.jpg'
          },
          {
            id: 2,
            evidence_type: 'document',
            title: 'Показания свидетеля',
            description: 'Письменные показания очевидца происшествия',
            file_url: 'https://example.com/evidence/documents/witness-statement-001.pdf'
          },
          {
            id: 3,
            evidence_type: 'digital',
            title: 'Записи камер видеонаблюдения',
            description: 'Видеозаписи с камер наблюдения в районе происшествия',
            file_url: 'https://example.com/evidence/videos/surveillance-001.mp4'
          }
        ]
      })
    }
    
    setShowCaseModal(true)
    
    // Add notification about viewing case
    addNotification({
      type: 'info',
      title: 'Просмотр дела',
      message: `Открыто дело ${case_.case_number}: ${case_.title}`,
      action: {
        label: 'Перейти к делам',
        href: '/cases'
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-badge-500/20 text-badge-400 border-badge-500/30'
      case 'closed': return 'bg-success-500/20 text-success-400 border-success-500/30'
      case 'archived': return 'bg-police-500/20 text-police-400 border-police-500/30'
      default: return 'bg-police-500/20 text-police-400 border-police-500/30'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-danger-500/20 text-danger-400 border-danger-500/30'
      case 'high': return 'bg-warning-500/20 text-warning-400 border-warning-500/30'
      case 'medium': return 'bg-badge-500/20 text-badge-400 border-badge-500/30'
      case 'low': return 'bg-police-500/20 text-police-400 border-police-500/30'
      default: return 'bg-police-500/20 text-police-400 border-police-500/30'
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      console.log('Saving profile with data:', editForm)
      
      // Update profile via API
      if (profile) {
        const updatedProfile = await api.updateUser(profile.id, editForm)
        console.log('Profile updated successfully:', updatedProfile)
        
        // Update local state
        setProfile({
          ...profile,
          ...editForm
        })
        
        // Add success notification
        addNotification({
          type: 'success',
          title: 'Профиль обновлен',
          message: 'Ваш профиль успешно обновлен'
        })
        
        setShowEditModal(false)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка обновления',
        message: `Не удалось обновить профиль: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Обзор', icon: User },
    { id: 'cases', name: 'Мои дела', icon: FileText },
    { id: 'journal', name: 'RP-журнал', icon: BookOpen },
    { id: 'notifications', name: 'Уведомления', icon: Bell },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Загрузка профиля...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-xl">
                  <span className="text-white text-3xl font-bold">
                    {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'TD'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{profile?.full_name}</h1>
                <div className="flex items-center space-x-4 mb-3">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border border-white/30">
                    {profile?.rank}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border border-white/30">
                    {profile?.department}
                  </span>
                </div>
                <p className="text-white/80 text-sm">Значок: {profile?.badge_number}</p>
                <p className="text-white/80 text-sm">
                  В службе с: {profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString('ru-RU') : 'N/A'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <button 
                  onClick={handleEditProfile}
                  disabled={!permissions.canEditProfiles}
                  className={`font-medium px-6 py-3 rounded-xl border transition-all duration-200 ${
                    permissions.canEditProfiles
                      ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30 transform hover:scale-105'
                      : 'bg-white/10 text-white/50 border-white/20 cursor-not-allowed'
                  }`}
                >
                  {permissions.canEditProfiles ? 'Редактировать профиль' : 'Только просмотр'}
                </button>
                {!permissions.canEditProfiles && (
                  <p className="text-xs text-white/60 mt-2 text-center">
                    Требуется звание<br />старшего детектива
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 card-hover border border-gray-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">+5 за неделю</span>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Всего дел</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {stats.total_cases}
                </p>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 card-hover border border-gray-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">В работе</span>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Активных</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">
                  {stats.active_cases}
                </p>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 card-hover border border-gray-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Отлично</span>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Закрытых</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  {stats.closed_cases}
                </p>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 card-hover border border-gray-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Топ-10</span>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Эффективность</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                  {stats.solve_rate}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="police-card rounded-lg shadow">
          <div className="border-b border-police-700/30">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-badge-500 text-badge-400'
                      : 'border-transparent text-police-400 hover:text-white hover:border-police-500'
                    }
                  `}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Информация о детективе</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                      <dt className="text-sm font-medium text-police-300">Имя пользователя</dt>
                      <dd className="text-sm text-white mt-1">{profile?.username}</dd>
                    </div>
                    <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                      <dt className="text-sm font-medium text-police-300">Звание</dt>
                      <dd className="text-sm text-white mt-1">{profile?.rank}</dd>
                    </div>
                    <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                      <dt className="text-sm font-medium text-police-300">Отдел</dt>
                      <dd className="text-sm text-white mt-1">{profile?.department}</dd>
                    </div>
                    <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                      <dt className="text-sm font-medium text-police-300">Номер значка</dt>
                      <dd className="text-sm text-white mt-1">{profile?.badge_number}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Права доступа */}
                <div className="bg-badge-500/10 border-2 border-badge-500/30 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-badge-400 mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Права доступа
                    <span className="bg-badge-500/20 text-badge-400 text-xs px-2 py-1 rounded-full border border-badge-500/30">
                      {getRankDisplayName(profile?.rank || '')}
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border ${permissions.canCreateReports ? 'bg-success-500/10 border-success-500/30' : 'bg-police-800/30 border-police-600/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${permissions.canCreateReports ? 'bg-success-400' : 'bg-police-500'}`}></div>
                        <span className="text-sm font-medium text-white">Создание отчетов</span>
                      </div>
                      <p className={`text-xs ${permissions.canCreateReports ? 'text-success-300' : 'text-police-400'}`}>
                        {permissions.canCreateReports ? 'Доступно' : 'Требуется звание старшего детектива'}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${permissions.canEditProfiles ? 'bg-success-500/10 border-success-500/30' : 'bg-police-800/30 border-police-600/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${permissions.canEditProfiles ? 'bg-success-400' : 'bg-police-500'}`}></div>
                        <span className="text-sm font-medium text-white">Редактирование профилей</span>
                      </div>
                      <p className={`text-xs ${permissions.canEditProfiles ? 'text-success-300' : 'text-police-400'}`}>
                        {permissions.canEditProfiles ? 'Доступно' : 'Требуется звание старшего детектива'}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${permissions.canManageDetectives ? 'bg-success-500/10 border-success-500/30' : 'bg-police-800/30 border-police-600/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${permissions.canManageDetectives ? 'bg-success-400' : 'bg-police-500'}`}></div>
                        <span className="text-sm font-medium text-white">Управление детективами</span>
                      </div>
                      <p className={`text-xs ${permissions.canManageDetectives ? 'text-success-300' : 'text-police-400'}`}>
                        {permissions.canManageDetectives ? 'Доступно' : 'Требуется звание лейтенанта'}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${permissions.canAccessAdmin ? 'bg-success-500/10 border-success-500/30' : 'bg-police-800/30 border-police-600/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${permissions.canAccessAdmin ? 'bg-success-400' : 'bg-police-500'}`}></div>
                        <span className="text-sm font-medium text-white">Админ панель</span>
                      </div>
                      <p className={`text-xs ${permissions.canAccessAdmin ? 'text-success-300' : 'text-police-400'}`}>
                        {permissions.canAccessAdmin ? 'Доступно' : 'Требуется звание капитана'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                    🤖 AI Рекомендации
                    <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                      Демо
                    </span>
                  </h4>
                  <ul className="text-sm text-purple-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                      Рекомендуется обновить дело HN-2025-0001
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                      Хорошая работа по закрытию дел в этом месяце
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                      Проверьте новые улики по активным делам
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-white">Мои дела</h3>
                  <div className="flex items-center gap-4">
                    <select
                      value={caseFilter}
                      onChange={(e) => setCaseFilter(e.target.value)}
                      className="px-3 py-2 bg-police-800/50 border border-police-600/30 rounded-xl text-white text-sm focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="all">Все дела</option>
                      <option value="active">Активные</option>
                      <option value="closed">Закрытые</option>
                      <option value="archived">Архивные</option>
                    </select>
                    <div className="text-sm text-police-300">
                      Показано: {myCases.filter(case_ => caseFilter === 'all' || case_.status === caseFilter).length} из {myCases.length}
                    </div>
                  </div>
                </div>

                {/* Cases Statistics */}
                <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-badge-400">{myCases.length}</div>
                      <div className="text-xs text-police-400">Всего дел</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-warning-400">{myCases.filter(c => c.status === 'active').length}</div>
                      <div className="text-xs text-police-400">Активных</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-success-400">{myCases.filter(c => c.status === 'closed').length}</div>
                      <div className="text-xs text-police-400">Закрытых</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-police-400">{myCases.filter(c => c.status === 'archived').length}</div>
                      <div className="text-xs text-police-400">Архивных</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {myCases.length > 0 ? (
                    myCases
                      .filter(case_ => caseFilter === 'all' || case_.status === caseFilter)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((case_: any) => (
                      <div key={case_.id} className="police-card rounded-xl p-4 hover:bg-police-800/50 transition-colors cursor-pointer" onClick={() => handleViewCase(case_)}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-white">{case_.case_number}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(case_.status)}`}>
                                {case_.status === 'active' ? 'Активно' : 
                                 case_.status === 'closed' ? 'Закрыто' : 'Архив'}
                              </span>
                              {case_.priority && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(case_.priority)}`}>
                                  {case_.priority === 'urgent' ? 'Срочно' :
                                   case_.priority === 'high' ? 'Высокий' :
                                   case_.priority === 'medium' ? 'Средний' : 'Низкий'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-police-300 mb-2">{case_.title}</p>
                            <div className="flex items-center gap-4 text-xs text-police-400">
                              <span>Создано: {new Date(case_.created_at).toLocaleDateString('ru-RU')}</span>
                              {case_.crime_type && <span>Тип: {case_.crime_type}</span>}
                              {case_.location && <span>Место: {case_.location}</span>}
                            </div>
                          </div>
                          <div className="flex items-center text-police-400 hover:text-white transition-colors">
                            <FileText className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-police-500 mx-auto mb-4" />
                      <p className="text-police-400">У вас пока нет назначенных дел</p>
                      <p className="text-sm text-police-500 mt-2">Дела будут отображаться здесь после назначения</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'journal' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-medium text-white">RP-журнал</h3>
                  <span className="bg-badge-500/20 text-badge-400 text-xs px-2 py-1 rounded-full border border-badge-500/30">
                    В разработке
                  </span>
                </div>
                <div className="bg-police-800/30 border-2 border-dashed border-police-600/50 rounded-lg p-8 text-center">
                  <BookOpen className="h-12 w-12 text-police-400 mx-auto mb-4" />
                  <p className="text-police-300">Журнал смен и заметок</p>
                  <p className="text-sm text-police-400 mt-2">Функция будет доступна в следующих версиях</p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-medium text-white">Уведомления</h3>
                  <span className="bg-badge-500/20 text-badge-400 text-xs px-2 py-1 rounded-full border border-badge-500/30">
                    В разработке
                  </span>
                </div>
                <div className="bg-police-800/30 border-2 border-dashed border-police-600/50 rounded-lg p-8 text-center">
                  <Bell className="h-12 w-12 text-police-400 mx-auto mb-4" />
                  <p className="text-police-300">Система уведомлений</p>
                  <p className="text-sm text-police-400 mt-2">Real-time уведомления будут добавлены позже</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="police-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Редактировать профиль</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Полное имя
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                    placeholder="Введите полное имя"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Звание
                  </label>
                  <select
                    value={editForm.rank}
                    onChange={(e) => setEditForm({...editForm, rank: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                  >
                    <option value="">Выберите звание</option>
                    <option value="detective">Детектив</option>
                    <option value="senior_detective">Старший детектив</option>
                    <option value="lieutenant">Лейтенант</option>
                    <option value="captain">Капитан</option>
                    <option value="major">Майор</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Отдел
                  </label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                  >
                    <option value="">Выберите отдел</option>
                    <option value="Отдел по расследованию убийств">Отдел по расследованию убийств</option>
                    <option value="Отдел по борьбе с наркотиками">Отдел по борьбе с наркотиками</option>
                    <option value="Отдел по борьбе с мошенничеством">Отдел по борьбе с мошенничеством</option>
                    <option value="Отдел по кибер-преступлениям">Отдел по кибер-преступлениям</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Номер значка
                  </label>
                  <input
                    type="text"
                    value={editForm.badge_number}
                    onChange={(e) => setEditForm({...editForm, badge_number: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                    placeholder="Например: 12345"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !editForm.full_name || !editForm.rank || !editForm.department || !editForm.badge_number}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-success-600 to-success-700 text-white rounded-xl hover:from-success-700 hover:to-success-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Сохранить
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Case Details Modal */}
        {showCaseModal && selectedCase && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="police-card rounded-2xl p-6 w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedCase.case_number}</h3>
                  <p className="text-police-300 text-lg mt-1">{selectedCase.title}</p>
                </div>
                <button 
                  onClick={() => setShowCaseModal(false)}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                    <h4 className="text-sm font-medium text-police-300 mb-2">Статус</h4>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(selectedCase.status)}`}>
                      {selectedCase.status === 'active' ? 'Активно' : 
                       selectedCase.status === 'closed' ? 'Закрыто' : 'Архив'}
                    </span>
                  </div>
                  
                  {selectedCase.priority && (
                    <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                      <h4 className="text-sm font-medium text-police-300 mb-2">Приоритет</h4>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getPriorityBadge(selectedCase.priority)}`}>
                        {selectedCase.priority === 'urgent' ? 'Срочно' :
                         selectedCase.priority === 'high' ? 'Высокий' :
                         selectedCase.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                    </div>
                  )}
                  
                  <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                    <h4 className="text-sm font-medium text-police-300 mb-2">Тип преступления</h4>
                    <p className="text-white text-sm">{selectedCase.crime_type || 'Не указан'}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-police-800/30 rounded-xl p-6 border border-police-700/30">
                  <h4 className="text-lg font-medium text-white mb-3">Описание дела</h4>
                  <p className="text-police-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedCase.description || 'Описание не предоставлено'}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                      <h4 className="text-sm font-medium text-police-300 mb-2">Место происшествия</h4>
                      <p className="text-white text-sm">{selectedCase.location || 'Не указано'}</p>
                    </div>
                    
                    {selectedCase.suspect_info && (
                      <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                        <h4 className="text-sm font-medium text-police-300 mb-2">Информация о подозреваемом</h4>
                        <p className="text-white text-sm">{selectedCase.suspect_info}</p>
                      </div>
                    )}
                    
                    {selectedCase.victim_info && (
                      <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                        <h4 className="text-sm font-medium text-police-300 mb-2">Информация о потерпевшем</h4>
                        <p className="text-white text-sm">{selectedCase.victim_info}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                      <h4 className="text-sm font-medium text-police-300 mb-2">Дата создания</h4>
                      <p className="text-white text-sm">
                        {new Date(selectedCase.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                      <h4 className="text-sm font-medium text-police-300 mb-2">Последнее обновление</h4>
                      <p className="text-white text-sm">
                        {new Date(selectedCase.updated_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {selectedCase.closed_at && (
                      <div className="bg-success-500/10 rounded-xl p-4 border border-success-500/30">
                        <h4 className="text-sm font-medium text-success-400 mb-2">Дата закрытия</h4>
                        <p className="text-success-300 text-sm">
                          {new Date(selectedCase.closed_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence Section */}
                <div className="bg-police-800/30 rounded-xl p-6 border border-police-700/30">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Улики и доказательства
                    <span className="text-xs text-police-400">({selectedCase.evidence?.length || 0})</span>
                  </h4>
                  {selectedCase.evidence && selectedCase.evidence.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCase.evidence.map((evidence: any) => (
                        <div key={evidence.id} className="flex items-center justify-between p-3 bg-police-900/30 rounded-lg border border-police-700/20">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {evidence.evidence_type === 'photo' ? '📷' :
                               evidence.evidence_type === 'document' ? '📄' :
                               evidence.evidence_type === 'video' ? '🎥' :
                               evidence.evidence_type === 'audio' ? '🎵' :
                               evidence.evidence_type === 'physical' ? '📦' :
                               evidence.evidence_type === 'digital' ? '💾' : '📄'}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{evidence.title}</p>
                              <p className="text-xs text-police-400">{evidence.description}</p>
                              {evidence.file_url && (
                                <a 
                                  href={evidence.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-badge-400 hover:text-badge-300 transition-colors inline-flex items-center gap-1"
                                >
                                  🔗 Открыть ссылку
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-police-900/50 border-2 border-dashed border-police-600/50 rounded-lg p-8 text-center">
                      <FileText className="h-12 w-12 text-police-400 mx-auto mb-4" />
                      <p className="text-police-300">Улики не найдены</p>
                      <p className="text-sm text-police-400 mt-2">К этому делу пока не добавлены улики</p>
                    </div>
                  )}
                </div>

                {/* Action Timeline */}
                <div className="bg-police-800/30 rounded-xl p-6 border border-police-700/30">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    История действий
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-police-900/30 rounded-lg">
                      <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">Дело создано</p>
                        <p className="text-xs text-police-400">
                          {new Date(selectedCase.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    
                    {selectedCase.updated_at !== selectedCase.created_at && (
                      <div className="flex items-center gap-3 p-3 bg-police-900/30 rounded-lg">
                        <div className="w-2 h-2 bg-badge-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">Дело обновлено</p>
                          <p className="text-xs text-police-400">
                            {new Date(selectedCase.updated_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCase.closed_at && (
                      <div className="flex items-center gap-3 p-3 bg-police-900/30 rounded-lg">
                        <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">Дело закрыто</p>
                          <p className="text-xs text-police-400">
                            {new Date(selectedCase.closed_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCaseModal(false)}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
                >
                  Закрыть
                </button>
                <button 
                  onClick={() => {
                    setShowCaseModal(false)
                    // Navigate to cases page with this case
                    window.location.href = '/cases'
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-badge-500 to-badge-600 text-white rounded-xl hover:from-badge-600 hover:to-badge-700 transition-all"
                >
                  Перейти к делам
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}