'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, FileText, BarChart3, User, Brain, Settings, Bell, LucideIcon, X, Clock, AlertTriangle, CheckCircle, Info, Users } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'

interface LayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Дела', href: '/cases', icon: FileText },
  { name: 'Подозреваемые', href: '/suspects', icon: Users },
  { name: 'Профиль', href: '/profile', icon: User },
  { name: 'AI Анализ', href: '/ai', icon: Brain, badge: 'Демо' },
  { name: 'Администрирование', href: '/admin', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications()

  const getNotificationIcon = (type: 'info' | 'warning' | 'success' | 'error') => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-success-400" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-badge-400" />
      case 'error': return <AlertTriangle className="h-5 w-5 text-danger-400" />
      default: return <Info className="h-5 w-5 text-police-400" />
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Только что'
    if (diffInHours === 1) return '1 час назад'
    if (diffInHours < 24) return `${diffInHours} часов назад`
    return time.toLocaleDateString('ru-RU')
  }

  return (
    <div className="min-h-screen police-dark">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 police-sidebar shadow-2xl">
        {/* Logo */}
        <div className="flex items-center px-6 py-6 border-b border-police-700/30">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-badge-500 to-badge-600 rounded-xl mr-3 shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Detective Nexus
            </h1>
            <p className="text-xs text-police-300">AI-Powered System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 animate-fade-in
                    ${isActive 
                      ? 'bg-gradient-to-r from-badge-500 to-badge-600 text-white shadow-lg transform scale-105' 
                      : 'text-police-300 hover:bg-police-800/50 hover:text-white hover:shadow-md'
                    }
                  `}
                >
                  <item.icon className={`
                    mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
                    ${isActive ? 'text-white' : 'text-police-400 group-hover:text-badge-400'}
                  `} />
                  <span className="flex items-center gap-2 flex-1">
                    {item.name}
                    {item.badge && (
                      <span className="bg-purple-500/20 text-purple-400 text-xs px-1.5 py-0.5 rounded border border-purple-500/30">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-police-700/30">
          <div className="flex items-center p-3 bg-police-800/50 rounded-xl border border-police-700/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-br from-badge-500 to-badge-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">TD</span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-white">Test Detective</p>
              <p className="text-xs text-police-300">Детектив • Онлайн</p>
            </div>
            <div className="w-3 h-3 bg-success-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="police-card shadow-lg border-b border-police-700/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {navigation.find(item => item.href === pathname)?.name || 'Detective Nexus'}
              </h2>
              <p className="text-sm text-police-300 mt-1">
                {new Date().toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-3 text-police-400 hover:text-white hover:bg-police-800/50 rounded-xl transition-all duration-200"
                >
                  <Bell className="h-5 w-5" />
                </button>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs text-white font-bold">{unreadCount}</span>
                  </div>
                )}
              </div>
              <div className="h-8 w-px bg-police-700"></div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">Смена #47</p>
                <p className="text-xs text-success-400">Активна</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowNotifications(false)}
          />
          
          {/* Notifications Dropdown */}
          <div className="fixed top-20 right-6 w-96 max-h-[80vh] bg-police-900 border border-police-700/30 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-police-700/30 bg-police-800/50">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-police-300" />
                <h3 className="text-lg font-semibold text-white">Уведомления</h3>
                {unreadCount > 0 && (
                  <span className="bg-danger-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-police-400 hover:text-white transition-colors"
                  >
                    Прочитать все
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-police-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-police-700/20 hover:bg-police-800/30 transition-colors ${
                      !notification.read ? 'bg-police-800/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-white' : 'text-police-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-badge-500 rounded-full"></div>
                            )}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="text-police-500 hover:text-police-300 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-police-400 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-xs text-police-500">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(notification.timestamp)}
                          </div>
                          
                          {notification.action && (
                            <div className="flex gap-2">
                              {notification.action.href ? (
                                <Link
                                  href={notification.action.href}
                                  onClick={() => {
                                    markAsRead(notification.id)
                                    setShowNotifications(false)
                                  }}
                                  className="text-xs bg-badge-500/20 text-badge-400 px-3 py-1 rounded-full hover:bg-badge-500/30 transition-colors border border-badge-500/30"
                                >
                                  {notification.action.label}
                                </Link>
                              ) : (
                                <button
                                  onClick={() => {
                                    notification.action?.onClick?.()
                                    markAsRead(notification.id)
                                  }}
                                  className="text-xs bg-badge-500/20 text-badge-400 px-3 py-1 rounded-full hover:bg-badge-500/30 transition-colors border border-badge-500/30"
                                >
                                  {notification.action.label}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-police-500 mx-auto mb-3" />
                  <p className="text-police-400 text-sm">Нет уведомлений</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-police-700/30 bg-police-800/30">
                <button
                  onClick={() => {
                    clearAll()
                    setShowNotifications(false)
                  }}
                  className="w-full text-xs text-police-400 hover:text-white transition-colors"
                >
                  Очистить все уведомления
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}