import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { apiService } from '../services/api'

const AuthContext = createContext()

const initialState = {
  isAuthenticated: false,
  admin: null,
  token: null,
  loading: true,
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        admin: action.payload.admin,
        token: action.payload.token,
        loading: false,
        error: null,
      }

    case 'LOGIN_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        admin: null,
        token: null,
        loading: false,
        error: action.payload,
      }

    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        admin: null,
        token: null,
        loading: false,
        error: null,
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }

    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Verificar token salvo no localStorage ao inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        if (token) {
          // Verificar se o token é válido
          const response = await apiService.get('/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.success) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                admin: response.admin,
                token: token
              }
            })
          } else {
            // Token inválido, remover
            localStorage.removeItem('admin_token')
            dispatch({ type: 'LOGOUT' })
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        localStorage.removeItem('admin_token')
        dispatch({ type: 'LOGOUT' })
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'CLEAR_ERROR' })

      const response = await apiService.post('/auth/login', credentials)

      if (response.success !== false) {
        // Salvar token no localStorage
        localStorage.setItem('admin_token', response.token)
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            admin: response.admin,
            token: response.token
          }
        })

        return { success: true }
      } else {
        dispatch({
          type: 'LOGIN_ERROR',
          payload: response.error || 'Erro ao fazer login'
        })
        return { success: false, error: response.error }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao fazer login'
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      // Fazer logout no backend (opcional com JWT)
      if (state.token) {
        await apiService.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${state.token}`
          }
        })
      }
    } catch (error) {
      console.error('Erro ao fazer logout no backend:', error)
    } finally {
      // Limpar dados locais sempre
      localStorage.removeItem('admin_token')
      dispatch({ type: 'LOGOUT' })
    }
  }

  const refreshToken = async () => {
    try {
      if (!state.token) return false

      const response = await apiService.post('/auth/refresh', {}, {
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      })

      if (response.success !== false) {
        localStorage.setItem('admin_token', response.token)
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            admin: state.admin,
            token: response.token
          }
        })
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error)
      logout()
      return false
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    login,
    logout,
    refreshToken,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

// Hook para obter token para requests
export function useAuthToken() {
  const { token } = useAuth()
  
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {}
}