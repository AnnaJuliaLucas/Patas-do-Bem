const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  // Config endpoints
  async getConfig() {
    return this.request('/api/config')
  }

  // Donation endpoints
  async createDonation(donationData) {
    return this.request('/api/donations', {
      method: 'POST',
      body: donationData,
    })
  }

  async getDonations(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/donations${queryString ? `?${queryString}` : ''}`)
  }

  async getDonationStats() {
    return this.request('/api/donations/stats')
  }

  async getDonationHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/donations/history${queryString ? `?${queryString}` : ''}`)
  }

  async confirmDonationPayment(donationId, paymentData) {
    return this.request(`/api/donations/${donationId}/confirm`, {
      method: 'POST',
      body: paymentData,
    })
  }

  async cancelDonation(donationId) {
    return this.request(`/api/donations/${donationId}/cancel`, {
      method: 'PUT',
    })
  }

  // Raffle endpoints
  async getRaffles() {
    return this.request('/api/raffles')
  }

  async getRaffle(raffleId) {
    return this.request(`/api/raffles/${raffleId}`)
  }

  async createRaffle(raffleData) {
    return this.request('/api/raffles', {
      method: 'POST',
      body: raffleData,
    })
  }

  async updateRaffle(raffleId, raffleData) {
    return this.request(`/api/raffles/${raffleId}`, {
      method: 'PUT',
      body: raffleData,
    })
  }

  async deleteRaffle(raffleId) {
    return this.request(`/api/raffles/${raffleId}`, {
      method: 'DELETE',
    })
  }

  async getRaffleTickets(raffleId) {
    return this.request(`/api/raffles/${raffleId}/tickets`)
  }

  async buyRaffleTickets(raffleId, ticketData) {
    return this.request(`/api/raffles/${raffleId}/tickets`, {
      method: 'POST',
      body: ticketData,
    })
  }

  async confirmTicketPayment(raffleId, paymentData) {
    return this.request(`/api/raffles/${raffleId}/tickets/confirm`, {
      method: 'POST',
      body: paymentData,
    })
  }

  async getRaffleNumbers(raffleId) {
    return this.request(`/api/raffles/${raffleId}/numbers`)
  }

  async drawRaffle(raffleId) {
    return this.request(`/api/raffles/${raffleId}/draw`, {
      method: 'POST',
    })
  }

  async getRaffleWinners(raffleId) {
    return this.request(`/api/raffles/${raffleId}/winners`)
  }

  // Payment endpoints
  async createPixPayment(paymentData) {
    return this.request('/api/payments/pix', {
      method: 'POST',
      body: paymentData,
    })
  }

  async createCreditCardPayment(paymentData) {
    return this.request('/api/payments/credit-card', {
      method: 'POST',
      body: paymentData,
    })
  }

  async createRecurringPayment(paymentData) {
    return this.request('/api/payments/recurring', {
      method: 'POST',
      body: paymentData,
    })
  }

  async createBoletoPayment(paymentData) {
    return this.request('/api/payments/boleto', {
      method: 'POST',
      body: paymentData,
    })
  }

  async getPaymentStatus(paymentId) {
    return this.request(`/api/payments/${paymentId}/status`)
  }

  async getPaymentConfig() {
    return this.request('/api/payments/config')
  }

  // Contact endpoints
  async sendContactMessage(messageData) {
    return this.request('/api/contact', {
      method: 'POST',
      body: messageData,
    })
  }

  async getContactMessages(page = 1, limit = 20, status = 'all') {
    const params = new URLSearchParams({ page, limit, status })
    return this.request(`/api/contact/messages?${params}`)
  }

  async updateContactMessageStatus(messageId, status) {
    return this.request(`/api/contact/messages/${messageId}`, {
      method: 'PUT',
      body: { status },
    })
  }

  // Dashboard endpoints
  async getDashboardData() {
    return this.request('/api/dashboard')
  }
}

export const apiService = new ApiService()
export default apiService