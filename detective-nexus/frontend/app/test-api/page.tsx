'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { api } from '@/lib/api'

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testUsersApi = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      console.log('Тестируем API пользователей...')
      const users = await api.getUsers()
      console.log('Результат API:', users)
      setResult(users)
    } catch (err) {
      console.error('Ошибка API:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Тест API</h1>
        
        <div className="police-card rounded-xl p-6">
          <button
            onClick={testUsersApi}
            disabled={loading}
            className="px-4 py-2 bg-badge-500 text-white rounded-lg hover:bg-badge-600 disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : 'Тестировать API пользователей'}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-danger-500/10 border border-danger-500/30 rounded-lg">
              <h3 className="text-danger-400 font-medium">Ошибка:</h3>
              <p className="text-danger-300 text-sm mt-1">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="mt-4 p-4 bg-success-500/10 border border-success-500/30 rounded-lg">
              <h3 className="text-success-400 font-medium">Результат:</h3>
              <p className="text-success-300 text-sm mt-1">
                Получено {Array.isArray(result) ? result.length : 'не массив'} пользователей
              </p>
              <pre className="text-xs text-police-300 mt-2 overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}