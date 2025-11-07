'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface Notification {
  id: number
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  removeNotification: (id: number) => void
  clearAll: () => void
  clearAllNotifications: () => void
  unreadCount: number
  addDemoNotification: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'warning',
      title: 'Дело требует внимания',
      message: 'Дело HN-2025-0001 не обновлялось более 3 дней',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      action: {
        label: 'Открыть дело',
        href: '/cases'
      }
    },
    {
      id: 2,
      type: 'success',
      title: 'AI анализ завершен',
      message: 'Найдены 2 похожих дела для HN-2025-0002',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      read: false,
      action: {
        label: 'Посмотреть результаты',
        href: '/ai'
      }
    },
    {
      id: 3,
      type: 'info',
      title: 'Новый детектив добавлен',
      message: 'Детектив Johnson присоединился к отделу',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      read: true
    }
  ])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Проверяем, есть ли уже такое же уведомление в последние 5 секунд
    const now = Date.now()
    const recentDuplicate = notifications.find(n => 
      n.title === notification.title && 
      n.message === notification.message &&
      (now - new Date(n.timestamp).getTime()) < 5000 // 5 секунд
    )
    
    if (recentDuplicate) {
      console.log('Duplicate notification blocked:', notification.title)
      return
    }

    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Demo function to simulate real-time notifications
  const addDemoNotification = () => {
    const demoNotifications = [
      {
        type: 'warning' as const,
        title: 'Срок дела истекает',
        message: 'Дело HN-2025-0003 должно быть обновлено в течение 24 часов',
        action: { label: 'Открыть дело', href: '/cases' }
      },
      {
        type: 'info' as const,
        title: 'Новые улики добавлены',
        message: 'К делу HN-2025-0001 добавлены фотографии с места происшествия',
        action: { label: 'Посмотреть улики', href: '/cases' }
      },
      {
        type: 'success' as const,
        title: 'Дело закрыто',
        message: 'Дело HN-2025-0004 успешно закрыто детективом Smith',
        action: { label: 'Посмотреть отчет', href: '/cases' }
      },
      {
        type: 'error' as const,
        title: 'Ошибка синхронизации',
        message: 'Не удалось синхронизировать данные с центральной базой',
        action: { label: 'Повторить попытку', onClick: () => alert('Синхронизация...') }
      }
    ]
    
    const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)]
    addNotification(randomNotification)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      clearAllNotifications,
      unreadCount,
      addDemoNotification
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}