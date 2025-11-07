'use client'

import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getUserPermissions, getRankDisplayName } from '@/lib/permissions'
import { ROLE_HIERARCHY } from '@/types'

export default function DebugUserInfo() {
  const { user, loading, error } = useCurrentUser()
  const permissions = getUserPermissions(user)

  if (loading) return <div className="text-police-400">Загрузка пользователя...</div>

  return (
    <div className="bg-police-800/30 border border-police-600/30 rounded-xl p-4 text-xs">
      <h4 className="text-white font-medium mb-3">🔍 Отладочная информация</h4>
      
      {error && (
        <div className="text-danger-400 mb-2">Ошибка: {error}</div>
      )}
      
      {user ? (
        <div className="space-y-2">
          <div className="text-police-300">
            <strong>Пользователь:</strong> {user.full_name} ({user.username})
          </div>
          <div className="text-police-300">
            <strong>Звание (raw):</strong> "{user.rank}"
          </div>
          <div className="text-police-300">
            <strong>Звание (display):</strong> {getRankDisplayName(user.rank)}
          </div>
          <div className="text-police-300">
            <strong>Уровень в иерархии:</strong> {ROLE_HIERARCHY[user.rank] || 'НЕ НАЙДЕН'}
          </div>
          
          <div className="border-t border-police-600/30 pt-2 mt-2">
            <div className="text-police-200 font-medium mb-1">Права доступа:</div>
            <div className="grid grid-cols-1 gap-1">
              <div className={permissions.canCreateReports ? 'text-success-400' : 'text-danger-400'}>
                • Создание отчетов: {permissions.canCreateReports ? '✓' : '✗'}
              </div>
              <div className={permissions.canEditProfiles ? 'text-success-400' : 'text-danger-400'}>
                • Редактирование профилей: {permissions.canEditProfiles ? '✓' : '✗'}
              </div>
              <div className={permissions.canViewReports ? 'text-success-400' : 'text-danger-400'}>
                • Просмотр отчетов: {permissions.canViewReports ? '✓' : '✗'}
              </div>
              <div className={permissions.canManageDetectives ? 'text-success-400' : 'text-danger-400'}>
                • Управление детективами: {permissions.canManageDetectives ? '✓' : '✗'}
              </div>
              <div className={permissions.canAccessAdmin ? 'text-success-400' : 'text-danger-400'}>
                • Админ панель: {permissions.canAccessAdmin ? '✓' : '✗'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-danger-400">Пользователь не загружен</div>
      )}
    </div>
  )
}