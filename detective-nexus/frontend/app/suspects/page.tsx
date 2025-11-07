'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { 
  Users, Search, Plus, Edit, Trash2, Eye, AlertTriangle, 
  User, Calendar, MapPin, Phone, Mail, FileText, X, Save,
  Shield, Crown, Star, Link, Unlink, Camera, Car, UserCheck,
  Network, Info
} from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getUserPermissions, getRankDisplayName } from '@/lib/permissions'
import { useNotifications } from '@/contexts/NotificationContext'
import { api } from '@/lib/api'
import { Suspect } from '@/types'

export default function SuspectsPage() {
  const { user } = useCurrentUser()
  const permissions = getUserPermissions(user)
  const { addNotification } = useNotifications()
  
  const [suspects, setSuspects] = useState<Suspect[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [suspectCases, setSuspectCases] = useState<{ [key: number]: any[] }>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showLinkCaseModal, setShowLinkCaseModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Form state
  const [suspectForm, setSuspectForm] = useState({
    full_name: '',
    aliases: '',
    date_of_birth: '',
    place_of_birth: '',
    nationality: '',
    gender: '',
    last_known_address: '',
    phone_numbers: '',
    email_addresses: '',
    criminal_record: '',
    previous_arrests: '',
    known_associates: '',
  status: 'active',
  risk_level: 'medium',
    occupation: '',
    education: '',
    notes: '',
    photo_url: '',
    // Новые поля
    vehicle_info: '',
    gang_affiliation: '',
    is_informant: false,
    connections: [] as Array<{
      suspect_id: number,
      suspect_name: string,
      relationship_type: string,
      description: string
    }>
  })

  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Connections management
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [editingConnectionIndex, setEditingConnectionIndex] = useState<number | null>(null)
  const [connectionForm, setConnectionForm] = useState({
    suspect_id: 0,
    suspect_name: '',
    relationship_type: '',
    description: ''
  })
  const [availableSuspects, setAvailableSuspects] = useState<Suspect[]>([])
  // Vehicles for selected suspect
  const [suspectVehicles, setSuspectVehicles] = useState<any[]>([])
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicleCreating, setVehicleCreating] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    color: '',
    owner: '',
    plate: ''
  })
  const [vehicleEditingId, setVehicleEditingId] = useState<number | null>(null)
  // Vehicles created while creating a new suspect (not yet persisted)
  const [createModeVehicles, setCreateModeVehicles] = useState<any[]>([])
  // Context for vehicle modal: 'view' | 'edit' | 'create'
  const [vehicleModalContext, setVehicleModalContext] = useState<'view' | 'edit' | 'create'>('view')

  useEffect(() => {
    console.log('🚀 useEffect запущен, начинаем загрузку данных...')
    // Загружаем данные при первой загрузке компонента
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Начинаем загрузку данных подозреваемых...')
      
      console.log('📡 Делаем запрос к API подозреваемых...')
      const suspectsData = await api.getSuspects()
      console.log('✅ Получены данные подозреваемых:', suspectsData)
      
      // Парсим connections из JSON строки в массив для каждого подозреваемого
      const parsedSuspects = (suspectsData as any[]).map((suspect: any) => {
        if (suspect.connections && typeof suspect.connections === 'string') {
          try {
            suspect.connections = JSON.parse(suspect.connections)
          } catch (e) {
            console.warn('Ошибка парсинга connections для подозреваемого', suspect.id, e);
            suspect.connections = []
          }
        } else if (!suspect.connections) {
          suspect.connections = []
        }
        return suspect
      })
      
      console.log('📡 Делаем запрос к API дел...')
      const casesData = await api.getCases()
      console.log('✅ Получены данные дел:', casesData)
      
      setSuspects(parsedSuspects as Suspect[])
      setCases(casesData as any[])
      
      console.log('🎉 Все данные успешно загружены!')
      
    } catch (error) {
      console.error('❌ Ошибка при загрузке данных:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка загрузки',
        message: `Не удалось загрузить данные: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      })
    } finally {
      console.log('🏁 Завершаем загрузку, устанавливаем loading = false')
      setLoading(false)
    }
  }

  const handleCreateSuspect = async () => {
    setCreating(true)
    try {
      let photoUrl = suspectForm.photo_url
      
      // If a new photo was selected, use the preview (base64) as photo_url
      if (selectedPhoto && photoPreview) {
        photoUrl = photoPreview
      }
      
      const suspectData = {
        ...suspectForm,
        photo_url: photoUrl,
        created_by: user?.id || 1,
        date_of_birth: suspectForm.date_of_birth || null,
        connections: JSON.stringify(suspectForm.connections)
      }
      
      const created = await api.createSuspect(suspectData)

      // If there are vehicles added in create modal, persist them for the new suspect
      const createdId = created && typeof (created as any).id === 'number' ? (created as any).id : null
      if (createModeVehicles.length && createdId) {
        for (const v of createModeVehicles) {
          try {
            await api.createSuspectVehicle(createdId, { make: v.make, color: v.color, owner: v.owner, plate: v.plate })
          } catch (err) {
            console.error('Failed to persist vehicle for new suspect:', err)
          }
        }
        // clear local draft vehicles
        setCreateModeVehicles([])
      }
      
      addNotification({
        type: 'success',
        title: 'Подозреваемый добавлен',
        message: `Личное дело ${suspectForm.full_name} создано успешно`
      })
      
      setShowCreateModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to create suspect:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка создания',
        message: 'Не удалось создать личное дело подозреваемого'
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEditSuspect = (suspect: Suspect) => {
    setSelectedSuspect(suspect)
    
    // Парсим connections из JSON строки, если это строка
    let parsedConnections: Array<{
      suspect_id: number,
      suspect_name: string,
      relationship_type: string,
      description: string
    }> = []
    
    if ((suspect as any).connections) {
        if (typeof (suspect as any).connections === 'string') {
        try {
          parsedConnections = JSON.parse((suspect as any).connections)
        } catch (e) {
          console.warn('Ошибка парсинга connections при редактировании:', e);
          parsedConnections = []
        }
      } else if (Array.isArray((suspect as any).connections)) {
        parsedConnections = (suspect as any).connections
      }
    }
    
    setSuspectForm({
      full_name: suspect.full_name,
      aliases: suspect.aliases || '',
      date_of_birth: suspect.date_of_birth ? suspect.date_of_birth.split('T')[0] : '',
      place_of_birth: suspect.place_of_birth || '',
      nationality: suspect.nationality || '',
      gender: suspect.gender || '',
      last_known_address: suspect.last_known_address || '',
      phone_numbers: suspect.phone_numbers || '',
      email_addresses: suspect.email_addresses || '',
      criminal_record: suspect.criminal_record || '',
      previous_arrests: suspect.previous_arrests || '',
      known_associates: suspect.known_associates || '',
      status: suspect.status,
      risk_level: suspect.risk_level,
      occupation: suspect.occupation || '',
      education: suspect.education || '',
      notes: suspect.notes || '',
      photo_url: suspect.photo_url || '',
      vehicle_info: (suspect as any).vehicle_info || '',
      gang_affiliation: (suspect as any).gang_affiliation || '',
      is_informant: (suspect as any).is_informant || false,
      connections: parsedConnections
    })
    
    // Set photo preview if exists
    if (suspect.photo_url) {
      setPhotoPreview(suspect.photo_url)
    } else {
      setPhotoPreview(null)
    }
  setSelectedPhoto(null);

  // load vehicles for editing
  (async () => {
      try {
        const vehicles = await api.getSuspectVehicles(suspect.id)
        const vehiclesArray = Array.isArray(vehicles) ? vehicles : []
        setSuspectVehicles(vehiclesArray)
      } catch (err) {
        console.error('Failed to load vehicles for edit:', err)
        setSuspectVehicles([])
      }
      setShowEditModal(true)
    })()
  }

  const handleUpdateSuspect = async () => {
    if (!selectedSuspect) return
    
    setUpdating(true)
    try {
      let photoUrl = suspectForm.photo_url
      
      // If a new photo was selected, use the preview (base64) as photo_url
      if (selectedPhoto && photoPreview) {
        photoUrl = photoPreview
      }
      
      await api.updateSuspect(selectedSuspect.id, {
        ...suspectForm,
        photo_url: photoUrl,
        date_of_birth: suspectForm.date_of_birth || null,
        connections: JSON.stringify(suspectForm.connections)
      })
      
      addNotification({
        type: 'success',
        title: 'Данные обновлены',
        message: `Личное дело ${suspectForm.full_name} обновлено`
      })
      
      setShowEditModal(false)
      setSelectedSuspect(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to update suspect:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка обновления',
        message: 'Не удалось обновить данные подозреваемого'
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleViewSuspect = async (suspect: Suspect) => {
    // Парсим connections из JSON строки, если это строка
    const suspectWithParsedConnections = { ...suspect }
    if ((suspect as any).connections) {
      if (typeof (suspect as any).connections === 'string') {
        try {
          (suspectWithParsedConnections as any).connections = JSON.parse((suspect as any).connections)
        } catch (e) {
          console.warn('Ошибка парсинга connections при просмотре:', e);
          (suspectWithParsedConnections as any).connections = []
        }
      }
    } else {
      (suspectWithParsedConnections as any).connections = []
    }
    
    setSelectedSuspect(suspectWithParsedConnections as Suspect)
    
    // Load cases for this suspect
    try {
      const suspectCasesData = await api.getSuspectCases(suspect.id)
      const casesArray = Array.isArray(suspectCasesData) ? suspectCasesData : []
      setSuspectCases(prev => ({
        ...prev,
        [suspect.id]: casesArray
      }))
      // load vehicles for suspect
      try {
        const vehicles = await api.getSuspectVehicles(suspect.id)
        const vehiclesArray = Array.isArray(vehicles) ? vehicles : []
        setSuspectVehicles(vehiclesArray)
      } catch (err) {
        console.error('Failed to load suspect vehicles:', err)
        setSuspectVehicles([])
      }
    } catch (error) {
      console.error('Failed to load suspect cases:', error)
      setSuspectCases(prev => ({
        ...prev,
        [suspect.id]: []
      }))
    }
    
    setShowViewModal(true)
  }

  const openVehicleModal = () => {
    setVehicleForm({ make: '', color: '', owner: '', plate: '' })
    setVehicleEditingId(null)
    // Determine context: if creating suspect, open in 'create' context; if editing or viewing selectedSuspect then 'edit' or 'view'
    if (showCreateModal) setVehicleModalContext('create')
    else if (showEditModal) setVehicleModalContext('edit')
    else setVehicleModalContext('view')
    setShowVehicleModal(true)
  }

  const handleCreateVehicle = async () => {
    setVehicleCreating(true)
    try {
      if (vehicleModalContext === 'create') {
        // During suspect creation we store vehicles locally until suspect is created
        if (vehicleEditingId) {
          // update existing draft vehicle
          setCreateModeVehicles(prev => prev.map(v => v.id === vehicleEditingId ? { ...v, ...vehicleForm } : v))
          addNotification({ type: 'success', title: 'ТС обновлено', message: 'Данные чернового ТС обновлены' })
        } else {
          const newVehicle = { ...vehicleForm, id: Date.now() }
          setCreateModeVehicles(prev => [...prev, newVehicle])
          addNotification({ type: 'success', title: 'ТС добавлено', message: 'Транспортное средство добавлено в черновик' })
        }
      } else {
        if (!selectedSuspect) return
        if (vehicleEditingId) {
          await api.updateSuspectVehicle(selectedSuspect.id, vehicleEditingId, vehicleForm)
          addNotification({ type: 'success', title: 'ТС обновлено', message: 'Данные транспортного средства обновлены' })
        } else {
          await api.createSuspectVehicle(selectedSuspect.id, vehicleForm)
          addNotification({ type: 'success', title: 'ТС добавлено', message: 'Транспортное средство добавлено для подозреваемого' })
        }
        // reload vehicles
        const vehicles = await api.getSuspectVehicles(selectedSuspect.id)
        const vehiclesArray = Array.isArray(vehicles) ? vehicles : []
        setSuspectVehicles(vehiclesArray)
      }
      setShowVehicleModal(false)
      setVehicleEditingId(null)
    } catch (err) {
      console.error('Failed to create vehicle:', err)
      addNotification({ type: 'error', title: 'Ошибка', message: 'Не удалось добавить ТС' })
    } finally {
      setVehicleCreating(false)
    }
  }

  const handleEditVehicle = (v: any) => {
    setVehicleForm({ make: v.make || '', color: v.color || '', owner: v.owner || '', plate: v.plate || '' })
    setVehicleEditingId(v.id)
    // ensure modal context is 'edit' when editing an existing vehicle
    setVehicleModalContext('edit')
    setShowVehicleModal(true)
  }

  const handleDeleteVehicle = async (v: any) => {
    if (!selectedSuspect) return
    if (!confirm(`Удалить ТС ${v.make || ''} ${v.plate || ''}?`)) return
    try {
      await api.deleteSuspectVehicle(selectedSuspect.id, v.id)
      addNotification({ type: 'success', title: 'ТС удалено', message: 'Транспортное средство удалено' })
  const vehicles = await api.getSuspectVehicles(selectedSuspect.id)
  const vehiclesArray = Array.isArray(vehicles) ? vehicles : []
  setSuspectVehicles(vehiclesArray)
    } catch (err) {
      console.error('Failed to delete vehicle:', err)
      addNotification({ type: 'error', title: 'Ошибка', message: 'Не удалось удалить ТС' })
    }
  }

  const handleDeleteSuspect = (suspect: Suspect) => {
    if (!permissions.canEditProfiles) {
      addNotification({
        type: 'error',
        title: 'Доступ запрещен',
        message: 'У вас нет прав для удаления подозреваемых. Требуется звание старшего детектива или выше.'
      })
      return
    }
    setSelectedSuspect(suspect)
    setShowDeleteModal(true)
  }

  const confirmDeleteSuspect = async () => {
    if (!selectedSuspect) return
    
    setDeleting(true)
    try {
      await api.deleteSuspect(selectedSuspect.id)
      
      addNotification({
        type: 'success',
        title: 'Подозреваемый удален',
        message: `Личное дело ${selectedSuspect.full_name} удалено из системы`
      })
      
      setShowDeleteModal(false)
      setSelectedSuspect(null)
      loadData()
    } catch (error) {
      console.error('Failed to delete suspect:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка удаления',
        message: 'Не удалось удалить подозреваемого. Возможно, он связан с активными делами.'
      })
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setSuspectForm({
      full_name: '',
      aliases: '',
      date_of_birth: '',
      place_of_birth: '',
      nationality: '',
      gender: '',
      last_known_address: '',
      phone_numbers: '',
      email_addresses: '',
      criminal_record: '',
      previous_arrests: '',
      known_associates: '',
      status: 'active',
      risk_level: 'medium',
      occupation: '',
      education: '',
      notes: '',
      photo_url: '',
      vehicle_info: '',
      gang_affiliation: '',
      is_informant: false,
      connections: []
    })
    setSelectedPhoto(null)
    setPhotoPreview(null)
  }

  // Photo handling functions
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        addNotification({
          type: 'error',
          title: 'Файл слишком большой',
          message: 'Размер фотографии не должен превышать 5MB'
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        addNotification({
          type: 'error',
          title: 'Неверный формат файла',
          message: 'Пожалуйста, выберите изображение'
        })
        return
      }

      setSelectedPhoto(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setSelectedPhoto(null)
    setPhotoPreview(null)
    setSuspectForm({...suspectForm, photo_url: ''})
  }

  // Connection management functions
  const loadAvailableSuspects = () => {
    // Фильтруем подозреваемых, исключая текущего и уже связанных
    const currentSuspectId = selectedSuspect?.id || 0
    const available = suspects.filter(s => 
      s.id !== currentSuspectId && 
      !suspectForm.connections.some(c => c.suspect_id === s.id)
    )
    setAvailableSuspects(available)
  }

  const addConnection = () => {
    // Если редактируем существующую связь
    if (editingConnectionIndex !== null) {
      updateConnection()
      return
    }

    // Добавляем новую связь
    if (!connectionForm.suspect_id || !connectionForm.relationship_type) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Выберите подозреваемого и тип связи'
      })
      return
    }

    const selectedSuspectForConnection = availableSuspects.find(s => s.id === connectionForm.suspect_id)
    if (!selectedSuspectForConnection) return

    const newConnection = {
      suspect_id: connectionForm.suspect_id,
      suspect_name: selectedSuspectForConnection.full_name,
      relationship_type: connectionForm.relationship_type,
      description: connectionForm.description
    }

    setSuspectForm({
      ...suspectForm,
      connections: [...suspectForm.connections, newConnection]
    })

    setConnectionForm({
      suspect_id: 0,
      suspect_name: '',
      relationship_type: '',
      description: ''
    })
    setShowConnectionModal(false)
  }

  const removeConnection = (index: number) => {
    const updatedConnections = suspectForm.connections.filter((_, i) => i !== index)
    setSuspectForm({...suspectForm, connections: updatedConnections})
  }

  const editConnection = (index: number) => {
    const connection = suspectForm.connections[index]
    setConnectionForm({
      suspect_id: connection.suspect_id,
      suspect_name: connection.suspect_name,
      relationship_type: connection.relationship_type,
      description: connection.description
    })
    setEditingConnectionIndex(index)
    loadAvailableSuspects()
    setShowConnectionModal(true)
  }

  const updateConnection = () => {
    if (editingConnectionIndex === null || !connectionForm.relationship_type) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Выберите тип связи'
      })
      return
    }

    const updatedConnections = [...suspectForm.connections]
    updatedConnections[editingConnectionIndex] = {
      ...updatedConnections[editingConnectionIndex],
      relationship_type: connectionForm.relationship_type,
      description: connectionForm.description
    }

    setSuspectForm({
      ...suspectForm,
      connections: updatedConnections
    })

    setConnectionForm({
      suspect_id: 0,
      suspect_name: '',
      relationship_type: '',
      description: ''
    })
    setEditingConnectionIndex(null)
    setShowConnectionModal(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-warning-500/20 text-warning-400 border-warning-500/30'
      case 'arrested': return 'bg-danger-500/20 text-danger-400 border-danger-500/30'
      case 'cleared': return 'bg-success-500/20 text-success-400 border-success-500/30'
      case 'deceased': return 'bg-police-500/20 text-police-400 border-police-500/30'
      case 'unknown': return 'bg-police-600/20 text-police-300 border-police-600/30'
      default: return 'bg-police-500/20 text-police-400 border-police-500/30'
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-success-500/20 text-success-400 border-success-500/30'
      case 'medium': return 'bg-warning-500/20 text-warning-400 border-warning-500/30'
      case 'high': return 'bg-danger-500/20 text-danger-400 border-danger-500/30'
      case 'extreme': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-police-500/20 text-police-400 border-police-500/30'
    }
  }

  const getStatusName = (status: string) => {
    switch (status) {
      case 'active': return 'Активен'
      case 'arrested': return 'Арестован'
      case 'cleared': return 'Оправдан'
      case 'deceased': return 'Умер'
      case 'unknown': return 'Неизвестно'
      default: return status
    }
  }

  const getRiskName = (risk: string) => {
    switch (risk) {
      case 'low': return 'Низкий'
      case 'medium': return 'Средний'
      case 'high': return 'Высокий'
      case 'extreme': return 'Крайний'
      default: return risk
    }
  }

  const filteredSuspects = suspects
    .filter(suspect => {
      const matchesSearch = suspect.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (suspect.aliases && suspect.aliases.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || suspect.status === statusFilter
      const matchesRisk = riskFilter === 'all' || suspect.risk_level === riskFilter
      
      return matchesSearch && matchesStatus && matchesRisk
    })
    .sort((a, b) => {
      // Сортировка от новых к старым (по дате создания)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  if (loading) {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-danger-500 to-danger-600 rounded-xl shadow-lg mr-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Подозреваемые</h1>
              <p className="text-police-300">Управление личными делами подозреваемых</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-2 bg-police-700 hover:bg-police-600 text-police-300 hover:text-white rounded-lg transition-colors"
            >
              <Search className="h-4 w-4" />
              Обновить
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-success-600 to-success-700 text-white rounded-xl hover:from-success-700 hover:to-success-800 transition-all shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Добавить подозреваемого
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="police-card rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Всего подозреваемых</p>
                <p className="text-3xl font-bold text-white">{suspects.length}</p>
              </div>
              <Users className="h-8 w-8 text-danger-400" />
            </div>
          </div>
          
          <div className="police-card rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Активных</p>
                <p className="text-3xl font-bold text-warning-400">
                  {suspects.filter(s => s.status === 'active').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning-400" />
            </div>
          </div>
          
          <div className="police-card rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Арестованных</p>
                <p className="text-3xl font-bold text-danger-400">
                  {suspects.filter(s => s.status === 'arrested').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-danger-400" />
            </div>
          </div>
          
          <div className="police-card rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-police-200 mb-1">Высокий риск</p>
                <p className="text-3xl font-bold text-purple-400">
                  {suspects.filter(s => s.risk_level === 'high' || s.risk_level === 'extreme').length}
                </p>
              </div>
              <Crown className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="police-card rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="h-5 w-5 text-police-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по имени или псевдониму..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="arrested">Арестованные</option>
              <option value="cleared">Оправданные</option>
              <option value="deceased">Умершие</option>
              <option value="unknown">Неизвестно</option>
            </select>
            
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
            >
              <option value="all">Все уровни риска</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="extreme">Крайний</option>
            </select>
          </div>
        </div>

        {/* Suspects List */}
        <div className="space-y-4">
          {filteredSuspects.length > 0 && (
            <div className="flex items-center justify-between text-sm text-police-400 px-2">
              <span>Найдено подозреваемых: {filteredSuspects.length}</span>
              <span>Сортировка: от новых к старым</span>
            </div>
          )}
          {filteredSuspects.length > 0 ? (
            filteredSuspects.map((suspect) => (
              <div key={suspect.id} className="police-card rounded-xl p-6 hover:bg-police-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-16 h-16 bg-police-800/50 rounded-xl border border-police-700/30 overflow-hidden">
                      {suspect.photo_url ? (
                        <img 
                          src={suspect.photo_url} 
                          alt={suspect.full_name}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            setSelectedSuspect(suspect)
                            setShowPhotoModal(true)
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <User className="h-8 w-8 text-police-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{suspect.full_name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(suspect.status)}`}>
                          {getStatusName(suspect.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskBadge(suspect.risk_level)}`}>
                          {getRiskName(suspect.risk_level)}
                        </span>
                        {(suspect as any).is_informant && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full border bg-success-500/20 text-success-400 border-success-500/30">
                            <UserCheck className="h-3 w-3 inline mr-1" />
                            Информатор
                          </span>
                        )}
                        {(suspect as any).gang_affiliation && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full border bg-danger-500/20 text-danger-400 border-danger-500/30">
                            <Crown className="h-3 w-3 inline mr-1" />
                            Банда
                          </span>
                        )}
                      </div>
                      
                      {suspect.aliases && (
                        <p className="text-sm text-police-300 mb-1">
                          Псевдонимы: {suspect.aliases}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-police-400">
                        {suspect.date_of_birth && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(suspect.date_of_birth).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                        {suspect.last_known_address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {suspect.last_known_address.substring(0, 50)}...
                          </span>
                        )}
                        {suspect.occupation && (
                          <span>{suspect.occupation}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewSuspect(suspect)}
                      className="flex items-center gap-2 px-3 py-2 bg-police-700 hover:bg-police-600 text-police-300 hover:text-white rounded-lg transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      Просмотр
                    </button>
                    <button
                      onClick={() => handleEditSuspect(suspect)}
                      className="flex items-center gap-2 px-3 py-2 bg-badge-600 hover:bg-badge-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Редактировать
                    </button>
                    {permissions.canEditProfiles && (
                      <button
                        onClick={() => handleDeleteSuspect(suspect)}
                        className="flex items-center gap-2 px-3 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="police-card rounded-xl p-12 text-center">
              <Users className="h-16 w-16 text-police-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Подозреваемые не найдены</h3>
              <p className="text-police-300 mb-6">
                {searchTerm || statusFilter !== 'all' || riskFilter !== 'all' 
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Начните с добавления первого подозреваемого'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && riskFilter === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-success-600 to-success-700 text-white rounded-xl hover:from-success-700 hover:to-success-800 transition-all"
                >
                  Добавить подозреваемого
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Suspect Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="police-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-police-900/95 backdrop-blur-sm px-6 py-4 border-b border-police-700/30 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Добавить подозреваемого</h3>
                <button 
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Photo Upload */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Фотография
                </h4>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-police-800/50 rounded-xl border border-police-600/30 overflow-hidden">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Предварительный просмотр"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <User className="h-16 w-16 text-police-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Загрузить фотографию
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-badge-600 file:text-white hover:file:bg-badge-700 focus:border-badge-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-police-400 mt-2">
                      Поддерживаемые форматы: JPG, PNG, GIF. Максимальный размер: 5MB
                    </p>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="mt-2 text-sm text-danger-400 hover:text-danger-300 transition-colors"
                      >
                        Удалить фотографию
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Личная информация
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Полное имя *
                    </label>
                    <input
                      type="text"
                      value={suspectForm.full_name}
                      onChange={(e) => setSuspectForm({...suspectForm, full_name: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Введите полное имя"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Псевдонимы / Клички
                    </label>
                    <input
                      type="text"
                      value={suspectForm.aliases}
                      onChange={(e) => setSuspectForm({...suspectForm, aliases: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Известные псевдонимы"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Дата рождения
                    </label>
                    <input
                      type="date"
                      value={suspectForm.date_of_birth}
                      onChange={(e) => setSuspectForm({...suspectForm, date_of_birth: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Место рождения
                    </label>
                    <input
                      type="text"
                      value={suspectForm.place_of_birth}
                      onChange={(e) => setSuspectForm({...suspectForm, place_of_birth: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Город, страна"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Национальность
                    </label>
                    <input
                      type="text"
                      value={suspectForm.nationality}
                      onChange={(e) => setSuspectForm({...suspectForm, nationality: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Национальность"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Пол
                    </label>
                    <select 
                      value={suspectForm.gender}
                      onChange={(e) => setSuspectForm({...suspectForm, gender: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="">Выберите пол</option>
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                      <option value="other">Другой</option>
                    </select>
                  </div>
                </div>
              </div>



              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Контактная информация
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Последний известный адрес
                    </label>
                    <textarea
                      value={suspectForm.last_known_address}
                      onChange={(e) => setSuspectForm({...suspectForm, last_known_address: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Полный адрес проживания"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Номера телефонов
                    </label>
                    <textarea
                      value={suspectForm.phone_numbers}
                      onChange={(e) => setSuspectForm({...suspectForm, phone_numbers: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Известные номера телефонов"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Email адреса
                    </label>
                    <input
                      type="text"
                      value={suspectForm.email_addresses}
                      onChange={(e) => setSuspectForm({...suspectForm, email_addresses: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Известные email адреса"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Профессия
                    </label>
                    <input
                      type="text"
                      value={suspectForm.occupation}
                      onChange={(e) => setSuspectForm({...suspectForm, occupation: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Место работы, должность"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Risk */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Статус и уровень риска
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Статус
                    </label>
                    <select 
                      value={suspectForm.status}
                      onChange={(e) => setSuspectForm({...suspectForm, status: e.target.value as any})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="active">Активен</option>
                      <option value="arrested">Арестован</option>
                      <option value="cleared">Оправдан</option>
                      <option value="deceased">Умер</option>
                      <option value="unknown">Неизвестно</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Уровень риска
                    </label>
                    <select 
                      value={suspectForm.risk_level}
                      onChange={(e) => setSuspectForm({...suspectForm, risk_level: e.target.value as any})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="extreme">Крайний</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Criminal History */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Криминальная история
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Судимости
                    </label>
                    <textarea
                      value={suspectForm.criminal_record}
                      onChange={(e) => setSuspectForm({...suspectForm, criminal_record: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Предыдущие судимости и приговоры"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Предыдущие аресты
                    </label>
                    <textarea
                      value={suspectForm.previous_arrests}
                      onChange={(e) => setSuspectForm({...suspectForm, previous_arrests: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="История арестов и задержаний"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Известные сообщники
                    </label>
                    <textarea
                      value={suspectForm.known_associates}
                      onChange={(e) => setSuspectForm({...suspectForm, known_associates: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Связи с другими преступниками"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle and Gang Information */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Транспорт и принадлежность
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Информация о транспорте
                    </label>
                    <div className="flex items-start gap-3">
                      <textarea
                        value={suspectForm.vehicle_info}
                        onChange={(e) => setSuspectForm({...suspectForm, vehicle_info: e.target.value})}
                        className="flex-1 px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                        placeholder="Марка, модель, цвет, номер автомобиля или другого транспорта"
                        rows={3}
                      />
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            // explicitly open vehicle modal in create context
                            setVehicleForm({ make: '', color: '', owner: '', plate: '' })
                            setVehicleEditingId(null)
                            setVehicleModalContext('create')
                            setShowVehicleModal(true)
                          }}
                          className="px-3 py-2 bg-gradient-to-r from-badge-500 to-badge-600 text-white rounded-xl hover:from-badge-600 hover:to-badge-700 transition-all"
                        >
                          Добавить ТС
                        </button>
                      </div>
                    </div>

                    {/* List vehicles: for create modal show draft list, for edit show suspectVehicles if available */}
                    <div className="mt-3 space-y-2">
                      {showCreateModal && createModeVehicles.length > 0 && createModeVehicles.map((v) => (
                        <div key={v.id} className="flex items-center justify-between bg-police-800/30 rounded-xl p-3">
                          <div>
                            <div className="text-sm text-police-300">{v.make} {v.color} {v.plate}</div>
                            <div className="text-xs text-police-400">Владелец: {v.owner}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setVehicleForm({ make: v.make || '', color: v.color || '', owner: v.owner || '', plate: v.plate || '' })
                                setVehicleEditingId(v.id)
                                setVehicleModalContext('create')
                                setShowVehicleModal(true)
                              }}
                              className="px-2 py-1 bg-police-700 text-police-200 rounded-md"
                            >
                              Ред.
                            </button>
                            <button
                              type="button"
                              onClick={() => setCreateModeVehicles(prev => prev.filter(x => x.id !== v.id))}
                              className="px-2 py-1 bg-danger-700 text-white rounded-md"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      ))}

                      {showEditModal && suspectVehicles.length > 0 && suspectVehicles.map((v) => (
                        <div key={v.id} className="flex items-center justify-between bg-police-800/30 rounded-xl p-3">
                          <div>
                            <div className="text-sm text-police-300">{v.make} {v.color} {v.plate}</div>
                            <div className="text-xs text-police-400">Владелец: {v.owner}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditVehicle(v)}
                              className="px-2 py-1 bg-police-700 text-police-200 rounded-md"
                            >
                              Ред.
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVehicle(v)}
                              className="px-2 py-1 bg-danger-700 text-white rounded-md"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Принадлежность к банде/группе
                    </label>
                    <textarea
                      value={suspectForm.gang_affiliation}
                      onChange={(e) => setSuspectForm({...suspectForm, gang_affiliation: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Название банды, группировки или преступной организации"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Special Status */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Особый статус
                </h4>
                <div className="flex items-center gap-3 p-4 bg-police-800/30 rounded-xl border border-police-700/30">
                  <input
                    type="checkbox"
                    id="is_informant"
                    checked={suspectForm.is_informant}
                    onChange={(e) => setSuspectForm({...suspectForm, is_informant: e.target.checked})}
                    className="w-5 h-5 text-badge-600 bg-police-800 border-police-600 rounded focus:ring-badge-500 focus:ring-2"
                  />
                  <label htmlFor="is_informant" className="text-white font-medium">
                    Информатор
                  </label>
                  <Info className="h-4 w-4 text-police-400" />
                  <span className="text-sm text-police-400">
                    Отметить как источник информации для правоохранительных органов
                  </span>
                </div>
              </div>

              {/* Connections */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Network className="h-5 w-5 mr-2" />
                  Связи с другими подозреваемыми
                </h4>
                
                {suspectForm.connections.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {suspectForm.connections.map((connection, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-police-800/30 rounded-xl border border-police-700/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{connection.suspect_name}</span>
                            <span className="px-2 py-1 text-xs bg-badge-600 text-white rounded-full">
                              {connection.relationship_type}
                            </span>
                          </div>
                          {connection.description && (
                            <p className="text-sm text-police-300">{connection.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeConnection(index)}
                          className="text-danger-400 hover:text-danger-300 transition-colors ml-3"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    loadAvailableSuspects()
                    setShowConnectionModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-police-700 hover:bg-police-600 text-police-300 hover:text-white rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Добавить связь
                </button>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Дополнительные заметки
                </label>
                <textarea
                  value={suspectForm.notes}
                  onChange={(e) => setSuspectForm({...suspectForm, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                  placeholder="Дополнительная информация, особенности поведения, предпочтения"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-police-900/95 backdrop-blur-sm px-6 py-4 border-t border-police-700/30 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleCreateSuspect}
                  disabled={creating || !suspectForm.full_name}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-success-600 to-success-700 text-white rounded-xl hover:from-success-700 hover:to-success-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Создание...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Создать профиль
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Suspect Modal */}
      {showEditModal && selectedSuspect && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="police-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-police-900/95 backdrop-blur-sm px-6 py-4 border-b border-police-700/30 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Редактировать профиль: {selectedSuspect.full_name}</h3>
                <button 
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedSuspect(null)
                    resetForm()
                  }}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Same form fields as create modal */}
            <div className="p-6 space-y-6">
              {/* Photo Upload */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Фотография
                </h4>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-police-800/50 rounded-xl border border-police-600/30 overflow-hidden">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Предварительный просмотр"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <User className="h-16 w-16 text-police-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Изменить фотографию
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-badge-600 file:text-white hover:file:bg-badge-700 focus:border-badge-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-police-400 mt-2">
                      Поддерживаемые форматы: JPG, PNG, GIF. Максимальный размер: 5MB
                    </p>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="mt-2 text-sm text-danger-400 hover:text-danger-300 transition-colors"
                      >
                        Удалить фотографию
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Личная информация
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Полное имя *
                    </label>
                    <input
                      type="text"
                      value={suspectForm.full_name}
                      onChange={(e) => setSuspectForm({...suspectForm, full_name: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Введите полное имя"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Псевдонимы / Клички
                    </label>
                    <input
                      type="text"
                      value={suspectForm.aliases}
                      onChange={(e) => setSuspectForm({...suspectForm, aliases: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Известные псевдонимы"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Дата рождения
                    </label>
                    <input
                      type="date"
                      value={suspectForm.date_of_birth}
                      onChange={(e) => setSuspectForm({...suspectForm, date_of_birth: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Статус
                    </label>
                    <select 
                      value={suspectForm.status}
                      onChange={(e) => setSuspectForm({...suspectForm, status: e.target.value as any})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="active">Активен</option>
                      <option value="arrested">Арестован</option>
                      <option value="cleared">Оправдан</option>
                      <option value="deceased">Умер</option>
                      <option value="unknown">Неизвестно</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Уровень риска
                    </label>
                    <select 
                      value={suspectForm.risk_level}
                      onChange={(e) => setSuspectForm({...suspectForm, risk_level: e.target.value as any})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="extreme">Крайний</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Последний известный адрес
                    </label>
                    <textarea
                      value={suspectForm.last_known_address}
                      onChange={(e) => setSuspectForm({...suspectForm, last_known_address: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Полный адрес проживания"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Контактная информация
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Номера телефонов
                    </label>
                    <textarea
                      value={suspectForm.phone_numbers}
                      onChange={(e) => setSuspectForm({...suspectForm, phone_numbers: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Известные номера телефонов"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Email адреса
                    </label>
                    <input
                      type="text"
                      value={suspectForm.email_addresses}
                      onChange={(e) => setSuspectForm({...suspectForm, email_addresses: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Известные email адреса"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Профессия
                    </label>
                    <input
                      type="text"
                      value={suspectForm.occupation}
                      onChange={(e) => setSuspectForm({...suspectForm, occupation: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Место работы, должность"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle and Gang Information */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Транспорт и принадлежность
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Информация о транспорте
                    </label>
                    <div className="flex items-start gap-3">
                      <textarea
                        value={suspectForm.vehicle_info}
                        onChange={(e) => setSuspectForm({...suspectForm, vehicle_info: e.target.value})}
                        className="flex-1 px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                        placeholder="Марка, модель, цвет, номер автомобиля или другого транспорта"
                        rows={3}
                      />
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setVehicleForm({ make: '', color: '', owner: '', plate: '' })
                            setVehicleEditingId(null)
                            setVehicleModalContext('edit')
                            setShowVehicleModal(true)
                          }}
                          className="px-3 py-2 bg-gradient-to-r from-badge-500 to-badge-600 text-white rounded-xl hover:from-badge-600 hover:to-badge-700 transition-all"
                        >
                          Добавить ТС
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Принадлежность к банде/группе
                    </label>
                    <textarea
                      value={suspectForm.gang_affiliation}
                      onChange={(e) => setSuspectForm({...suspectForm, gang_affiliation: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Название банды, группировки или преступной организации"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Special Status */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Особый статус
                </h4>
                <div className="flex items-center gap-3 p-4 bg-police-800/30 rounded-xl border border-police-700/30">
                  <input
                    type="checkbox"
                    id="edit_is_informant"
                    checked={suspectForm.is_informant}
                    onChange={(e) => setSuspectForm({...suspectForm, is_informant: e.target.checked})}
                    className="w-5 h-5 text-badge-600 bg-police-800 border-police-600 rounded focus:ring-badge-500 focus:ring-2"
                  />
                  <label htmlFor="edit_is_informant" className="text-white font-medium">
                    Информатор
                  </label>
                  <Info className="h-4 w-4 text-police-400" />
                  <span className="text-sm text-police-400">
                    Отметить как источник информации для правоохранительных органов
                  </span>
                </div>
              </div>

              {/* Connections */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Network className="h-5 w-5 mr-2" />
                  Связи с другими подозреваемыми
                </h4>
                
                {suspectForm.connections.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {suspectForm.connections.map((connection, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-police-800/30 rounded-xl border border-police-700/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{connection.suspect_name}</span>
                            <span className="px-2 py-1 text-xs bg-badge-600 text-white rounded-full">
                              {connection.relationship_type}
                            </span>
                          </div>
                          {connection.description && (
                            <p className="text-sm text-police-300">{connection.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            type="button"
                            onClick={() => editConnection(index)}
                            className="text-badge-400 hover:text-badge-300 transition-colors"
                            title="Редактировать связь"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeConnection(index)}
                            className="text-danger-400 hover:text-danger-300 transition-colors"
                            title="Удалить связь"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setEditingConnectionIndex(null)
                    setConnectionForm({
                      suspect_id: 0,
                      suspect_name: '',
                      relationship_type: '',
                      description: ''
                    })
                    loadAvailableSuspects()
                    setShowConnectionModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-police-700 hover:bg-police-600 text-police-300 hover:text-white rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Добавить связь
                </button>
              </div>

              {/* Criminal History */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Криминальная история
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Судимости
                    </label>
                    <textarea
                      value={suspectForm.criminal_record}
                      onChange={(e) => setSuspectForm({...suspectForm, criminal_record: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Предыдущие судимости и приговоры"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Предыдущие аресты
                    </label>
                    <textarea
                      value={suspectForm.previous_arrests}
                      onChange={(e) => setSuspectForm({...suspectForm, previous_arrests: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="История арестов и задержаний"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-police-300 mb-2">
                      Известные сообщники
                    </label>
                    <textarea
                      value={suspectForm.known_associates}
                      onChange={(e) => setSuspectForm({...suspectForm, known_associates: e.target.value})}
                      className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                      placeholder="Связи с другими преступниками"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Дополнительные заметки
                </label>
                <textarea
                  value={suspectForm.notes}
                  onChange={(e) => setSuspectForm({...suspectForm, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                  placeholder="Дополнительная информация, особенности поведения, предпочтения"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-police-900/95 backdrop-blur-sm px-6 py-4 border-t border-police-700/30 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedSuspect(null)
                    resetForm()
                  }}
                  disabled={updating}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleUpdateSuspect}
                  disabled={updating || !suspectForm.full_name}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-badge-600 to-badge-700 text-white rounded-xl hover:from-badge-700 hover:to-badge-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Сохранить изменения
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Suspect Modal */}
      {showViewModal && selectedSuspect && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="police-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-police-900/95 backdrop-blur-sm px-6 py-4 border-b border-police-700/30 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{selectedSuspect.full_name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(selectedSuspect.status)}`}>
                    {getStatusName(selectedSuspect.status)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskBadge(selectedSuspect.risk_level)}`}>
                    {getRiskName(selectedSuspect.risk_level)}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedSuspect(null)
                  }}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Личная информация
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSuspect.aliases && (
                    <div className="p-4 bg-police-800/30 rounded-xl">
                      <label className="block text-sm font-medium text-police-400 mb-1">Псевдонимы</label>
                      <p className="text-white">{selectedSuspect.aliases}</p>
                    </div>
                  )}
                  
                  {selectedSuspect.date_of_birth && (
                    <div className="p-4 bg-police-800/30 rounded-xl">
                      <label className="block text-sm font-medium text-police-400 mb-1">Дата рождения</label>
                      <p className="text-white">{new Date(selectedSuspect.date_of_birth).toLocaleDateString('ru-RU')}</p>
                    </div>
                  )}
                  
                  {selectedSuspect.place_of_birth && (
                    <div className="p-4 bg-police-800/30 rounded-xl">
                      <label className="block text-sm font-medium text-police-400 mb-1">Место рождения</label>
                      <p className="text-white">{selectedSuspect.place_of_birth}</p>
                    </div>
                  )}
                  
                  {selectedSuspect.nationality && (
                    <div className="p-4 bg-police-800/30 rounded-xl">
                      <label className="block text-sm font-medium text-police-400 mb-1">Национальность</label>
                      <p className="text-white">{selectedSuspect.nationality}</p>
                    </div>
                  )}
                  
                  {selectedSuspect.occupation && (
                    <div className="p-4 bg-police-800/30 rounded-xl">
                      <label className="block text-sm font-medium text-police-400 mb-1">Профессия</label>
                      <p className="text-white">{selectedSuspect.occupation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Фотография
                  {selectedSuspect.photo_url && (
                    <span className="ml-2 text-xs text-police-400">(нажмите для увеличения)</span>
                  )}
                </h4>
                <div className="flex justify-center">
                  <div className="w-64 h-64 bg-police-800/30 rounded-xl border border-police-700/30 overflow-hidden">
                    {selectedSuspect.photo_url ? (
                      <img 
                        src={selectedSuspect.photo_url} 
                        alt={selectedSuspect.full_name}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setShowPhotoModal(true)}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <User className="h-32 w-32 text-police-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {(selectedSuspect.last_known_address || selectedSuspect.phone_numbers || selectedSuspect.email_addresses) && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Контактная информация
                  </h4>
                  <div className="space-y-4">
                    {selectedSuspect.last_known_address && (
                      <div className="p-4 bg-police-800/30 rounded-xl">
                        <label className="block text-sm font-medium text-police-400 mb-2">Последний известный адрес</label>
                        <p className="text-white">{selectedSuspect.last_known_address}</p>
                      </div>
                    )}
                    
                    {selectedSuspect.phone_numbers && (
                      <div className="p-4 bg-police-800/30 rounded-xl">
                        <label className="block text-sm font-medium text-police-400 mb-2">Номера телефонов</label>
                        <p className="text-white">{selectedSuspect.phone_numbers}</p>
                      </div>
                    )}
                    
                    {selectedSuspect.email_addresses && (
                      <div className="p-4 bg-police-800/30 rounded-xl">
                        <label className="block text-sm font-medium text-police-400 mb-2">Email адреса</label>
                        <p className="text-white">{selectedSuspect.email_addresses}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Criminal History */}
              {(selectedSuspect.criminal_record || selectedSuspect.previous_arrests || selectedSuspect.known_associates) && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Криминальная история
                  </h4>
                  <div className="space-y-4">
                    {selectedSuspect.criminal_record && (
                      <div className="p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl">
                        <label className="block text-sm font-medium text-danger-400 mb-2">Судимости</label>
                        <p className="text-white">{selectedSuspect.criminal_record}</p>
                      </div>
                    )}
                    
                    {selectedSuspect.previous_arrests && (
                      <div className="p-4 bg-warning-500/10 border border-warning-500/30 rounded-xl">
                        <label className="block text-sm font-medium text-warning-400 mb-2">Предыдущие аресты</label>
                        <p className="text-white">{selectedSuspect.previous_arrests}</p>
                      </div>
                    )}
                    
                    {selectedSuspect.known_associates && (
                      <div className="p-4 bg-police-800/30 rounded-xl">
                        <label className="block text-sm font-medium text-police-400 mb-2">Известные сообщники</label>
                        <p className="text-white">{selectedSuspect.known_associates}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle and Gang Information */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white mb-0 flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Транспорт и принадлежность
                  </h4>
                  <div>
                    <button
                      onClick={() => {
                        // when in view modal, opening a new vehicle should attach to the selected suspect
                        setVehicleForm({ make: '', color: '', owner: '', plate: '' })
                        setVehicleEditingId(null)
                        setVehicleModalContext('edit')
                        setShowVehicleModal(true)
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-badge-500 to-badge-600 text-white rounded-xl hover:from-badge-600 hover:to-badge-700 transition-all"
                    >
                      Добавить ТС
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Vehicles list (structured) */}
                  {suspectVehicles && suspectVehicles.length > 0 ? (
                    suspectVehicles.map((v: any) => (
                      <div key={v.id} className="p-4 bg-police-800/30 rounded-xl border border-police-700/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">{v.make || '—'} {v.color ? `(${v.color})` : ''}</div>
                            <div className="text-sm text-police-400">Номера: {v.plate || '—'}</div>
                            <div className="text-sm text-police-400">Владелец: {v.owner || '—'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditVehicle(v)} className="px-2 py-1 bg-police-700 text-police-300 rounded-md hover:bg-police-600">Изменить</button>
                            <button onClick={() => handleDeleteVehicle(v)} className="px-2 py-1 bg-danger-700 text-white rounded-md hover:bg-danger-600">Удалить</button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    ((selectedSuspect as any).vehicle_info) ? (
                      <div className="p-4 bg-police-800/30 rounded-xl">
                        <label className="block text-sm font-medium text-police-400 mb-2">Транспорт (старый формат)</label>
                        <p className="text-white">{(selectedSuspect as any).vehicle_info}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-police-800/10 rounded-xl text-police-400">ТС не указаны</div>
                    )
                  )}

                  {(selectedSuspect as any).gang_affiliation && (
                    <div className="p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl">
                      <label className="block text-sm font-medium text-danger-400 mb-2">Принадлежность к банде/группе</label>
                      <p className="text-white">{(selectedSuspect as any).gang_affiliation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle mini-form modal moved to global scope so it works in create/edit/view contexts */}

              {/* Special Status */}
              {(selectedSuspect as any).is_informant && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2" />
                    Особый статус
                  </h4>
                  <div className="p-4 bg-success-500/10 border border-success-500/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-success-400" />
                      <span className="text-success-400 font-medium">Информатор</span>
                    </div>
                    <p className="text-sm text-success-300 mt-2">
                      Данное лицо является источником информации для правоохранительных органов
                    </p>
                  </div>
                </div>
              )}

              {/* Connections */}
              {(selectedSuspect as any).connections && (selectedSuspect as any).connections.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Network className="h-5 w-5 mr-2" />
                    Связи с другими подозреваемыми
                  </h4>
                  <div className="space-y-3">
                    {(selectedSuspect as any).connections.map((connection: any, index: number) => (
                      <div key={index} className="p-4 bg-police-800/30 rounded-xl border border-police-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white">{connection.suspect_name}</span>
                          <span className="px-2 py-1 text-xs bg-badge-600 text-white rounded-full">
                            {connection.relationship_type}
                          </span>
                        </div>
                        {connection.description && (
                          <p className="text-sm text-police-300">{connection.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Cases */}
              {selectedSuspect && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Связанные дела
                    <span className="text-sm text-police-400 ml-2">
                      ({(suspectCases[selectedSuspect.id] || []).length})
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {(suspectCases[selectedSuspect.id] || []).length > 0 ? (
                      (suspectCases[selectedSuspect.id] || []).map((relatedCase: any) => (
                        <div key={relatedCase.id} className="p-4 bg-police-800/30 rounded-xl border border-police-700/30 hover:border-police-600/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{relatedCase.case_number}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                              relatedCase.status === 'active' ? 'bg-warning-500/20 text-warning-400 border-warning-500/30' :
                              relatedCase.status === 'closed' ? 'bg-success-500/20 text-success-400 border-success-500/30' :
                              'bg-police-500/20 text-police-400 border-police-500/30'
                            }`}>
                              {relatedCase.status === 'active' ? 'Активно' :
                               relatedCase.status === 'closed' ? 'Закрыто' : 'Архив'}
                            </span>
                          </div>
                          <p className="text-sm text-white mb-1">{relatedCase.title}</p>
                          <p className="text-xs text-police-400">
                            Создано: {new Date(relatedCase.created_at).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-police-800/30 rounded-xl border border-police-700/30 text-center">
                        <p className="text-police-400">Подозреваемый не связан ни с одним делом</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedSuspect.notes && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Дополнительные заметки</h4>
                  <div className="p-4 bg-police-800/30 rounded-xl">
                    <p className="text-white">{selectedSuspect.notes}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Информация о записи</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-police-800/30 rounded-xl">
                    <label className="block text-sm font-medium text-police-400 mb-1">Создано</label>
                    <p className="text-white">{new Date(selectedSuspect.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                  
                  <div className="p-4 bg-police-800/30 rounded-xl">
                    <label className="block text-sm font-medium text-police-400 mb-1">Обновлено</label>
                    <p className="text-white">{new Date(selectedSuspect.updated_at).toLocaleString('ru-RU')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-police-900/95 backdrop-blur-sm px-6 py-4 border-t border-police-700/30 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedSuspect(null)
                  }}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
                >
                  Закрыть
                </button>
                <button 
                  onClick={() => {
                    setShowViewModal(false)
                    handleEditSuspect(selectedSuspect)
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-badge-600 to-badge-700 text-white rounded-xl hover:from-badge-700 hover:to-badge-800 transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="police-card rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-police-700/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Network className="h-6 w-6 mr-2" />
                  {editingConnectionIndex !== null ? 'Редактировать связь' : 'Добавить связь'}
                </h3>
                <button 
                  onClick={() => {
                    setShowConnectionModal(false)
                    setConnectionForm({
                      suspect_id: 0,
                      suspect_name: '',
                      relationship_type: '',
                      description: ''
                    })
                  }}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Выберите подозреваемого *
                </label>
                <select
                  value={connectionForm.suspect_id}
                  onChange={(e) => setConnectionForm({...connectionForm, suspect_id: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={editingConnectionIndex !== null}
                >
                  <option value={0}>Выберите подозреваемого</option>
                  {availableSuspects.map(suspect => (
                    <option key={suspect.id} value={suspect.id}>
                      {suspect.full_name} {suspect.aliases && `(${suspect.aliases})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Тип связи *
                </label>
                <select
                  value={connectionForm.relationship_type}
                  onChange={(e) => setConnectionForm({...connectionForm, relationship_type: e.target.value})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white focus:border-badge-500 focus:outline-none transition-colors"
                  required
                >
                  <option value="">Выберите тип связи</option>
                  <option value="Сообщник">Сообщник</option>
                  <option value="Родственник">Родственник</option>
                  <option value="Друг">Друг</option>
                  <option value="Коллега">Коллега</option>
                  <option value="Враг">Враг</option>
                  <option value="Конкурент">Конкурент</option>
                  <option value="Подчиненный">Подчиненный</option>
                  <option value="Руководитель">Руководитель</option>
                  <option value="Свидетель">Свидетель</option>
                  <option value="Жертва">Жертва</option>
                  <option value="Другое">Другое</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-police-300 mb-2">
                  Описание связи
                </label>
                <textarea
                  value={connectionForm.description}
                  onChange={(e) => setConnectionForm({...connectionForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-police-800/50 border border-police-600/30 rounded-xl text-white placeholder-police-400 focus:border-badge-500 focus:outline-none transition-colors"
                  placeholder="Дополнительная информация о характере связи"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-police-700/30">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConnectionModal(false)
                    setEditingConnectionIndex(null)
                    setConnectionForm({
                      suspect_id: 0,
                      suspect_name: '',
                      relationship_type: '',
                      description: ''
                    })
                  }}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors"
                >
                  Отмена
                </button>
                <button 
                  onClick={addConnection}
                  disabled={editingConnectionIndex !== null ? !connectionForm.relationship_type : (!connectionForm.suspect_id || !connectionForm.relationship_type)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-badge-600 to-badge-700 text-white rounded-xl hover:from-badge-700 hover:to-badge-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editingConnectionIndex !== null ? (
                    <>
                      <Edit className="h-4 w-4" />
                      Сохранить изменения
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Добавить связь
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSuspect && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="police-card rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-police-700/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <AlertTriangle className="h-6 w-6 text-danger-400 mr-2" />
                  Подтвердите удаление
                </h3>
                <button 
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedSuspect(null)
                  }}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                {selectedSuspect.photo_url ? (
                  <img 
                    src={selectedSuspect.photo_url} 
                    alt={selectedSuspect.full_name}
                    className="w-16 h-16 object-cover rounded-xl border border-police-700/30"
                  />
                ) : (
                  <div className="w-16 h-16 bg-police-800/50 rounded-xl border border-police-700/30 flex items-center justify-center">
                    <User className="h-8 w-8 text-police-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">{selectedSuspect.full_name}</h4>
                  {selectedSuspect.aliases && (
                    <p className="text-sm text-police-300 mb-2">Псевдонимы: {selectedSuspect.aliases}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(selectedSuspect.status)}`}>
                      {getStatusName(selectedSuspect.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskBadge(selectedSuspect.risk_level)}`}>
                      {getRiskName(selectedSuspect.risk_level)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-danger-500/10 border border-danger-500/30 rounded-xl p-4 mb-6">
                <p className="text-danger-400 text-sm font-medium mb-2">⚠️ Внимание!</p>
                <p className="text-white text-sm">
                  Вы собираетесь удалить личное дело подозреваемого <strong>{selectedSuspect.full_name}</strong>. 
                  Это действие нельзя отменить.
                </p>
                <p className="text-police-300 text-xs mt-2">
                  Все связанные данные, включая фотографии и заметки, будут удалены безвозвратно.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-police-700/30">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedSuspect(null)
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-police-700 text-police-300 rounded-xl hover:bg-police-600 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button 
                  onClick={confirmDeleteSuspect}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-danger-600 to-danger-700 text-white rounded-xl hover:from-danger-700 hover:to-danger-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Удаление...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Удалить навсегда
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedSuspect?.photo_url && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button 
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-4 right-4 z-10 text-white hover:text-police-300 transition-colors bg-black/50 rounded-full p-2 hover:bg-black/70"
            >
              <X className="h-6 w-6" />
            </button>
            
            <img 
              src={selectedSuspect.photo_url} 
              alt={selectedSuspect.full_name}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-medium">{selectedSuspect.full_name}</p>
              <p className="text-xs text-gray-300">Нажмите вне изображения для закрытия</p>
            </div>
          </div>
        </div>
      )}
      {/* Vehicle mini-form modal (global) */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 pointer-events-auto">
          <div className="police-card rounded-2xl w-full max-w-md shadow-2xl p-6 relative z-[10000]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">{vehicleEditingId ? 'Изменить транспорт' : 'Добавить транспорт'}</h4>
              <button onClick={() => { setShowVehicleModal(false); setVehicleEditingId(null) }} className="text-police-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-police-400 mb-1">Марка</label>
                <input value={vehicleForm.make} onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-police-800/30 text-white" />
              </div>
              <div>
                <label className="block text-sm text-police-400 mb-1">Цвет</label>
                <input value={vehicleForm.color} onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-police-800/30 text-white" />
              </div>
              <div>
                <label className="block text-sm text-police-400 mb-1">Владелец</label>
                <input value={vehicleForm.owner} onChange={(e) => setVehicleForm({...vehicleForm, owner: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-police-800/30 text-white" />
              </div>
              <div>
                <label className="block text-sm text-police-400 mb-1">Номера</label>
                <input value={vehicleForm.plate} onChange={(e) => setVehicleForm({...vehicleForm, plate: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-police-800/30 text-white" />
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => { setShowVehicleModal(false); setVehicleEditingId(null) }} className="flex-1 px-4 py-2 bg-police-700 text-police-300 rounded-xl">Отмена</button>
                <button onClick={handleCreateVehicle} className="flex-1 px-4 py-2 bg-gradient-to-r from-success-600 to-success-700 text-white rounded-xl">
                  {vehicleCreating ? 'Сохранение...' : (vehicleEditingId ? 'Сохранить' : 'Добавить')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}