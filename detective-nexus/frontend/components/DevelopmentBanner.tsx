import { Construction, AlertTriangle } from 'lucide-react'

interface DevelopmentBannerProps {
  feature?: string
  type?: 'warning' | 'info' | 'ai'
  className?: string
}

export default function DevelopmentBanner({ 
  feature = "Функция", 
  type = 'info',
  className = "" 
}: DevelopmentBannerProps) {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-badge-500/20',
          border: 'border-badge-500/30',
          text: 'text-badge-400',
          icon: 'text-badge-500'
        }
      case 'ai':
        return {
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/30', 
          text: 'text-purple-400',
          icon: 'text-purple-500'
        }
      default:
        return {
          bg: 'bg-police-700/30',
          border: 'border-police-600/30',
          text: 'text-police-300',
          icon: 'text-police-400'
        }
    }
  }

  const styles = getStyles()

  return (
    <div className={`${styles.bg} ${styles.border} border-2 rounded-xl p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {type === 'ai' ? (
            <div className="text-2xl mr-3">🤖</div>
          ) : (
            <Construction className={`h-5 w-5 ${styles.icon} mr-3`} />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${styles.text}`}>
            {type === 'ai' ? '🧠 AI Функция в разработке' : '🚧 Функция в разработке'}
          </h3>
          <p className={`text-xs ${styles.text} opacity-80 mt-1`}>
            {feature} будет доступна в следующих версиях системы
          </p>
        </div>
      </div>
    </div>
  )
}