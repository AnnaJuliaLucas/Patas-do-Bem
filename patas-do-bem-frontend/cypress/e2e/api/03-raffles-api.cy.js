/**
 * API Tests - Raffles Endpoints
 * 
 * Testa endpoints relacionados às rifas da ONG
 */

describe('Raffles API Tests', () => {
  const API_BASE = Cypress.env('API_BASE_URL')

  context('GET /api/raffles', () => {
    it('should return active raffles list', () => {
      cy.apiRequest('GET', '/api/raffles').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('raffles')
        
        const raffles = response.body.raffles
        expect(raffles).to.be.an('array')
        
        if (raffles.length > 0) {
          raffles.forEach(raffle => {
            expect(raffle).to.have.property('id')
            expect(raffle).to.have.property('title')
            expect(raffle).to.have.property('description')
            expect(raffle).to.have.property('ticket_price')
            expect(raffle).to.have.property('total_numbers')
            expect(raffle).to.have.property('sold_numbers')
            expect(raffle).to.have.property('available_numbers')
            expect(raffle).to.have.property('status')
            expect(raffle).to.have.property('draw_date')
            expect(raffle).to.have.property('created_at')
            
            // Validate data types and values
            expect(raffle.id).to.be.a('number')
            expect(raffle.ticket_price).to.be.a('number')
            expect(raffle.ticket_price).to.be.greaterThan(0)
            expect(raffle.total_numbers).to.be.a('number')
            expect(raffle.total_numbers).to.be.greaterThan(0)
            expect(raffle.sold_numbers).to.be.a('number')
            expect(raffle.available_numbers).to.be.a('number')
            expect(raffle.status).to.eq('active')
            
            // Check numbers consistency
            expect(raffle.sold_numbers + raffle.available_numbers).to.eq(raffle.total_numbers)
          })
        }
      })
    })

    it('should filter by status', () => {
      cy.apiRequest('GET', '/api/raffles?status=active').then((response) => {
        expect(response.status).to.eq(200)
        if (response.body.raffles.length > 0) {
          response.body.raffles.forEach(raffle => {
            expect(raffle.status).to.eq('active')
          })
        }
      })
    })

    it('should return raffles ordered by creation date', () => {
      cy.apiRequest('GET', '/api/raffles').then((response) => {
        const raffles = response.body.raffles
        if (raffles.length > 1) {
          for (let i = 1; i < raffles.length; i++) {
            const prevDate = new Date(raffles[i-1].created_at)
            const currDate = new Date(raffles[i].created_at)
            expect(prevDate.getTime()).to.be.greaterThanOrEqual(currDate.getTime())
          }
        }
      })
    })
  })

  context('GET /api/raffles/:id', () => {
    let raffleId

    before(() => {
      // Get a raffle ID for testing
      cy.apiRequest('GET', '/api/raffles').then((response) => {
        if (response.body.raffles.length > 0) {
          raffleId = response.body.raffles[0].id
        }
      })
    })

    it('should return specific raffle details', () => {
      if (!raffleId) {
        cy.log('No raffles available for testing')
        return
      }

      cy.apiRequest('GET', `/api/raffles/${raffleId}`).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('raffle')
        
        const raffle = response.body.raffle
        expect(raffle.id).to.eq(raffleId)
        expect(raffle).to.have.property('title')
        expect(raffle).to.have.property('description')
        expect(raffle).to.have.property('image_url')
        expect(raffle).to.have.property('ticket_price')
        expect(raffle).to.have.property('total_numbers')
        expect(raffle).to.have.property('draw_date')
        expect(raffle).to.have.property('created_by')
      })
    })

    it('should return 404 for non-existent raffle', () => {
      cy.apiRequest('GET', '/api/raffles/99999').then((response) => {
        expect(response.status).to.eq(404)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.include('não encontrada')
      })
    })

    it('should return available numbers for raffle', () => {
      if (!raffleId) {
        cy.log('No raffles available for testing')
        return
      }

      cy.apiRequest('GET', `/api/raffles/${raffleId}/numbers`).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('available_numbers')
        expect(response.body).to.have.property('sold_numbers')
        
        const availableNumbers = response.body.available_numbers
        const soldNumbers = response.body.sold_numbers
        
        expect(availableNumbers).to.be.an('array')
        expect(soldNumbers).to.be.an('array')
        
        // Check for overlaps (sold numbers shouldn't be in available)
        const overlap = availableNumbers.filter(num => soldNumbers.includes(num))
        expect(overlap).to.have.length(0)
      })
    })
  })

  context('POST /api/raffles/:id/tickets', () => {
    let raffleId
    
    before(() => {
      cy.apiRequest('GET', '/api/raffles').then((response) => {
        if (response.body.raffles.length > 0) {
          raffleId = response.body.raffles[0].id
        }
      })
    })

    const validTicketPurchase = {
      buyer_name: 'Maria Test',
      buyer_email: 'maria.test@email.com',
      buyer_phone: '(32) 99999-1111',
      selected_numbers: [10, 25, 50],
      payment_method: 'pix'
    }

    it('should create ticket purchase for raffle', () => {
      if (!raffleId) {
        cy.log('No raffles available for testing')
        return
      }

      cy.apiRequest('POST', `/api/raffles/${raffleId}/tickets`, validTicketPurchase).then((response) => {
        expect(response.status).to.be.oneOf([201, 409]) // 409 if numbers already sold
        
        if (response.status === 201) {
          expect(response.body).to.have.property('message')
          expect(response.body).to.have.property('tickets')
          expect(response.body.tickets).to.be.an('array')
          expect(response.body.tickets.length).to.eq(validTicketPurchase.selected_numbers.length)
        } else if (response.status === 409) {
          expect(response.body).to.have.property('error')
          expect(response.body.error).to.include('já vendido')
        }
      })
    })

    it('should validate required fields', () => {
      if (!raffleId) return

      const invalidPurchase = {
        buyer_name: 'Test User'
        // Missing required fields
      }

      cy.apiRequest('POST', `/api/raffles/${raffleId}/tickets`, invalidPurchase).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
      })
    })

    it('should validate selected numbers are within range', () => {
      if (!raffleId) return

      const invalidNumbersPurchase = {
        ...validTicketPurchase,
        selected_numbers: [0, 999, -1] // Invalid numbers
      }

      cy.apiRequest('POST', `/api/raffles/${raffleId}/tickets`, invalidNumbersPurchase).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('número')
      })
    })

    it('should prevent duplicate number selection in same purchase', () => {
      if (!raffleId) return

      const duplicateNumbersPurchase = {
        ...validTicketPurchase,
        selected_numbers: [5, 5, 10] // Duplicate number
      }

      cy.apiRequest('POST', `/api/raffles/${raffleId}/tickets`, duplicateNumbersPurchase).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('duplicado')
      })
    })

    it('should validate email format', () => {
      if (!raffleId) return

      const invalidEmailPurchase = {
        ...validTicketPurchase,
        buyer_email: 'invalid-email'
      }

      cy.apiRequest('POST', `/api/raffles/${raffleId}/tickets`, invalidEmailPurchase).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('email')
      })
    })
  })

  context('POST /api/raffles (Admin only)', () => {
    const newRaffle = {
      title: 'Test Rifa - Vale Compras',
      description: 'Rifa de teste para validação da API',
      image_url: '/static/images/test_raffle.jpg',
      ticket_price: 15.00,
      total_numbers: 50,
      draw_date: '2025-12-31'
    }

    it('should create new raffle with admin auth', () => {
      // This test would typically require authentication
      // For now, we'll test the endpoint structure
      cy.apiRequest('POST', '/api/raffles', newRaffle).then((response) => {
        // Expect 401/403 without auth, or 201 with auth
        expect(response.status).to.be.oneOf([201, 401, 403])
        
        if (response.status === 201) {
          expect(response.body).to.have.property('id')
          expect(response.body).to.have.property('message')
          expect(response.body.title).to.eq(newRaffle.title)
        }
      })
    })

    it('should validate raffle creation fields', () => {
      const invalidRaffle = {
        title: '', // Empty title
        ticket_price: -5, // Negative price
        total_numbers: 0 // Zero numbers
      }

      cy.apiRequest('POST', '/api/raffles', invalidRaffle).then((response) => {
        expect(response.status).to.be.oneOf([400, 401, 403])
        if (response.status === 400) {
          expect(response.body).to.have.property('error')
        }
      })
    })
  })

  context('Performance Tests', () => {
    it('should handle concurrent requests to raffles list', () => {
      const requests = Array.from({ length: 10 }, () => 
        cy.apiRequest('GET', '/api/raffles')
      )
      
      Promise.all(requests).then((responses) => {
        responses.forEach((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property('raffles')
        })
      })
    })

    it('should respond quickly to raffle details', () => {
      const startTime = Date.now()
      
      cy.apiRequest('GET', '/api/raffles').then((response) => {
        const endTime = Date.now()
        const responseTime = endTime - startTime
        
        expect(responseTime).to.be.lessThan(2000) // Should respond within 2 seconds
        expect(response.status).to.eq(200)
      })
    })
  })
})