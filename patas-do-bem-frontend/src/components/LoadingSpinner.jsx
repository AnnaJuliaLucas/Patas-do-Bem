import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  return (
    <Loader2 
      className={`animate-spin text-orange-600 ${sizeClasses[size]} ${className}`}
    />
  )
}

export function LoadingPage({ message = 'Carregando...' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-lg text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export function LoadingOverlay({ show, message = 'Processando...' }) {
  if (!show) return null

  return (
    <div data-testid="loading-overlay" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  )
}