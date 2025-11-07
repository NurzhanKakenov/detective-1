'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { 
  Settings, Users, FileText, BarChart3, Shield, Plus, Edit, Trash2, 
  Search, Filter, Eye, AlertTriangle, CheckCircle, Clock, X, Save,
  UserPlus, Crown, Award, Star
} from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getUserPermissions, getRankDisplayName, getAvailableRanks } from '@/lib/permissions'
import { useNotifications } from '@/contexts/NotificationContext'
import { api } from '@/lib/api'

interface AdminUser {
  id: number
  username: string
  full_name: string
  rank: string
  department: string
  badge_number: string
  hire_date: string
  is_active: boolean
  created_at: string
}

interface AdminCase {
  id: number
  case_number: string
  title: string
  status: string
  priority: string
  detective_name: string
  created_at: string
  updated_at: string
}

export default function AdminPage() {
  const { user } = useCurrentUser()
  const permissions = getUserPermissions(user)
  const { addNotification } = useNotifications()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [cases, setCases] = useState<AdminCase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Modal states
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState(false)
  const [editUserForm, setEditUserForm] = useState({
    full_name: '',
    rank: '',
    department: '',
    badge_number: '',
    is_active: true
  })

  useEffect(() => {
    if (permissions.canAccessAdmin) {
      loadAdminData()
    } else {
      setLoading(false)
    }
  }, [permissions.canAccessAdmin])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      // Загружаем пользователей
      console.log('Загружаем пользователей...')
      const usersData = await api.getUsers()
      console.log('Получены пользователи:', usersData)
      console.log('Количество пользователей:', Array.isArray(usersData) ? usersData.length : 'не массив')
      setUsers(usersData as AdminUser[])
      
      // Загружаем дела
      const casesData = await api.getCases()
      setCases(casesData as AdminCase[])
      
    } catch (error) {
      console.error('Failed to load admin data:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить данные администрирования'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setEditUserForm({
      full_name: user.full_name,
      rank: user.rank,
      department: user.department,
      badge_number: user.badge_number,
      is_active: user.is_active
    })
    setShowEditUserModal(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return
    
    try {
      await api.updateUser(selectedUser.id, editUserForm)
      
      // Обновляем локальное состояние
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...editUserForm }
          : u
      ))
      
      addNotification({
        type: 'success',
        title: 'Пользователь обновлен',
        message: `Данные ${editUserForm.full_name} успешно обновлены`
      })
      
      setShowEditUserModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to update user:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка обновления',
        message: 'Не удалось обновить данные пользователя'
      })
    }
  }

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.updateUser(userId, { is_active: !currentStatus })
      
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, is_active: !currentStatus }
          : u
      ))
      
      addNotification({
        type: 'success',
        title: 'Статус изменен',
        message: `Пользователь ${!currentStatus ? 'активирован' : 'деактивирован'}`
      })
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось изменить статус пользователя'
      })
    }
  }

  const handleDeleteUser = (userToDelete: AdminUser) => {
    // Проверяем, что нельзя удалить самого себя
    if (userToDelete.id === user?.id) {
      addNotification({
        type: 'error',
        title: 'Ошибка удаления',
        message: 'Нельзя удалить самого себя'
      })
      return
    }
    
    setUserToDelete(userToDelete)
    setShowDeleteUserModal(true)
  }

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return
    
    setDeletingUser(true)
    try {
      await api.deleteUser(userToDelete.id)
      
      // Удаляем пользователя из локального состояния
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
      
      addNotification({
        type: 'success',
        title: 'Пользователь удален',
        message: `Пользователь ${userToDelete.full_name} успешно удален из системы`
      })
      
      setShowDeleteUserModal(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('Failed to delete user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      addNotification({
        type: 'error',
        title: 'Ошибка удаления',
        message: `Не удалось удалить пользователя: ${errorMessage}`
      })
    } finally {
      setDeletingUser(false)
    }
  }

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'major': return <Award className="h-4 w-4" />
      case 'captain': return <Star className="h-4 w-4" />
      case 'lieutenant': return <Shield className="h-4 w-4" />
      case 'senior_detective': return <Users className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-warning-500/20 text-warning-400 border-warning-500/30'
      case 'closed': return 'bg-success-500/20 text-success-400 border-success-500/30'
      case 'archived': return 'bg-police-500/20 text-police-400 border-police-500/30'
      default: return 'bg-police-500/20 text-police-400 border-police-500/30'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.badge_number.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active)
    
    return matchesSearch && matchesStatus
  })

  const filteredCases = cases.filter(case_ => 
    case_.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.detective_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!permissions.canAccessAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-16 w-16 text-police-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Доступ запрещен</h2>
            <p className="text-police-300">
              Админ панель доступна только капитанам и выше
            </p>
            <p className="text-police-400 text-sm mt-2">
              Ваше текущее звание: {getRankDisplayName(user?.rank || '')}
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-police-700 rounded-full animate-spin mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-transparent border-t-badge-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-police-200 font-medium animate-pulse">Загрузка админ панели...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-badge-500 to-badge-600 rounded-xl shadow-lg mr-4">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Администрирование</h1>
              <p className="text-police-300">Управление системой Detective Nexus</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-police-300">
            <Shield className="h-4 w-4" />
            <span>Доступ: {getRankDisplayName(user?.rank || '')}</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="police-card rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Всего пользователей</p>
                <p className="text-3xl font-bold text-white">{users.length}</p>
                <p className="text-xs text-success-300 mt-1">
                  {users.filter(u => u.is_active).length} активных
                </p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-badge-500 to-badge-600 rounded-2xl shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="police-card rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Всего дел</p>
                <p className="text-3xl font-bold text-white">{cases.length}</p>
                <p className="text-xs text-warning-300 mt-1">
                  {cases.filter(c => c.status === 'active').length} активных
                </p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="police-card rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Руководители</p>
                <p className="text-3xl font-bold text-white">
                  {users.filter(u => ['lieutenant', 'captain', 'major', 'admin'].includes(u.rank)).length}
                </p>
                <p className="text-xs text-badge-300 mt-1">Лейтенант+</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-police-600 to-police-700 rounded-2xl shadow-lg">
                <Crown className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="police-card rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Эффективность</p>
                <p className="text-3xl font-bold text-white">
                  {cases.length > 0 ? Math.round((cases.filter(c => c.status === 'closed').length / cases.length) * 100) : 0}%
                </p>
                <p className="text-xs text-success-300 mt-1">Раскрываемость</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="police-card rounded-lg shadow">
          <div className="border-b border-police-700/30">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Обзор', icon: BarChart3 },
                { id: 'users', name: 'Пользователи', icon: Users },
                { id: 'cases', name: 'Дела', icon: FileText },
                { id: 'settings', name: 'Настройки', icon: Settings }
              ].map((tab) => (
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
                <h3 className="text-lg font-medium text-white mb-4">Системная информация</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                    <h4 className="text-sm font-medium text-police-300 mb-3">Распределение по званиям</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        users.reduce((acc, user) => {
                          acc[user.rank] = (acc[user.rank] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                      ).map(([rank, count]) => (
                        <div key={rank} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getRankIcon(rank)}
                            <span className="text-sm text-white">{getRankDisplayName(rank)}</span>
                          </div>
                          <span className="text-sm text-badge-400 font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30">
                    <h4 className="text-sm font-medium text-police-300 mb-3">Статистика дел</h4>
                    <div className="space-y-2">
                      {[
                        { status: 'active', label: 'Активные', color: 'text-warning-400' },
                        { status: 'closed', label: 'Закрытые', color: 'text-success-400' },
                        { status: 'archived', label: 'Архивные', color: 'text-police-400' }
                      ].map(({ status, label, color }) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm text-white">{label}</span>
                          <span className={`text-sm font-medium ${color}`}>
                            {cases.filter(c => c.status === status).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Управление пользователями</h3>
                    <p className="text-sm text-police-400">Загружено: {users.length} пользователей</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={loadAdminData}
                      className="px-3 py-2 bg-badge-500 hover:bg-badge-600 text-white rounded-lg transition-colors text-sm"
                    >
                      Обновить
                    </button>
                    <div className="relative">
                      <Search className="h-5 w-5 text-police-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Поиск пользователей..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="all">Все статусы</option>
                      <option value="active">Активные</option>
                      <option value="inactive">Неактивные</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="police-card rounded-xl p-4 hover:bg-police-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-police-800/50 rounded-xl border border-police-700/30">
                            {getRankIcon(user.rank)}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-medium text-white">{user.full_name}</h4>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-badge-500/20 text-badge-400 border border-badge-500/30">
                                {getRankDisplayName(user.rank)}
                              </span>
                              {!user.is_active && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-danger-500/20 text-danger-400 border border-danger-500/30">
                                  Неактивен
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-police-300">
                              <span>@{user.username}</span>
                              <span>•</span>
                              <span>Значок: {user.badge_number}</span>
                              <span>•</span>
                              <span>{user.department}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="flex items-center gap-2 px-3 py-2 bg-police-700 hover:bg-police-600 text-police-300 hover:text-white rounded-lg transition-colors text-sm"
                          >
                            <Edit className="h-4 w-4" />
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                              user.is_active 
                                ? 'bg-warning-600 hover:bg-warning-700 text-white'
                                : 'bg-success-600 hover:bg-success-700 text-white'
                            }`}
                          >
                            {user.is_active ? (
                              <>
                                <X className="h-4 w-4" />
                                Деактивировать
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Активировать
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="flex items-center gap-2 px-3 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Все дела департамента</h3>
                  <div className="relative">
                    <Search className="h-5 w-5 text-police-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Поиск дел..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredCases.map((case_) => (
                    <div key={case_.id} className="police-card rounded-xl p-4 hover:bg-police-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-police-800/50 rounded-xl border border-police-700/30">
                            <FileText className="h-6 w-6 text-police-400" />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-medium text-white">{case_.case_number}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(case_.status)}`}>
                                {case_.status === 'active' ? 'Активно' : 
                                 case_.status === 'closed' ? 'Закрыто' : 'Архив'}
                              </span>
                            </div>
                            <p className="text-sm text-police-300 mb-1">{case_.title}</p>
                            <div className="flex items-center gap-4 text-xs text-police-400">
                              <span>Детектив: {case_.detective_name}</span>
                              <span>•</span>
                              <span>Создано: {new Date(case_.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-2 px-3 py-2 bg-police-700 hover:bg-police-600 text-police-300 hover:text-white rounded-lg transition-colors text-sm">
                            <Eye className="h-4 w-4" />
                            Просмотр
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white mb-4">Системные настройки</h3>
                
                <div className="bg-warning-500/10 border-2 border-warning-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="h-6 w-6 text-warning-400" />
                    <h4 className="text-lg font-bold text-warning-400">В разработке</h4>
                  </div>
                  <p className="text-warning-300 mb-4">
                    Системные настройки будут доступны в следующих версиях Detective Nexus
                  </p>
                  <ul className="text-sm text-warning-300 space-y-1">
                    <li>• Настройки безопасности</li>
                    <li>• Конфигурация уведомлений</li>
                    <li>• Интеграции с внешними системами</li>
                    <li>• Резервное копирование</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit User Modal */}
        {showEditUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="police-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Редактировать пользователя</h3>
                <button 
                  onClick={() => setShowEditUserModal(false)}
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
                    value={editUserForm.full_name}
                    onChange={(e) => setEditUserForm({...editUserForm, full_name: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Звание
                  </label>
                  <select
                    value={editUserForm.rank}
                    onChange={(e) => setEditUserForm({...editUserForm, rank: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                  >
                    {getAvailableRanks(user?.rank || '').map(rank => (
                      <option key={rank.value} value={rank.value}>{rank.label}</option>
                    ))}
                    <option value={editUserForm.rank}>{getRankDisplayName(editUserForm.rank)}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Отдел
                  </label>
                  <select
                    value={editUserForm.department}
                    onChange={(e) => setEditUserForm({...editUserForm, department: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                  >
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
                    value={editUserForm.badge_number}
                    onChange={(e) => setEditUserForm({...editUserForm, badge_number: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editUserForm.is_active}
                    onChange={(e) => setEditUserForm({...editUserForm, is_active: e.target.checked})}
                    className="mr-3 text-badge-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-police-300">
                    Активный пользователь
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleSaveUser}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-success-600 to-success-700 text-white rounded-xl hover:from-success-700 hover:to-success-800 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteUserModal && userToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="police-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Удалить пользователя</h3>
                <button 
                  onClick={() => setShowDeleteUserModal(false)}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-danger-500/10 border border-danger-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="h-6 w-6 text-danger-400" />
                    <h4 className="text-lg font-bold text-danger-400">Внимание!</h4>
                  </div>
                  <p className="text-danger-300 mb-2">
                    Вы действительно хотите удалить пользователя?
                  </p>
                  <div className="bg-police-800/30 rounded-lg p-3 border border-police-700/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-police-800/50 rounded-lg border border-police-700/30">
                        {getRankIcon(userToDelete.rank)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{userToDelete.full_name}</p>
                        <p className="text-police-300 text-sm">
                          {getRankDisplayName(userToDelete.rank)} • {userToDelete.username}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-danger-300 text-sm mt-3">
                    <strong>Это действие нельзя отменить!</strong> Все данные пользователя будут удалены навсегда.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteUserModal(false)}
                  disabled={deletingUser}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleConfirmDeleteUser}
                  disabled={deletingUser}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-danger-600 to-danger-700 text-white rounded-xl hover:from-danger-700 hover:to-danger-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingUser ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Удаление...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Удалить пользователя
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}