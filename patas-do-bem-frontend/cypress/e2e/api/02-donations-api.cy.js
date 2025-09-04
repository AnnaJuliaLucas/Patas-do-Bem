/**
 * API Tests - Donations Endpoints
 * 
 * Testa endpoints relacionados às doações da ONG
 */

describe('Donations API Tests', () => {
  const API_BASE = Cypress.env('API_BASE_URL')

  context('GET /api/donations', () => {
    it('should return donations list with pagination', () => {
      cy.apiRequest('GET', '/api/donations').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('donations')
        expect(response.body).to.have.property('total')
        expect(response.body).to.have.property('pages')
        expect(response.body).to.have.property('current_page')
        
        // Validate donations array
        const donations = response.body.donations
        expect(donations).to.be.an('array')
        
        if (donations.length > 0) {
          donations.forEach(donation => {
            expect(donation).to.have.property('id')
            expect(donation).to.have.property('donor_name')
            expect(donation).to.have.property('donor_email')
            expect(donation).to.have.property('amount')
            expect(donation).to.have.property('donation_type')
            expect(donation).to.have.property('payment_method')
            expect(donation).to.have.property('payment_status')
            expect(donation).to.have.property('created_at')
            
            // Validate data types
            expect(donation.amount).to.be.a('number')
            expect(donation.amount).to.be.greaterThan(0)
            expect(donation.donor_email).to.include('@')
            expect(['one_time', 'recurring']).to.include(donation.donation_type)
            expect(['pix', 'credit_card', 'boleto']).to.include(donation.payment_method)
            expect(['pending', 'completed', 'failed', 'cancelled']).to.include(donation.payment_status)
          })
        }
      })
    })

    it('should support pagination parameters', () => {
      cy.apiRequest('GET', '/api/donations?page=1&per_page=5').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.current_page).to.eq(1)
        expect(response.body.donations.length).to.be.at.most(5)
      })
    })

    it('should filter by donation type', () => {
      cy.apiRequest('GET', '/api/donations?type=recurring').then((response) => {
        expect(response.status).to.eq(200)
        if (response.body.donations.length > 0) {
          response.body.donations.forEach(donation => {
            expect(donation.donation_type).to.eq('recurring')
          })
        }
      })
    })

    it('should filter by payment status', () => {
      cy.apiRequest('GET', '/api/donations?status=completed').then((response) => {
        expect(response.status).to.eq(200)
        if (response.body.donations.length > 0) {
          response.body.donations.forEach(donation => {
            expect(donation.payment_status).to.eq('completed')
          })
        }
      })
    })
  })

  context('POST /api/donations', () => {
    const validDonation = {
      donor_name: 'João Silva Test',
      donor_email: 'joao.test@email.com',
      donor_phone: '(32) 99999-0000',
      amount: 50.00,
      donation_type: 'one_time',
      payment_method: 'pix'
    }

    it('should create a new donation', () => {
      cy.apiRequest('POST', '/api/donations', validDonation).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('id')
        expect(response.body).to.have.property('message')
        expect(response.body.message).to.include('criada com sucesso')
        
        const donation = response.body
        expect(donation.donor_name).to.eq(validDonation.donor_name)
        expect(donation.donor_email).to.eq(validDonation.donor_email)
        expect(donation.amount).to.eq(validDonation.amount)
      })
    })

    it('should create recurring donation', () => {
      const recurringDonation = {
        ...validDonation,
        donation_type: 'recurring',
        payment_method: 'credit_card'
      }

      cy.apiRequest('POST', '/api/donations', recurringDonation).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.donation_type).to.eq('recurring')
        expect(response.body.payment_method).to.eq('credit_card')
      })
    })

    it('should validate required fields', () => {
      const invalidDonation = {
        donor_name: 'Test User'
        // Missing required fields
      }

      cy.apiRequest('POST', '/api/donations', invalidDonation).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
      })
    })

    it('should validate email format', () => {
      const invalidEmailDonation = {
        ...validDonation,
        donor_email: 'invalid-email-format'
      }

      cy.apiRequest('POST', '/api/donations', invalidEmailDonation).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('email')
      })
    })

    it('should validate amount is positive', () => {
      const negativeAmountDonation = {
        ...validDonation,
        amount: -10.00
      }

      cy.apiRequest('POST', '/api/donations', negativeAmountDonation).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('amount')
      })
    })

    it('should validate donation type', () => {
      const invalidTypeDonation = {
        ...validDonation,
        donation_type: 'invalid_type'
      }

      cy.apiRequest('POST', '/api/donations', invalidTypeDonation).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('donation_type')
      })
    })

    it('should validate payment method', () => {
      const invalidMethodDonation = {
        ...validDonation,
        payment_method: 'invalid_method'
      }

      cy.apiRequest('POST', '/api/donations', invalidMethodDonation).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('payment_method')
      })
    })
  })

  context('GET /api/donations/stats', () => {
    it('should return donation statistics', () => {
      cy.apiRequest('GET', '/api/donations/stats').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('total_donations')
        expect(response.body).to.have.property('total_amount')
        expect(response.body).to.have.property('recurring_donations')
        expect(response.body).to.have.property('monthly_average')
        
        expect(response.body.total_donations).to.be.a('number')
        expect(response.body.total_amount).to.be.a('number')
        expect(response.body.recurring_donations).to.be.a('number')
        expect(response.body.monthly_average).to.be.a('number')
      })
    })

    it('should return monthly breakdown', () => {
      cy.apiRequest('GET', '/api/donations/stats?period=monthly').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('monthly_data')
        expect(response.body.monthly_data).to.be.an('array')
      })
    })
  })

  context('Error Handling', () => {
    it('should handle invalid donation ID', () => {
      cy.apiRequest('GET', '/api/donations/99999').then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body).to.have.property('error')
      })
    })

    it('should handle malformed JSON', () => {
      cy.apiRequest('POST', '/api/donations', '{invalid json}', {
        headers: { 'Content-Type': 'application/json' }
      }).then((response) => {
        expect(response.status).to.eq(400)
      })
    })
  })
})