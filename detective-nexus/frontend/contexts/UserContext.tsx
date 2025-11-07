'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'
import { api } from '@/lib/api'

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
  refreshUser: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Защита от повторных запросов

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    // Защита от повторных запросов
    if (isLoading) {
      console.log('User loading already in progress, skipping...')
      return
    }

    try {
      setIsLoading(true)
      setLoading(true)
      setError(null)
      
      // В демо режиме используем первого пользователя
      // В реальном приложении здесь был бы запрос к /api/auth/me или аналогичному эндпоинту
      const userData = await api.getUser(1)
      
      // Преобразуем данные в формат User
      const data = userData as any
      const currentUser: User = {
        id: data.id,
        discord_id: data.discord_id || '',
        username: data.username,
        full_name: data.full_name,
        rank: data.rank as User['rank'],
        department: data.department,
        badge_number: data.badge_number,
        hire_date: data.hire_date,
        is_active: data.is_active ?? true,
        avatar_url: data.avatar_url,
        created_at: data.created_at || new Date().toISOString()
      }
      
      setUser(currentUser)
    } catch (err) {
      console.error('Failed to load current user:', err)
      setError('Не удалось загрузить данные пользователя')
      
      // Fallback для демо - создаем пользователя со старшим званием
      setUser({
        id: 1,
        discord_id: 'demo_user',
        username: 'demo_detective',
        full_name: 'Демо Детектив',
        rank: 'senior_detective', // Старший детектив для демонстрации прав
        department: 'Отдел по расследованию убийств',
        badge_number: '12345',
        hire_date: '2023-01-01',
        is_active: true,
        created_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
      setIsLoading(false)
    }
  }

  const refreshUser = () => {
    loadCurrentUser()
  }

  return (
    <UserContext.Provider value={{
      user,
      loading,
      error,
      refreshUser
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}