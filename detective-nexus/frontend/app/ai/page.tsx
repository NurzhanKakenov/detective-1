'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { api } from '@/lib/api'
import { Brain, Search, Zap, Target, FileText, AlertCircle } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'

interface Case {
  id: number
  case_number: string
  title: string
  description: string
  status: string
  crime_type: string
}

interface AIAnalysis {
  analysis_type: string
  result: string
  confidence?: number
  suggestions: string[]
}

export default function AIPage() {
  const { addNotification } = useNotifications()
  const [cases, setCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [analysisResults, setAnalysisResults] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysisType, setAnalysisType] = useState('similarity')

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
      const data = await api.getCases()
      setCases(data as Case[])
    } catch (error) {
      console.error('Failed to load cases:', error)
    }
  }

  const runAnalysis = async () => {
    if (!selectedCase) return

    setLoading(true)
    try {
      const result = await api.analyzeCase(selectedCase.id, analysisType)
      setAnalysisResults(result as AIAnalysis)
    } catch (error) {
      console.error('Analysis failed:', error)
      // Show demo result for demonstration
      setAnalysisResults({
        analysis_type: analysisType,
        result: `Демо-анализ для дела ${selectedCase.case_number} (${analysisType})`,
        confidence: 0.85,
        suggestions: [
          'Это демо-результат анализа',
          'Реальный AI будет доступен в следующих версиях',
          'Функция находится в разработке'
        ]
      })

      // Add notification about analysis completion
      addNotification({
        type: 'success',
        title: 'AI анализ завершен',
        message: `Анализ дела ${selectedCase.case_number} завершен (демо-режим)`,
        action: {
          label: 'Посмотреть результаты',
          onClick: () => {
            // Scroll to results or highlight them
            const resultsElement = document.querySelector('[data-results]')
            if (resultsElement) {
              resultsElement.scrollIntoView({ behavior: 'smooth' })
            }
          }
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const predictCharges = async () => {
    if (!selectedCase) return

    setLoading(true)
    try {
      const result = await api.predictCharges(selectedCase.id) as any
      setAnalysisResults({
        analysis_type: 'charge_prediction',
        result: result.predicted_charge,
        confidence: result.confidence,
        suggestions: [result.reasoning, ...result.alternative_charges]
      })
    } catch (error) {
      console.error('Charge prediction failed:', error)
      // Show demo result for demonstration
      setAnalysisResults({
        analysis_type: 'charge_prediction',
        result: `Демо-предсказание для дела ${selectedCase.case_number}: Статья 158 УК РФ (Кража)`,
        confidence: 0.92,
        suggestions: [
          'Анализ основан на описании дела и типе преступления (демо)',
          'Рекомендуется собрать дополнительные доказательства',
          'Альтернативные статьи: 159 УК РФ, 161 УК РФ'
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="text-3xl mr-3">🤖</div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Анализ дел</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-purple-500/20 text-purple-400 text-xs px-3 py-1 rounded-full border border-purple-500/30">
                  🧠 В разработке
                </span>
                <span className="text-police-400 text-sm">Демо-версия функций</span>
              </div>
            </div>
          </div>
        </div>

        {/* Development Notice */}
        <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start">
            <div className="text-2xl mr-4">🚧</div>
            <div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">AI Модуль в разработке</h3>
              <p className="text-purple-300 text-sm mb-3">
                Текущая версия содержит демо-функции для демонстрации возможностей системы.
              </p>
              <div className="text-xs text-purple-400/80">
                <p>🔮 Планируемые возможности:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Интеграция с Ollama/OpenAI для реального анализа текстов</li>
                  <li>Векторный поиск похожих дел</li>
                  <li>Автоматическая классификация преступлений</li>
                  <li>Предсказание обвинений на основе ИИ</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Case Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Выберите дело</h2>
              <div className="space-y-3">
                {cases.map((case_) => (
                  <div
                    key={case_.id}
                    onClick={() => setSelectedCase(case_)}
                    className={`
                      p-3 border rounded-lg cursor-pointer transition-colors
                      ${selectedCase?.id === case_.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {case_.case_number}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {case_.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {case_.crime_type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">AI Анализ</h2>
              
              {selectedCase ? (
                <div className="space-y-6">
                  {/* Selected Case Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{selectedCase.case_number}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedCase.title}</p>
                    <p className="text-xs text-gray-500 mt-2">{selectedCase.description}</p>
                  </div>

                  {/* Analysis Options */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Тип анализа</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => setAnalysisType('similarity')}
                        className={`
                          p-3 border rounded-lg text-left transition-colors
                          ${analysisType === 'similarity' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <Search className="h-5 w-5 text-blue-600 mb-2" />
                        <div className="text-sm font-medium">Поиск похожих</div>
                        <div className="text-xs text-gray-500">Найти связанные дела</div>
                      </button>

                      <button
                        onClick={() => setAnalysisType('priority')}
                        className={`
                          p-3 border rounded-lg text-left transition-colors
                          ${analysisType === 'priority' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <Target className="h-5 w-5 text-orange-600 mb-2" />
                        <div className="text-sm font-medium">Анализ приоритета</div>
                        <div className="text-xs text-gray-500">Оценить важность</div>
                      </button>

                      <button
                        onClick={predictCharges}
                        disabled={loading}
                        className="p-3 border border-gray-200 rounded-lg text-left hover:border-gray-300 transition-colors"
                      >
                        <Zap className="h-5 w-5 text-purple-600 mb-2" />
                        <div className="text-sm font-medium">Предсказание обвинений</div>
                        <div className="text-xs text-gray-500">AI-прокурор</div>
                      </button>
                    </div>
                  </div>

                  {/* Run Analysis Button */}
                  <div className="flex space-x-3">
                    <button
                      onClick={runAnalysis}
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Анализ...' : 'Запустить анализ'}
                    </button>
                  </div>

                  {/* Analysis Results */}
                  {analysisResults && (
                    <div className="border-t pt-6" data-results>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Результаты анализа</h4>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <Brain className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                          <div>
                            <h5 className="font-medium text-green-800">
                              {analysisResults.analysis_type === 'similarity' ? 'Поиск похожих дел' :
                               analysisResults.analysis_type === 'priority' ? 'Анализ приоритета' :
                               'Предсказание обвинений'}
                            </h5>
                            <p className="text-green-700 mt-1">{analysisResults.result}</p>
                            {analysisResults.confidence && (
                              <p className="text-sm text-green-600 mt-2">
                                Уверенность: {Math.round(analysisResults.confidence * 100)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {analysisResults.suggestions.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h6 className="font-medium text-blue-800 mb-2">Рекомендации:</h6>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {analysisResults.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Выберите дело для анализа</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Features Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Возможности AI модуля</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <Search className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Поиск связей</h3>
              <p className="text-sm text-gray-500 mt-1">Находит похожие дела и связи между ними</p>
            </div>
            
            <div className="text-center p-4">
              <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Приоритизация</h3>
              <p className="text-sm text-gray-500 mt-1">Определяет важность и срочность дел</p>
            </div>
            
            <div className="text-center p-4">
              <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">AI-прокурор</h3>
              <p className="text-sm text-gray-500 mt-1">Предсказывает возможные обвинения</p>
            </div>
            
            <div className="text-center p-4">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Напоминания</h3>
              <p className="text-sm text-gray-500 mt-1">Отслеживает сроки и неактивные дела</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}