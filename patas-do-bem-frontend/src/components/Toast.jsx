import { useEffect } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export function Toast() {
  const { state, actions } = useApp()
  const { ui } = state

  useEffect(() => {
    if (ui.error || ui.success) {
      const timer = setTimeout(() => {
        actions.clearMessages()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [ui.error, ui.success, actions])

  if (!ui.error && !ui.success) {
    return null
  }

  const isError = !!ui.error
  const message = ui.error || ui.success

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        data-testid={isError ? "error-toast" : "success-toast"}
        className={`
        flex items-center p-4 mb-4 rounded-lg shadow-lg max-w-md
        ${isError 
          ? 'bg-red-50 text-red-800 border border-red-200' 
          : 'bg-green-50 text-green-800 border border-green-200'
        }
      `}>
        <div className="mr-3">
          {isError ? (
            <XCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 text-sm font-medium">
          {message}
        </div>
        <button
          onClick={actions.clearMessages}
          className={`
            ml-3 p-1 rounded-md
            ${isError 
              ? 'text-red-500 hover:bg-red-100' 
              : 'text-green-500 hover:bg-green-100'
            }
          `}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}