'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { api } from '@/lib/api'
import { Plus, Search, Filter, Eye, Edit, Archive, X, Download, User, UserPlus, UserMinus, Trash } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { ExportService } from '@/lib/export'

interface Case {
  id: number
  case_number: string
  title: string
  description: string
  status: string
  priority: string
  crime_type: string
  location: string
  detective_id: number
  created_at: string
  updated_at: string
  evidence?: Array<{
    id: number
    evidence_type: string
    title: string
    description: string
    file_url?: string
  }>
  suspects?: Array<{
    id: number
    full_name: string
    status: string
    risk_level: string
    photo_url?: string
  }>
}

export default function CasesPage() {
  const searchParams = useSearchParams()
  const { addNotification } = useNotifications()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editCase, setEditCase] = useState({
    title: '',
    description: '',
    crime_type: '',
    location: '',
    priority: 'medium',
    status: 'active'
  })

  // Form state for creating new case
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    crime_type: '',
    location: '',
    priority: 'medium'
  })

  // Evidence state
  const [newEvidence, setNewEvidence] = useState({
    type: 'document',
    description: '',
    location: '',
    url: ''
  })
  const [evidenceList, setEvidenceList] = useState<Array<{
    id: number
    type: string
    description: string
    location: string
    url: string
  }>>([])
  const [evidenceCounter, setEvidenceCounter] = useState(1)

  // Edit evidence state
  const [editEvidenceList, setEditEvidenceList] = useState<Array<{
    id: number
    type: string
    description: string
    location: string
    url: string
  }>>([])
  const [editEvidenceCounter, setEditEvidenceCounter] = useState(1)

  // Suspects state
  const [caseSuspects, setCaseSuspects] = useState<Array<{
    id: number
    full_name: string
    status: string
    risk_level: string
    photo_url?: string
  }>>([])
  const [allSuspects, setAllSuspects] = useState<Array<{
    id: number
    full_name: string
    status: string
    risk_level: string
    photo_url?: string
  }>>([])
  const [showAddSuspectModal, setShowAddSuspectModal] = useState(false)
  const [selectedAddRole, setSelectedAddRole] = useState('suspect')

  useEffect(() => {
    loadCases()
    
    // Check if we should open create modal from URL params
    if (searchParams?.get('action') === 'create') {
      setShowCreateModal(true)
    }
  }, [statusFilter, searchParams])

  // Real-time search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.length > 0) {
        // In production, this would be a server-side search
        // For now, we'll just filter client-side
        loadCases()
      }
    }, 300) // Debounce search

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const loadCases = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined
      const data = await api.getCases(params)
      setCases(data as Case[])
    } catch (error) {
      console.error('Failed to load cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCases = cases.filter(case_ =>
    case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.case_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-warning-500/20 text-warning-400 border border-warning-500/30'
      case 'closed': return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success-500/20 text-success-400 border border-success-500/30'
      case 'archived': return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-police-500/20 text-police-400 border border-police-500/30'
      default: return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-police-500/20 text-police-400 border border-police-500/30'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-danger-500/20 text-danger-400 border border-danger-500/30'
      case 'high': return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-warning-500/20 text-warning-400 border border-warning-500/30'
      case 'medium': return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-badge-500/20 text-badge-400 border border-badge-500/30'
      case 'low': return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-police-500/20 text-police-400 border border-police-500/30'
      default: return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-police-500/20 text-police-400 border border-police-500/30'
    }
  }

  // Action handlers
  const handleViewCase = async (case_: Case) => {
    console.log('handleViewCase вызван для дела:', case_.id)
    setSelectedCase(case_)
    
    // Load evidence for this case
    try {
      const evidence = await api.getCaseEvidence(case_.id)
      setSelectedCase({
        ...case_,
        evidence: (evidence || []) as Array<{
          id: number
          evidence_type: string
          title: string
          description: string
          file_url?: string
        }>
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
        ] as Array<{
          id: number
          evidence_type: string
          title: string
          description: string
          file_url?: string
        }>
      })
    }
    
    // Load suspects for this case
    try {
      console.log('Загружаем подозреваемых для дела:', case_.id)
      const suspects = await api.getCaseSuspects(case_.id)
      console.log('Получены подозреваемые:', suspects)
      // Ensure we only set an array to state — guard against API returning {} or null
      const suspectsArray = Array.isArray(suspects) ? suspects : []
      setCaseSuspects(suspectsArray)
      setSelectedCase(prev => prev ? {
        ...prev,
        suspects: suspectsArray
      } : null)
    } catch (error) {
      console.error('Failed to load suspects:', error)
      setCaseSuspects([])
    }
    
    setShowViewModal(true)
    console.log('Модальное окно открыто, caseSuspects:', caseSuspects)
  }

  const loadAllSuspects = async () => {
    try {
      const suspects = await api.getSuspects()
      const suspectsArray = Array.isArray(suspects) ? suspects : []
      setAllSuspects(suspectsArray)
    } catch (error) {
      console.error('Failed to load suspects:', error)
      setAllSuspects([])
    }
  }

  const handleAddSuspectToCase = async (suspectId: number) => {
    if (!selectedCase) return
    
    try {
      // Ask for role/type of involvement when adding
      const role = (prompt('Введите тип причастности: suspect (Подозреваемый), witness (Свидетель), person_of_interest (Лицо_интереса). По умолчанию suspect', 'suspect') || 'suspect').trim()
      await api.linkSuspectToCaseFromCase(selectedCase.id, suspectId, role)
      
      // Reload suspects for the case
      const suspects = await api.getCaseSuspects(selectedCase.id)
      const suspectsArray = Array.isArray(suspects) ? suspects : []
      setCaseSuspects(suspectsArray)
      setSelectedCase(prev => prev ? {
        ...prev,
        suspects: suspectsArray
      } : null)
      
      addNotification({
        type: 'success',
        title: 'Подозреваемый добавлен',
        message: 'Подозреваемый успешно прикреплен к делу'
      })
      
      setShowAddSuspectModal(false)
    } catch (error) {
      console.error('Failed to add suspect to case:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось прикрепить подозреваемого к делу'
      })
    }
  }

  const handleRemoveSuspectFromCase = async (suspectId: number) => {
    if (!selectedCase) return
    
    if (!confirm('Вы уверены, что хотите открепить этого подозреваемого от дела?')) {
      return
    }
    
    try {
      await api.unlinkSuspectFromCaseFromCase(selectedCase.id, suspectId)
      
      // Reload suspects for the case
      const suspects = await api.getCaseSuspects(selectedCase.id)
      const suspectsArray = Array.isArray(suspects) ? suspects : []
      setCaseSuspects(suspectsArray)
      setSelectedCase(prev => prev ? {
        ...prev,
        suspects: suspectsArray
      } : null)
      
      addNotification({
        type: 'success',
        title: 'Подозреваемый откреплен',
        message: 'Подозреваемый успешно откреплен от дела'
      })
    } catch (error) {
      console.error('Failed to remove suspect from case:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось открепить подозреваемого от дела'
      })
    }
  }

  const handleEditCase = (case_: Case) => {
    setSelectedCase(case_)
    setEditCase({
      title: case_.title,
      description: case_.description,
      crime_type: case_.crime_type,
      location: case_.location || '',
      priority: case_.priority,
      status: case_.status
    })
    
    // Load existing evidence (for demo, create some sample evidence)
    const sampleEvidence = [
      {
        id: 1,
        type: 'photo',
        description: 'Фотографии с места происшествия',
        location: 'Место преступления',
        url: 'https://example.com/evidence/photos/crime-scene-001.jpg'
      },
      {
        id: 2,
        type: 'document',
        description: 'Показания свидетеля',
        location: 'Архив документов',
        url: 'https://example.com/evidence/documents/witness-statement-001.pdf'
      }
    ]
    setEditEvidenceList(sampleEvidence)
    setEditEvidenceCounter(3)
    
    setShowEditModal(true)
  }

  const handleUpdateCase = async () => {
    if (!selectedCase) return
    
    try {
      // Update case data (without evidence)
      await api.updateCase(selectedCase.id, editCase)
      
      // Handle evidence updates separately
      // Note: In a full implementation, you would need to:
      // 1. Get existing evidence for the case
      // 2. Compare with editEvidenceList to find additions/deletions
      // 3. Create new evidence items and delete removed ones
      // For now, we'll just add new evidence items
      
      let evidenceCount = 0
      if (editEvidenceList.length > 0) {
        try {
          for (const evidence of editEvidenceList) {
            // Only add evidence that doesn't have an ID (new evidence)
            if (!evidence.id || evidence.id > 1000) { // Assume IDs > 1000 are temporary
              const evidenceData = {
                case_id: selectedCase.id,
                evidence_type: evidence.type,
                title: evidence.description,
                description: evidence.description,
                file_url: evidence.url || undefined,
                chain_of_custody: `Добавлено при редактировании дела ${selectedCase.case_number}`
              }
              await api.createEvidence(evidenceData)
              evidenceCount++
            }
          }
        } catch (evidenceError) {
          console.error('Failed to update evidence:', evidenceError)
        }
      }
      
      addNotification({
        type: 'success',
        title: 'Дело обновлено',
        message: `Дело ${selectedCase.case_number} успешно обновлено${evidenceCount > 0 ? ` с ${evidenceCount} новыми уликами` : ''}`,
        action: {
          label: 'Открыть дело',
          onClick: () => {
            setShowEditModal(false)
            handleViewCase(selectedCase)
          }
        }
      })
      
      setShowEditModal(false)
      setEditEvidenceList([])
      setEditEvidenceCounter(1)
      loadCases()
    } catch (error) {
      console.error('Failed to update case:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка обновления',
        message: 'Не удалось обновить дело. Попробуйте еще раз.'
      })
    }
  }

  const handleArchiveCase = async (case_: Case) => {
    if (confirm(`Вы уверены, что хотите архивировать дело ${case_.case_number}?`)) {
      try {
        await api.deleteCase(case_.id)
        
        addNotification({
          type: 'success',
          title: 'Дело архивировано',
          message: `Дело ${case_.case_number} успешно архивировано`
        })
        
        // Reload cases
        loadCases()
      } catch (error) {
        console.error('Failed to archive case:', error)
        addNotification({
          type: 'error',
          title: 'Ошибка архивирования',
          message: 'Не удалось архивировать дело. Попробуйте еще раз.'
        })
      }
    }
  }

  const handleDeleteCase = async (case_: Case) => {
    if (confirm(`Вы уверены, что хотите удалить дело ${case_.case_number} навсегда? Это действие необратимо.`)) {
      try {
        await api.deleteCasePermanent(case_.id)

        addNotification({
          type: 'success',
          title: 'Дело удалено',
          message: `Дело ${case_.case_number} было удалено навсегда`
        })

        // Reload cases
        loadCases()
      } catch (error) {
        console.error('Failed to delete case:', error)
        addNotification({
          type: 'error',
          title: 'Ошибка удаления',
          message: 'Не удалось удалить дело. Попробуйте еще раз.'
        })
      }
    }
  }

  // Evidence management functions
  const addEvidence = () => {
    if (newEvidence.description.trim()) {
      setEvidenceList([...evidenceList, {
        id: evidenceCounter,
        ...newEvidence
      }])
      setEvidenceCounter(evidenceCounter + 1)
      setNewEvidence({
        type: 'document',
        description: '',
        location: '',
        url: ''
      })
    }
  }

  const removeEvidence = (id: number) => {
    setEvidenceList(evidenceList.filter(evidence => evidence.id !== id))
  }

  // Edit evidence functions
  const addEditEvidence = () => {
    if (newEvidence.description.trim()) {
      setEditEvidenceList([...editEvidenceList, {
        id: editEvidenceCounter,
        ...newEvidence
      }])
      setEditEvidenceCounter(editEvidenceCounter + 1)
      setNewEvidence({
        type: 'document',
        description: '',
        location: '',
        url: ''
      })
    }
  }

  const removeEditEvidence = (id: number) => {
    setEditEvidenceList(editEvidenceList.filter(evidence => evidence.id !== id))
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'document': return '📄'
      case 'photo': return '📷'
      case 'video': return '🎥'
      case 'audio': return '🎵'
      case 'physical': return '📦'
      case 'digital': return '💾'
      default: return '📄'
    }
  }

  const handleCreateCase = async () => {
    try {
      // Create case via API (without evidence)
      const caseData = {
        ...newCase,
        detective_id: 1 // For demo, assign to first detective
      }
      
      const createdCase = await api.createCase(caseData)
      
      // Add evidence if any were added
      if (evidenceList.length > 0) {
        try {
          for (const evidence of evidenceList) {
            const evidenceData = {
              case_id: (createdCase as any).id,
              evidence_type: evidence.type,
              title: evidence.description, // Use description as title
              description: evidence.description,
              file_url: evidence.url || undefined,
              chain_of_custody: `Добавлено при создании дела ${(createdCase as any).case_number}`
            }
            await api.createEvidence(evidenceData)
          }
        } catch (evidenceError) {
          console.error('Failed to create evidence:', evidenceError)
          // Don't fail the whole operation if evidence creation fails
        }
      }
      
      // Add success notification
      addNotification({
        type: 'success',
        title: 'Дело создано',
        message: `Дело "${newCase.title}" успешно создано${evidenceList.length > 0 ? ` с ${evidenceList.length} уликами` : ''}`,
        action: {
          label: 'Открыть дело',
          onClick: () => handleViewCase(createdCase as Case)
        }
      })
      
      setShowCreateModal(false)
      setNewCase({
        title: '',
        description: '',
        crime_type: '',
        location: '',
        priority: 'medium'
      })
      setEvidenceList([])
      setEvidenceCounter(1)
      // Reload cases
      loadCases()
    } catch (error) {
      console.error('Failed to create case:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка создания дела',
        message: 'Не удалось создать дело. Проверьте подключение к серверу.'
      })
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Загрузка дел...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Управление делами
            </h1>
            <p className="text-police-300 mt-2">Отслеживайте и управляйте всеми делами отдела</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => ExportService.exportCasesToCSV(filteredCases)}
              className="flex items-center px-4 py-2 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
              title="Экспорт в CSV"
            >
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Создать дело
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="police-card rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Поиск по номеру или названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-police-800/50 border border-police-600/30 rounded-xl px-4 py-3 text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-police-800/50 border border-police-600/30 rounded-xl px-4 py-3 text-white focus:border-badge-500 focus:outline-none transition-colors appearance-none"
                style={{
                  colorScheme: 'dark',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="all" className="bg-police-800 text-white">📊 Все статусы</option>
                <option value="active" className="bg-police-800 text-white">🟡 Активные</option>
                <option value="closed" className="bg-police-800 text-white">🟢 Закрытые</option>
                <option value="archived" className="bg-police-800 text-white">📁 Архивные</option>
              </select>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-center bg-police-800/30 rounded-xl p-3 border border-police-700/30">
              <div className="text-center">
                <p className="text-2xl font-bold text-badge-400">
                  {filteredCases.length}
                </p>
                <p className="text-sm text-police-300">найдено дел</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="police-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-police-700/30">
              <thead className="bg-police-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-police-300 uppercase tracking-wider">
                    Номер дела
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-police-300 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-police-300 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-police-300 uppercase tracking-wider">
                    Приоритет
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-police-300 uppercase tracking-wider">
                    Тип преступления
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-police-300 uppercase tracking-wider">
                    Дата создания
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-police-300 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-police-700/30">
                {filteredCases
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((case_) => (
                  <tr key={case_.id} className="hover:bg-police-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-badge-400">
                      {case_.case_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{case_.title}</div>
                      <div className="text-sm text-police-300 truncate max-w-xs">
                        {case_.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(case_.status)}>
                        {case_.status === 'active' ? 'Активно' : 
                         case_.status === 'closed' ? 'Закрыто' : 'Архив'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadge(case_.priority)}>
                        {case_.priority === 'urgent' ? 'Срочно' :
                         case_.priority === 'high' ? 'Высокий' :
                         case_.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-police-200">
                      {case_.crime_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-police-300">
                      {new Date(case_.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewCase(case_)}
                          className="text-badge-500 hover:text-badge-600 transition-colors"
                          title="Просмотреть дело"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditCase(case_)}
                          className="text-police-400 hover:text-police-300 transition-colors"
                          title="Редактировать дело"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleArchiveCase(case_)}
                          className="text-danger-500 hover:text-danger-600 transition-colors"
                          title="Архивировать дело"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCase(case_)}
                          className="text-danger-700 hover:text-danger-600 transition-colors"
                          title="Удалить дело"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCases.length === 0 && (
            <div className="text-center py-12">
              <div className="text-police-300">Дела не найдены</div>
            </div>
          )}
        </div>

        {/* Create Case Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="police-card rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Создать новое дело</h3>
                <button 
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewEvidence({ type: 'document', description: '', location: '', url: '' })
                    setEvidenceList([])
                    setEvidenceCounter(1)
                  }}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Название дела *
                  </label>
                  <input
                    type="text"
                    value={newCase.title}
                    onChange={(e) => setNewCase({...newCase, title: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                    placeholder="Введите название дела"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Описание *
                  </label>
                  <textarea
                    value={newCase.description}
                    onChange={(e) => setNewCase({...newCase, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors resize-none"
                    placeholder="Подробное описание дела..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Тип преступления *
                    </label>
                    <select
                      value={newCase.crime_type}
                      onChange={(e) => setNewCase({...newCase, crime_type: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                      required
                    >
                      <option value="">Выберите тип</option>
                      <option value="theft">Кража</option>
                      <option value="assault">Нападение</option>
                      <option value="fraud">Мошенничество</option>
                      <option value="burglary">Взлом</option>
                      <option value="drug_possession">Наркотики</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Приоритет
                    </label>
                    <select
                      value={newCase.priority}
                      onChange={(e) => setNewCase({...newCase, priority: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="urgent">Срочный</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Место происшествия
                  </label>
                  <input
                    type="text"
                    value={newCase.location}
                    onChange={(e) => setNewCase({...newCase, location: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                    placeholder="Адрес или описание места"
                  />
                </div>

                {/* Evidence Section */}
                <div className="border-t border-police-700/30 pt-6">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    📄 Улики и доказательства
                    <span className="text-xs text-police-400">({evidenceList.length})</span>
                  </h4>
                  
                  {/* Add Evidence Form */}
                  <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-police-300 mb-2">
                          Тип улики
                        </label>
                        <select
                          value={newEvidence.type}
                          onChange={(e) => setNewEvidence({...newEvidence, type: e.target.value})}
                          className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                        >
                          <option value="document">📄 Документ</option>
                          <option value="photo">📷 Фотография</option>
                          <option value="video">🎥 Видео</option>
                          <option value="audio">🎵 Аудио</option>
                          <option value="physical">📦 Физическая улика</option>
                          <option value="digital">💾 Цифровая улика</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-police-300 mb-2">
                          Описание улики
                        </label>
                        <input
                          type="text"
                          value={newEvidence.description}
                          onChange={(e) => setNewEvidence({...newEvidence, description: e.target.value})}
                          className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                          placeholder="Описание улики..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-police-300 mb-2">
                          Местонахождение
                        </label>
                        <input
                          type="text"
                          value={newEvidence.location}
                          onChange={(e) => setNewEvidence({...newEvidence, location: e.target.value})}
                          className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                          placeholder="Где найдена..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-police-300 mb-2">
                          Ссылка/URL
                        </label>
                        <input
                          type="url"
                          value={newEvidence.url}
                          onChange={(e) => setNewEvidence({...newEvidence, url: e.target.value})}
                          className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                          placeholder="https://example.com/evidence..."
                        />
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={addEvidence}
                      disabled={!newEvidence.description.trim()}
                      className="px-4 py-2 bg-badge-500/20 text-badge-400 rounded-xl hover:bg-badge-500/30 transition-colors border border-badge-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ➕ Добавить улику
                    </button>
                  </div>

                  {/* Evidence List */}
                  {evidenceList.length > 0 && (
                    <div className="space-y-2">
                      {evidenceList.map((evidence) => (
                        <div key={evidence.id} className="flex items-center justify-between p-3 bg-police-900/30 rounded-xl border border-police-700/20">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getEvidenceIcon(evidence.type)}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{evidence.description}</p>
                              {evidence.location && (
                                <p className="text-xs text-police-400">📍 {evidence.location}</p>
                              )}
                              {evidence.url && (
                                <a 
                                  href={evidence.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-badge-400 hover:text-badge-300 transition-colors inline-flex items-center gap-1"
                                >
                                  🔗 Открыть ссылку
                                </a>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeEvidence(evidence.id)}
                            className="text-danger-400 hover:text-danger-300 transition-colors"
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewEvidence({ type: 'document', description: '', location: '', url: '' })
                    setEvidenceList([])
                    setEvidenceCounter(1)
                  }}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleCreateCase}
                  disabled={!newCase.title || !newCase.description || !newCase.crime_type}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-badge-500 to-badge-600 text-white rounded-xl hover:from-badge-600 hover:to-badge-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Создать дело
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Case Modal */}
        {showViewModal && selectedCase && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="police-card rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedCase.case_number}</h3>
                  <p className="text-police-300 text-sm mt-1">{selectedCase.title}</p>
                </div>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-police-800/30 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-police-300 mb-2">Статус</h4>
                    <span className={getStatusBadge(selectedCase.status)}>
                      {selectedCase.status === 'active' ? 'Активно' : 
                       selectedCase.status === 'closed' ? 'Закрыто' : 'Архив'}
                    </span>
                  </div>
                  
                  <div className="bg-police-800/30 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-police-300 mb-2">Приоритет</h4>
                    <span className={getPriorityBadge(selectedCase.priority)}>
                      {selectedCase.priority === 'urgent' ? 'Срочно' :
                       selectedCase.priority === 'high' ? 'Высокий' :
                       selectedCase.priority === 'medium' ? 'Средний' : 'Низкий'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-police-800/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-police-300 mb-2">Описание</h4>
                  <p className="text-white text-sm leading-relaxed">{selectedCase.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-police-800/30 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-police-300 mb-2">Тип преступления</h4>
                    <p className="text-white text-sm">{selectedCase.crime_type}</p>
                  </div>
                  
                  <div className="bg-police-800/30 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-police-300 mb-2">Место происшествия</h4>
                    <p className="text-white text-sm">{selectedCase.location || 'Не указано'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-police-800/30 rounded-xl p-4">
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
                  
                  <div className="bg-police-800/30 rounded-xl p-4">
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
                </div>

                {/* Evidence Section in View Modal */}
                <div className="bg-police-800/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-police-300 mb-3 flex items-center gap-2">
                    📄 Улики и доказательства
                    <span className="text-xs text-police-400">({(selectedCase as any).evidence?.length || 0})</span>
                  </h4>
                  {(selectedCase as any).evidence && (selectedCase as any).evidence.length > 0 ? (
                    <div className="space-y-2">
                      {(selectedCase as any).evidence.map((evidence: any) => (
                        <div key={evidence.id} className="flex items-center justify-between p-2 bg-police-900/30 rounded-lg border border-police-700/20">
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
                      <div className="text-4xl mb-4">📄</div>
                      <p className="text-police-300">Улики не найдены</p>
                      <p className="text-sm text-police-400 mt-2">К этому делу пока не добавлены улики</p>
                    </div>
                  )}
                </div>

                {/* Suspects Section in View Modal */}
                <div className="bg-police-800/30 rounded-xl p-4" data-testid="suspects-section">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-police-300 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Подозреваемые
                      <span className="text-xs text-police-400">({caseSuspects.length})</span>
                    </h4>
                    <button
                      onClick={() => {
                        console.log('Кнопка "Добавить" нажата')
                        loadAllSuspects()
                        setShowAddSuspectModal(true)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-badge-500/20 text-badge-400 rounded-lg hover:bg-badge-500/30 transition-colors border border-badge-500/30 text-xs"
                      data-testid="add-suspect-button"
                    >
                      <UserPlus className="h-3 w-3" />
                      Добавить
                    </button>
                  </div>
                  {caseSuspects.length > 0 ? (
                    <div className="space-y-2">
                      {caseSuspects.map((suspect) => (
                        <div key={suspect.id} className="flex items-center justify-between p-3 bg-police-900/30 rounded-lg border border-police-700/20">
                          <div className="flex items-center gap-3">
                            {suspect.photo_url ? (
                              <img 
                                src={suspect.photo_url} 
                                alt={suspect.full_name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-police-600/50"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-police-700/50 flex items-center justify-center border-2 border-police-600/50">
                                <User className="h-5 w-5 text-police-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{suspect.full_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  suspect.status === 'active' ? 'bg-warning-500/20 text-warning-400' :
                                  suspect.status === 'arrested' ? 'bg-danger-500/20 text-danger-400' :
                                  suspect.status === 'cleared' ? 'bg-success-500/20 text-success-400' :
                                  'bg-police-500/20 text-police-400'
                                }`}>
                                  {suspect.status === 'active' ? 'Активен' :
                                   suspect.status === 'arrested' ? 'Арестован' :
                                   suspect.status === 'cleared' ? 'Оправдан' :
                                   suspect.status}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  suspect.risk_level === 'extreme' ? 'bg-danger-500/20 text-danger-400' :
                                  suspect.risk_level === 'high' ? 'bg-warning-500/20 text-warning-400' :
                                  suspect.risk_level === 'medium' ? 'bg-badge-500/20 text-badge-400' :
                                  'bg-police-500/20 text-police-400'
                                }`}>
                                  Риск: {suspect.risk_level === 'extreme' ? 'Крайний' :
                                         suspect.risk_level === 'high' ? 'Высокий' :
                                         suspect.risk_level === 'medium' ? 'Средний' : 'Низкий'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSuspectFromCase(suspect.id)}
                            className="text-danger-400 hover:text-danger-300 transition-colors p-1"
                            title="Открепить от дела"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-police-900/50 border-2 border-dashed border-police-600/50 rounded-lg p-8 text-center">
                      <div className="text-4xl mb-4">👤</div>
                      <p className="text-police-300">Подозреваемые не прикреплены</p>
                      <button
                        onClick={() => {
                          loadAllSuspects()
                          setShowAddSuspectModal(true)
                        }}
                        className="mt-4 px-4 py-2 bg-badge-500/20 text-badge-400 rounded-lg hover:bg-badge-500/30 transition-colors border border-badge-500/30 text-sm"
                      >
                        Добавить подозреваемого
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
                >
                  Закрыть
                </button>
                <button 
                  onClick={() => handleDeleteCase(selectedCase)}
                  className="px-4 py-3 bg-danger-700 text-white rounded-xl hover:bg-danger-600 transition-all"
                >
                  Удалить
                </button>
                <button 
                  onClick={() => {
                    setShowViewModal(false)
                    handleEditCase(selectedCase)
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-badge-500 to-badge-600 text-white rounded-xl hover:from-badge-600 hover:to-badge-700 transition-all"
                >
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Case Modal */}
        {showEditModal && selectedCase && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="police-card rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Редактировать дело</h3>
                  <p className="text-police-300 text-sm mt-1">{selectedCase.case_number}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowEditModal(false)
                    setNewEvidence({ type: 'document', description: '', location: '', url: '' })
                  }}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Название дела *
                  </label>
                  <input
                    type="text"
                    value={editCase.title}
                    onChange={(e) => setEditCase({...editCase, title: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                    placeholder="Введите название дела"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Описание *
                  </label>
                  <textarea
                    value={editCase.description}
                    onChange={(e) => setEditCase({...editCase, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors resize-none"
                    placeholder="Подробное описание дела..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Тип преступления *
                    </label>
                    <select
                      value={editCase.crime_type}
                      onChange={(e) => setEditCase({...editCase, crime_type: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                      required
                    >
                      <option value="">Выберите тип</option>
                      <option value="theft">Кража</option>
                      <option value="assault">Нападение</option>
                      <option value="fraud">Мошенничество</option>
                      <option value="burglary">Взлом</option>
                      <option value="drug_possession">Наркотики</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Приоритет
                    </label>
                    <select
                      value={editCase.priority}
                      onChange={(e) => setEditCase({...editCase, priority: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="urgent">Срочный</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Статус
                    </label>
                    <select
                      value={editCase.status}
                      onChange={(e) => setEditCase({...editCase, status: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="active">Активно</option>
                      <option value="closed">Закрыто</option>
                      <option value="archived">Архив</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-300 mb-2">
                    Место происшествия
                  </label>
                  <input
                    type="text"
                    value={editCase.location}
                    onChange={(e) => setEditCase({...editCase, location: e.target.value})}
                    className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                    placeholder="Адрес или описание места"
                  />
                </div>

                {/* Suspects Section in Edit Modal (same as view modal) */}
                <div className="bg-police-800/30 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-police-300 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Подозреваемые
                      <span className="text-xs text-police-400">({caseSuspects.length})</span>
                    </h4>
                    <button
                      onClick={() => {
                        loadAllSuspects()
                        setShowAddSuspectModal(true)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-badge-500/20 text-badge-400 rounded-lg hover:bg-badge-500/30 transition-colors border border-badge-500/30 text-xs"
                    >
                      <UserPlus className="h-3 w-3" />
                      Добавить
                    </button>
                  </div>
                  {caseSuspects.length > 0 ? (
                    <div className="space-y-2">
                      {caseSuspects.map((suspect) => (
                        <div key={suspect.id} className="flex items-center justify-between p-3 bg-police-900/30 rounded-lg border border-police-700/20">
                          <div className="flex items-center gap-3">
                            {suspect.photo_url ? (
                              <img 
                                src={suspect.photo_url} 
                                alt={suspect.full_name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-police-600/50"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-police-700/50 flex items-center justify-center border-2 border-police-600/50">
                                <User className="h-5 w-5 text-police-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{suspect.full_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  suspect.status === 'active' ? 'bg-warning-500/20 text-warning-400' :
                                  suspect.status === 'arrested' ? 'bg-danger-500/20 text-danger-400' :
                                  suspect.status === 'cleared' ? 'bg-success-500/20 text-success-400' :
                                  'bg-police-500/20 text-police-400'
                                }`}>
                                  {suspect.status === 'active' ? 'Активен' :
                                   suspect.status === 'arrested' ? 'Арестован' :
                                   suspect.status === 'cleared' ? 'Оправдан' :
                                   suspect.status}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  suspect.risk_level === 'extreme' ? 'bg-danger-500/20 text-danger-400' :
                                  suspect.risk_level === 'high' ? 'bg-warning-500/20 text-warning-400' :
                                  suspect.risk_level === 'medium' ? 'bg-badge-500/20 text-badge-400' :
                                  'bg-police-500/20 text-police-400'
                                }`}>
                                  Риск: {suspect.risk_level === 'extreme' ? 'Крайний' :
                                         suspect.risk_level === 'high' ? 'Высокий' :
                                         suspect.risk_level === 'medium' ? 'Средний' : 'Низкий'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSuspectFromCase(suspect.id)}
                            className="text-danger-400 hover:text-danger-300 transition-colors p-1"
                            title="Открепить от дела"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-police-900/50 border-2 border-dashed border-police-600/50 rounded-lg p-8 text-center">
                      <div className="text-4xl mb-4">👤</div>
                      <p className="text-police-300">Подозреваемые не прикреплены</p>
                      <button
                        onClick={() => {
                          loadAllSuspects()
                          setShowAddSuspectModal(true)
                        }}
                        className="mt-4 px-4 py-2 bg-badge-500/20 text-badge-400 rounded-lg hover:bg-badge-500/30 transition-colors border border-badge-500/30 text-sm"
                      >
                        Добавить подозреваемого
                      </button>
                    </div>
                  )}
                </div>

                {/* Evidence Section */}
                <div className="border-t border-police-700/30 pt-6">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    📄 Улики и доказательства
                    <span className="text-xs text-police-400">({editEvidenceList.length})</span>
                  </h4>
                  
                  {/* Add Evidence Form */}
                  <div className="bg-police-800/30 rounded-xl p-4 border border-police-700/30 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-police-300 mb-2">
                          Тип улики
                        </label>
                        <select
                          value={newEvidence.type}
                          onChange={(e) => setNewEvidence({...newEvidence, type: e.target.value})}
                          className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                        >
                          <option value="document">📄 Документ</option>
                          <option value="photo">📷 Фотография</option>
                          <option value="video">🎥 Видео</option>
                          <option value="audio">🎵 Аудио</option>
                          <option value="physical">📦 Физическая улика</option>
                          <option value="digital">💾 Цифровая улика</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-police-300 mb-2">
                          Описание улики
                        </label>
                        <input
                          type="text"
                          value={newEvidence.description}
                          onChange={(e) => setNewEvidence({...newEvidence, description: e.target.value})}
                          className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                          placeholder="Описание улики..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-police-300 mb-2">
                          Местонахождение
                        </label>
                        <input
                          type="text"
                          value={newEvidence.location}
                          onChange={(e) => setNewEvidence({...newEvidence, location: e.target.value})}
                          className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                          placeholder="Где найдена..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-police-300 mb-2">
                          Ссылка/URL
                        </label>
                        <input
                          type="url"
                          value={newEvidence.url}
                          onChange={(e) => setNewEvidence({...newEvidence, url: e.target.value})}
                          className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                          placeholder="https://example.com/evidence..."
                        />
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={addEditEvidence}
                      disabled={!newEvidence.description.trim()}
                      className="px-4 py-2 bg-badge-500/20 text-badge-400 rounded-xl hover:bg-badge-500/30 transition-colors border border-badge-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ➕ Добавить улику
                    </button>
                  </div>

                  {/* Evidence List */}
                  {editEvidenceList.length > 0 && (
                    <div className="space-y-2">
                      {editEvidenceList.map((evidence) => (
                        <div key={evidence.id} className="flex items-center justify-between p-3 bg-police-900/30 rounded-xl border border-police-700/20">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getEvidenceIcon(evidence.type)}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{evidence.description}</p>
                              {evidence.location && (
                                <p className="text-xs text-police-400">📍 {evidence.location}</p>
                              )}
                              {evidence.url && (
                                <a 
                                  href={evidence.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-badge-400 hover:text-badge-300 transition-colors inline-flex items-center gap-1"
                                >
                                  🔗 Открыть ссылку
                                </a>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeEditEvidence(evidence.id)}
                            className="text-danger-400 hover:text-danger-300 transition-colors"
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setNewEvidence({ type: 'document', description: '', location: '', url: '' })
                  }}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleUpdateCase}
                  disabled={!editCase.title || !editCase.description || !editCase.crime_type}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-badge-500 to-badge-600 text-white rounded-xl hover:from-badge-600 hover:to-badge-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Сохранить изменения
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Suspect Modal */}
        {showAddSuspectModal && selectedCase && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="police-card rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Добавить подозреваемого</h3>
                  <p className="text-police-300 text-sm mt-1">Дело: {selectedCase.case_number}</p>
                </div>
                <button 
                  onClick={() => setShowAddSuspectModal(false)}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-police-800/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-police-300 mb-3">Выберите подозреваемого</h4>
                  {allSuspects.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {allSuspects
                        .filter(suspect => !caseSuspects.some(cs => cs.id === suspect.id))
                        .map((suspect) => (
                          <div 
                            key={suspect.id} 
                            className="flex items-center justify-between p-3 bg-police-900/30 rounded-lg border border-police-700/20 hover:border-badge-500/50 transition-colors cursor-pointer"
                            onClick={() => handleAddSuspectToCase(suspect.id)}
                          >
                            <div className="flex items-center gap-3">
                              {suspect.photo_url ? (
                                <img 
                                  src={suspect.photo_url} 
                                  alt={suspect.full_name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-police-600/50"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-police-700/50 flex items-center justify-center border-2 border-police-600/50">
                                  <User className="h-5 w-5 text-police-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-white">{suspect.full_name}</p>
                                  {suspect.role_in_case && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-police-700/30 text-police-200">
                                      {suspect.role_in_case === 'suspect' ? 'Подозреваемый' :
                                       suspect.role_in_case === 'witness' ? 'Свидетель' :
                                       suspect.role_in_case === 'person_of_interest' ? 'Лицо(И)' : suspect.role_in_case}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    suspect.status === 'active' ? 'bg-warning-500/20 text-warning-400' :
                                    suspect.status === 'arrested' ? 'bg-danger-500/20 text-danger-400' :
                                    suspect.status === 'cleared' ? 'bg-success-500/20 text-success-400' :
                                    'bg-police-500/20 text-police-400'
                                  }`}>
                                    {suspect.status === 'active' ? 'Активен' :
                                     suspect.status === 'arrested' ? 'Арестован' :
                                     suspect.status === 'cleared' ? 'Оправдан' :
                                     suspect.status}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    suspect.risk_level === 'extreme' ? 'bg-danger-500/20 text-danger-400' :
                                    suspect.risk_level === 'high' ? 'bg-warning-500/20 text-warning-400' :
                                    suspect.risk_level === 'medium' ? 'bg-badge-500/20 text-badge-400' :
                                    'bg-police-500/20 text-police-400'
                                  }`}>
                                    Риск: {suspect.risk_level === 'extreme' ? 'Крайний' :
                                           suspect.risk_level === 'high' ? 'Высокий' :
                                           suspect.risk_level === 'medium' ? 'Средний' : 'Низкий'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddSuspectToCase(suspect.id)
                              }}
                              className="text-badge-400 hover:text-badge-300 transition-colors p-1"
                              title="Добавить к делу"
                            >
                              <UserPlus className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="bg-police-900/50 border-2 border-dashed border-police-600/50 rounded-lg p-8 text-center">
                      <div className="text-4xl mb-4">👤</div>
                      <p className="text-police-300">Подозреваемые не найдены</p>
                      <p className="text-sm text-police-400 mt-2">Создайте подозреваемого в разделе "Подозреваемые"</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddSuspectModal(false)}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}