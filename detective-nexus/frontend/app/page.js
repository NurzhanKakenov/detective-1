'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    
    setTimeout(() => {
      setLoading(false)
      window.location.href = '/dashboard'
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-blue-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/5 rounded-full animate-bounce"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-ping"></div>
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl border-2 border-white/30">
            🛡️
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">
            Detective Nexus
          </h1>
          <p className="text-white/80 text-lg">
            Система управления делами
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Имя пользователя
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
              required
              className="w-full p-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:border-white/50 focus:bg-white/15 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              className="w-full p-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:border-white/50 focus:bg-white/15 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-white/25 border border-white/40 rounded-xl text-white font-bold hover:bg-white/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Авторизация...
              </>
            ) : (
              <>
                🚀 Войти в систему
              </>
            )}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
            <p className="text-white/70 text-sm mb-1">
              🎮 Демо-версия
            </p>
            <p className="text-white/60 text-xs">
              Введите любые данные для входа
            </p>
          </div>
          
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-400/20 text-center">
            <p className="text-purple-300 text-xs mb-1">
              🤖 AI функции в разработке
            </p>
            <p className="text-purple-400/80 text-xs">
              Демо-режим доступен в разделе "AI Анализ"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}