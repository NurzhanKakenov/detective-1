'use client'

import { useState, useEffect } from 'react'

interface CaseStats {
  total_cases: number
  active_cases: number
  closed_cases: number
  archived_cases: number
  solve_rate: number
}

export default function TestPage() {
  const [stats, setStats] = useState<CaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analytics/overview')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Failed to fetch stats')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Ошибка: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Detective Nexus - Тест API
        </h1>
        
        {stats && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Статистика дел</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_cases}
                </div>
                <div className="text-sm text-gray-600">Всего дел</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {stats.active_cases}
                </div>
                <div className="text-sm text-gray-600">Активных</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.closed_cases}
                </div>
                <div className="text-sm text-gray-600">Закрытых</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.solve_rate}%
                </div>
                <div className="text-sm text-gray-600">Раскрываемость</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Статус тестирования</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Backend API работает</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>База данных подключена</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Frontend загружен</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>API интеграция работает</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}