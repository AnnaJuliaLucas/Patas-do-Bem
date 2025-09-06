import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { apiService } from '../services/api'

const AppContext = createContext()

const initialState = {
  config: null,
  donations: {
    list: [],
    stats: null,
    history: [],
    loading: false,
    error: null,
  },
  raffles: {
    list: [],
    current: null,
    loading: false,
    error: null,
  },
  payments: {
    config: null,
    current: null,
    loading: false,
    error: null,
  },
  contact: {
    messages: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  dashboard: {
    data: null,
    loading: false,
    error: null,
  },
  ui: {
    loading: false,
    error: null,
    success: null,
  },
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload,
        },
      }

    case 'SET_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload,
          loading: false,
        },
      }

    case 'SET_SUCCESS':
      return {
        ...state,
        ui: {
          ...state.ui,
          success: action.payload,
          loading: false,
        },
      }

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: null,
          success: null,
        },
      }

    // Config actions
    case 'SET_CONFIG':
      return {
        ...state,
        config: action.payload,
      }

    // Donation actions
    case 'SET_DONATIONS_LOADING':
      return {
        ...state,
        donations: {
          ...state.donations,
          loading: action.payload,
        },
      }

    case 'SET_DONATIONS_ERROR':
      return {
        ...state,
        donations: {
          ...state.donations,
          error: action.payload,
          loading: false,
        },
      }

    case 'SET_DONATIONS':
      return {
        ...state,
        donations: {
          ...state.donations,
          list: action.payload,
          loading: false,
          error: null,
        },
      }

    case 'SET_DONATION_STATS':
      return {
        ...state,
        donations: {
          ...state.donations,
          stats: action.payload,
        },
      }

    case 'SET_DONATION_HISTORY':
      return {
        ...state,
        donations: {
          ...state.donations,
          history: action.payload,
        },
      }

    case 'ADD_DONATION':
      return {
        ...state,
        donations: {
          ...state.donations,
          list: [action.payload, ...state.donations.list],
        },
      }

    // Raffle actions
    case 'SET_RAFFLES_LOADING':
      return {
        ...state,
        raffles: {
          ...state.raffles,
          loading: action.payload,
        },
      }

    case 'SET_RAFFLES_ERROR':
      return {
        ...state,
        raffles: {
          ...state.raffles,
          error: action.payload,
          loading: false,
        },
      }

    case 'SET_RAFFLES':
      return {
        ...state,
        raffles: {
          ...state.raffles,
          list: action.payload,
          loading: false,
          error: null,
        },
      }

    case 'SET_CURRENT_RAFFLE':
      return {
        ...state,
        raffles: {
          ...state.raffles,
          current: action.payload,
        },
      }

    case 'ADD_RAFFLE':
      return {
        ...state,
        raffles: {
          ...state.raffles,
          list: [action.payload, ...state.raffles.list],
        },
      }

    case 'UPDATE_RAFFLE':
      return {
        ...state,
        raffles: {
          ...state.raffles,
          list: state.raffles.list.map(raffle =>
            raffle.id === action.payload.id ? action.payload : raffle
          ),
          current: state.raffles.current?.id === action.payload.id
            ? action.payload
            : state.raffles.current,
        },
      }

    // Payment actions
    case 'SET_PAYMENTS_LOADING':
      return {
        ...state,
        payments: {
          ...state.payments,
          loading: action.payload,
        },
      }

    case 'SET_PAYMENTS_ERROR':
      return {
        ...state,
        payments: {
          ...state.payments,
          error: action.payload,
          loading: false,
        },
      }

    case 'SET_PAYMENT_CONFIG':
      return {
        ...state,
        payments: {
          ...state.payments,
          config: action.payload,
        },
      }

    case 'SET_CURRENT_PAYMENT':
      return {
        ...state,
        payments: {
          ...state.payments,
          current: action.payload,
        },
      }

    // Contact actions
    case 'SET_CONTACT_LOADING':
      return {
        ...state,
        contact: {
          ...state.contact,
          loading: action.payload,
        },
      }

    case 'SET_CONTACT_ERROR':
      return {
        ...state,
        contact: {
          ...state.contact,
          error: action.payload,
          loading: false,
        },
      }

    case 'SET_CONTACT_MESSAGES':
      return {
        ...state,
        contact: {
          ...state.contact,
          messages: action.payload.messages || [],
          unreadCount: action.payload.unreadCount || 0,
          loading: false,
          error: null,
        },
      }

    // Dashboard actions
    case 'SET_DASHBOARD_LOADING':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          loading: action.payload,
        },
      }

    case 'SET_DASHBOARD_ERROR':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          error: action.payload,
          loading: false,
        },
      }

    case 'SET_DASHBOARD_DATA':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          data: action.payload,
          loading: false,
          error: null,
        },
      }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Initialize app data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Load config
      const config = await apiService.getConfig()
      dispatch({ type: 'SET_CONFIG', payload: config })

      // Load payment config
      const paymentConfig = await apiService.getPaymentConfig()
      dispatch({ type: 'SET_PAYMENT_CONFIG', payload: paymentConfig })

      dispatch({ type: 'SET_LOADING', payload: false })
    } catch (error) {
      console.error('Error loading initial data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados iniciais' })
    }
  }

  // Donation actions
  const loadDonations = async (params = {}) => {
    try {
      dispatch({ type: 'SET_DONATIONS_LOADING', payload: true })
      const data = await apiService.getDonations(params)
      dispatch({ type: 'SET_DONATIONS', payload: data.donations || [] })
      return data
    } catch (error) {
      dispatch({ type: 'SET_DONATIONS_ERROR', payload: error.message })
      throw error
    }
  }

  const loadDonationStats = async () => {
    try {
      const stats = await apiService.getDonationStats()
      dispatch({ type: 'SET_DONATION_STATS', payload: stats })
      return stats
    } catch (error) {
      console.error('Error loading donation stats:', error)
      throw error
    }
  }

  const loadDonationHistory = async (params = {}) => {
    try {
      const data = await apiService.getDonationHistory(params)
      dispatch({ type: 'SET_DONATION_HISTORY', payload: data.donations || [] })
      return data
    } catch (error) {
      console.error('Error loading donation history:', error)
      throw error
    }
  }

  const createDonation = async (donationData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const donation = await apiService.createDonation(donationData)
      dispatch({ type: 'ADD_DONATION', payload: donation })
      dispatch({ type: 'SET_SUCCESS', payload: 'Doação criada com sucesso!' })
      return donation
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      throw error
    }
  }

  // Raffle actions
  const loadRaffles = async () => {
    try {
      dispatch({ type: 'SET_RAFFLES_LOADING', payload: true })
      const data = await apiService.getRaffles()
      dispatch({ type: 'SET_RAFFLES', payload: data.raffles || [] })
      return data
    } catch (error) {
      dispatch({ type: 'SET_RAFFLES_ERROR', payload: error.message })
      throw error
    }
  }

  const loadRaffle = async (raffleId) => {
    try {
      const data = await apiService.getRaffle(raffleId)
      dispatch({ type: 'SET_CURRENT_RAFFLE', payload: data.raffle })
      return data
    } catch (error) {
      console.error('Error loading raffle:', error)
      throw error
    }
  }

  const createRaffle = async (raffleData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const data = await apiService.createRaffle(raffleData)
      dispatch({ type: 'ADD_RAFFLE', payload: data.raffle })
      dispatch({ type: 'SET_SUCCESS', payload: 'Rifa criada com sucesso!' })
      return data
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      throw error
    }
  }

  const buyRaffleTickets = async (raffleId, ticketData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const result = await apiService.buyRaffleTickets(raffleId, ticketData)
      dispatch({ type: 'SET_SUCCESS', payload: 'Números reservados com sucesso!' })
      return result
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      throw error
    }
  }

  // Payment actions
  const createPixPayment = async (paymentData) => {
    try {
      dispatch({ type: 'SET_PAYMENTS_LOADING', payload: true })
      const result = await apiService.createPixPayment(paymentData)
      dispatch({ type: 'SET_CURRENT_PAYMENT', payload: result })
      return result
    } catch (error) {
      dispatch({ type: 'SET_PAYMENTS_ERROR', payload: error.message })
      throw error
    }
  }

  const createCreditCardPayment = async (paymentData) => {
    try {
      dispatch({ type: 'SET_PAYMENTS_LOADING', payload: true })
      const result = await apiService.createCreditCardPayment(paymentData)
      dispatch({ type: 'SET_CURRENT_PAYMENT', payload: result })
      return result
    } catch (error) {
      dispatch({ type: 'SET_PAYMENTS_ERROR', payload: error.message })
      throw error
    }
  }

  // UI actions
  // Contact actions
  const sendContactMessage = async (messageData) => {
    try {
      dispatch({ type: 'SET_CONTACT_LOADING', payload: true })
      const result = await apiService.sendContactMessage(messageData)
      dispatch({ type: 'SET_CONTACT_LOADING', payload: false })
      dispatch({ type: 'SET_SUCCESS', payload: 'Mensagem enviada com sucesso!' })
      return result
    } catch (error) {
      dispatch({ type: 'SET_CONTACT_ERROR', payload: error.message })
      dispatch({ type: 'SET_ERROR', payload: error.message })
      throw error
    }
  }

  const loadContactMessages = async (page = 1, limit = 20, status = 'all') => {
    try {
      dispatch({ type: 'SET_CONTACT_LOADING', payload: true })
      const data = await apiService.getContactMessages(page, limit, status)
      dispatch({ type: 'SET_CONTACT_MESSAGES', payload: data })
      return data
    } catch (error) {
      dispatch({ type: 'SET_CONTACT_ERROR', payload: error.message })
      throw error
    }
  }

  const updateContactMessageStatus = async (messageId, status) => {
    try {
      const result = await apiService.updateContactMessageStatus(messageId, status)
      // Reload messages to get updated data
      await loadContactMessages()
      return result
    } catch (error) {
      dispatch({ type: 'SET_CONTACT_ERROR', payload: error.message })
      throw error
    }
  }

  // Dashboard actions
  const loadDashboardData = async () => {
    try {
      dispatch({ type: 'SET_DASHBOARD_LOADING', payload: true })
      const data = await apiService.getDashboardData()
      dispatch({ type: 'SET_DASHBOARD_DATA', payload: data })
      return data
    } catch (error) {
      dispatch({ type: 'SET_DASHBOARD_ERROR', payload: error.message })
      throw error
    }
  }

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' })
  }

  const showError = (message) => {
    dispatch({ type: 'SET_ERROR', payload: message })
  }

  const showSuccess = (message) => {
    dispatch({ type: 'SET_SUCCESS', payload: message })
  }

  const value = {
    state,
    actions: {
      // Data loading
      loadDonations,
      loadDonationStats,
      loadDonationHistory,
      loadRaffles,
      loadRaffle,
      
      // Data creation
      createDonation,
      createRaffle,
      buyRaffleTickets,
      
      // Payments
      createPixPayment,
      createCreditCardPayment,
      
      // Contact
      sendContactMessage,
      loadContactMessages,
      updateContactMessageStatus,
      
      // Dashboard
      loadDashboardData,
      
      // UI
      clearMessages,
      showError,
      showSuccess,
    },
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export { AppContext }