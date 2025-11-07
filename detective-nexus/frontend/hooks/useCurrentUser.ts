import { useUser } from '@/contexts/UserContext'

/**
 * Хук для получения информации о текущем пользователе
 * Теперь использует глобальный контекст для избежания множественных запросов
 */
export function useCurrentUser() {
  return useUser()
}