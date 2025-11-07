import { User, RolePermissions, ROLE_HIERARCHY, UserRank } from '@/types'

/**
 * Получить права доступа для пользователя на основе его звания
 */
export function getUserPermissions(user: User | null): RolePermissions {
  if (!user) {
    return {
      canCreateReports: false,
      canEditProfiles: false,
      canViewReports: false,
      canManageDetectives: false,
      canAccessAdmin: false
    }
  }

  const rankLevel = ROLE_HIERARCHY[user.rank as UserRank] || 0

  return {
    // Создание отчетов доступно старшим детективам и выше
    canCreateReports: rankLevel >= ROLE_HIERARCHY.senior_detective,
    
    // Редактирование профилей доступно старшим детективам и выше
    canEditProfiles: rankLevel >= ROLE_HIERARCHY.senior_detective,
    
    // Просмотр отчетов доступен старшим детективам и выше
    canViewReports: rankLevel >= ROLE_HIERARCHY.senior_detective,
    
    // Управление детективами доступно лейтенантам и выше
    canManageDetectives: rankLevel >= ROLE_HIERARCHY.lieutenant,
    
    // Доступ к админ панели только для капитанов и выше
    canAccessAdmin: rankLevel >= ROLE_HIERARCHY.captain
  }
}

/**
 * Проверить, имеет ли пользователь определенное право
 */
export function hasPermission(user: User | null, permission: keyof RolePermissions): boolean {
  const permissions = getUserPermissions(user)
  return permissions[permission]
}

/**
 * Проверить, является ли пользователь старшим детективом или выше
 */
export function isSeniorOrHigher(user: User | null): boolean {
  if (!user) return false
  const rankLevel = ROLE_HIERARCHY[user.rank as UserRank] || 0
  return rankLevel >= ROLE_HIERARCHY.senior_detective
}

/**
 * Проверить, является ли пользователь руководителем (лейтенант и выше)
 */
export function isLeadershipRole(user: User | null): boolean {
  if (!user) return false
  const rankLevel = ROLE_HIERARCHY[user.rank as UserRank] || 0
  return rankLevel >= ROLE_HIERARCHY.lieutenant
}

/**
 * Получить отображаемое название звания
 */
export function getRankDisplayName(rank: string): string {
  const rankNames: Record<string, string> = {
    'detective': 'Детектив',
    'senior_detective': 'Старший детектив',
    'lieutenant': 'Лейтенант',
    'captain': 'Капитан',
    'major': 'Майор',
    'admin': 'Администратор'
  }
  
  return rankNames[rank] || rank
}

/**
 * Получить список доступных званий для назначения
 */
export function getAvailableRanks(currentUserRank: string): Array<{value: string, label: string}> {
  const currentLevel = ROLE_HIERARCHY[currentUserRank as UserRank] || 0
  
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level < currentLevel) // Можно назначать только звания ниже своего
    .map(([rank, _]) => ({
      value: rank,
      label: getRankDisplayName(rank)
    }))
}