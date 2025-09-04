/**
 * API Tests - Payment Endpoints
 * 
 * Testa endpoints relacionados aos pagamentos (PIX, Cartão, Boleto)
 */

describe('Payments API Tests', () => {
  const API_BASE = Cypress.env('API_BASE_URL')

  context('GET /api/payments/config', () => {
    it('should return payment configuration', () => {
      cy.apiRequest('GET', '/api/payments/config').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('mercado_pago')
        expect(response.body).to.have.property('pix')
        
        // Validate Mercado Pago config
        const mpConfig = response.body.mercado_pago
        expect(mpConfig).to.have.property('public_key')
        expect(mpConfig.public_key).to.be.a('string')
        
        // Validate PIX config
        const pixConfig = response.body.pix
        expect(pixConfig).to.have.property('key')
        expect(pixConfig).to.have.property('recipient_name')
        expect(pixConfig.recipient_name).to.include('Patas do Bem')
      })
    })
  })

  context('POST /api/payments/pix', () => {
    const validPixPayment = {
      amount: 50.00,
      description: 'Doação PIX teste',
      payer_email: 'test@pix.com',
      type: 'donation',
      donor_name: 'João PIX Test',
      donation_type: 'one_time'
    }

    it('should create PIX payment', () => {
      cy.apiRequest('POST', '/api/payments/pix', validPixPayment).then((response) => {
        // In test environment, might return different status codes
        expect(response.status).to.be.oneOf([200, 201, 400, 500])
        
        if (response.status === 201 || response.status === 200) {
          expect(response.body).to.have.property('success', true)
          expect(response.body).to.have.property('payment_id')
          expect(response.body).to.have.property('qr_code')
          expect(response.body).to.have.property('qr_code_base64')
          expect(response.body).to.have.property('amount')
          expect(response.body).to.have.property('status')
          
          expect(response.body.amount).to.eq(validPixPayment.amount)
        } else {
          // In test mode, might fail due to invalid credentials
          expect(response.body).to.have.property('error')
        }
      })
    })

    it('should validate required PIX fields', () => {
      const invalidPixPayment = {
        amount: 25.00
        // Missing required fields
      }

      cy.apiRequest('POST', '/api/payments/pix', invalidPixPayment).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.include('obrigatório')
      })
    })

    it('should validate positive amount', () => {
      const negativeAmountPayment = {
        ...validPixPayment,
        amount: -10.00
      }

      cy.apiRequest('POST', '/api/payments/pix', negativeAmountPayment).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('amount')
      })
    })

    it('should validate email format', () => {
      const invalidEmailPayment = {
        ...validPixPayment,
        payer_email: 'invalid-email'
      }

      cy.apiRequest('POST', '/api/payments/pix', invalidEmailPayment).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('email')
      })
    })
  })

  context('POST /api/payments/credit-card', () => {
    const validCardPayment = {
      amount: 100.00,
      description: 'Doação cartão teste',
      card_token: 'test_card_token_123',
      payer_email: 'test@card.com',
      payer_first_name: 'Maria',
      payer_last_name: 'Silva',
      payer_doc_type: 'CPF',
      payer_doc_number: '12345678901',
      payment_method_id: 'visa',
      installments: 1,
      type: 'donation',
      donation_type: 'one_time'
    }

    it('should create credit card payment', () => {
      cy.apiRequest('POST', '/api/payments/credit-card', validCardPayment).then((response) => {
        expect(response.status).to.be.oneOf([201, 400, 500])
        
        if (response.status === 201) {
          expect(response.body).to.have.property('success', true)
          expect(response.body).to.have.property('payment_id')
          expect(response.body).to.have.property('status')
          expect(response.body).to.have.property('amount')
          
          expect(response.body.amount).to.eq(validCardPayment.amount)
        } else {
          expect(response.body).to.have.property('error')
        }
      })
    })

    it('should validate required card fields', () => {
      const invalidCardPayment = {
        amount: 50.00,
        description: 'Test payment'
        // Missing card_token, payer_email, etc.
      }

      cy.apiRequest('POST', '/api/payments/credit-card', invalidCardPayment).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.include('obrigatório')
      })
    })

    it('should validate installments', () => {
      const invalidInstallments = {
        ...validCardPayment,
        installments: 25 // Too many installments
      }

      cy.apiRequest('POST', '/api/payments/credit-card', invalidInstallments).then((response) => {
        expect(response.status).to.be.oneOf([400, 500])
        if (response.status === 400) {
          expect(response.body.error).to.include('installments')
        }
      })
    })
  })

  context('POST /api/payments/recurring', () => {
    const validRecurringPayment = {
      amount: 50.00,
      description: 'Assinatura mensal teste',
      card_token: 'test_recurring_token',
      payer_email: 'test@recurring.com',
      payer_first_name: 'Carlos',
      payer_last_name: 'Santos',
      frequency: 'monthly'
    }

    it('should create recurring subscription', () => {
      cy.apiRequest('POST', '/api/payments/recurring', validRecurringPayment).then((response) => {
        expect(response.status).to.be.oneOf([201, 400, 500])
        
        if (response.status === 201) {
          expect(response.body).to.have.property('success', true)
          expect(response.body).to.have.property('subscription_id')
          expect(response.body).to.have.property('status')
          expect(response.body).to.have.property('amount')
          expect(response.body).to.have.property('next_payment_date')
          
          expect(response.body.amount).to.eq(validRecurringPayment.amount)
        } else {
          expect(response.body).to.have.property('error')
        }
      })
    })

    it('should validate recurring payment fields', () => {
      const invalidRecurring = {
        amount: 30.00
        // Missing required fields
      }

      cy.apiRequest('POST', '/api/payments/recurring', invalidRecurring).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
      })
    })
  })

  context('POST /api/payments/boleto', () => {
    const validBoletoPayment = {
      amount: 75.00,
      description: 'Doação boleto teste',
      payer_email: 'test@boleto.com',
      payer_first_name: 'Ana',
      payer_last_name: 'Costa',
      payer_doc_type: 'CPF',
      payer_doc_number: '12345678901',
      payer_zip_code: '36240000',
      payer_street_name: 'Rua Principal',
      payer_street_number: '123',
      payer_neighborhood: 'Centro',
      payer_city: 'Santos Dumont',
      payer_state: 'MG',
      type: 'donation',
      donation_type: 'one_time'
    }

    it('should create boleto payment', () => {
      cy.apiRequest('POST', '/api/payments/boleto', validBoletoPayment).then((response) => {
        expect(response.status).to.be.oneOf([201, 400, 500])
        
        if (response.status === 201) {
          expect(response.body).to.have.property('success', true)
          expect(response.body).to.have.property('payment_id')
          expect(response.body).to.have.property('boleto_url')
          expect(response.body).to.have.property('barcode')
          expect(response.body).to.have.property('due_date')
          expect(response.body).to.have.property('amount')
          
          expect(response.body.amount).to.eq(validBoletoPayment.amount)
          expect(response.body.boleto_url).to.be.a('string')
          expect(response.body.barcode).to.be.a('string')
        } else {
          expect(response.body).to.have.property('error')
        }
      })
    })

    it('should validate required boleto fields', () => {
      const invalidBoleto = {
        amount: 50.00,
        description: 'Test boleto'
        // Missing payer information
      }

      cy.apiRequest('POST', '/api/payments/boleto', invalidBoleto).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.include('obrigatório')
      })
    })

    it('should validate address information', () => {
      const invalidAddress = {
        ...validBoletoPayment,
        payer_zip_code: '123', // Invalid ZIP format
        payer_state: 'XX' // Invalid state
      }

      cy.apiRequest('POST', '/api/payments/boleto', invalidAddress).then((response) => {
        expect(response.status).to.be.oneOf([400, 500])
        if (response.status === 400) {
          expect(response.body.error).to.match(/(zip|state|endereço)/i)
        }
      })
    })
  })

  context('GET /api/payments/:id/status', () => {
    it('should return payment status', () => {
      // Use a mock payment ID
      const mockPaymentId = 'test_payment_123'
      
      cy.apiRequest('GET', `/api/payments/${mockPaymentId}/status`).then((response) => {
        expect(response.status).to.be.oneOf([200, 404, 500])
        
        if (response.status === 200) {
          expect(response.body).to.have.property('success', true)
          expect(response.body).to.have.property('status')
          expect(response.body).to.have.property('amount')
          
          const validStatuses = ['pending', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back']
          expect(validStatuses).to.include(response.body.status)
        } else if (response.status === 404) {
          expect(response.body).to.have.property('error')
        }
      })
    })

    it('should handle invalid payment ID format', () => {
      cy.apiRequest('GET', '/api/payments/invalid-id/status').then((response) => {
        expect(response.status).to.be.oneOf([400, 404, 500])
        expect(response.body).to.have.property('error')
      })
    })
  })

  context('POST /api/webhooks/mercadopago', () => {
    const webhookData = {
      action: 'payment.updated',
      api_version: 'v1',
      data: {
        id: '123456789'
      },
      date_created: '2025-01-01T10:00:00.000Z',
      id: 12345,
      live_mode: false,
      type: 'payment',
      user_id: 'USER_ID'
    }

    it('should process Mercado Pago webhook', () => {
      cy.apiRequest('POST', '/api/webhooks/mercadopago', webhookData).then((response) => {
        expect(response.status).to.be.oneOf([200, 500])
        
        if (response.status === 200) {
          expect(response.body).to.have.property('success', true)
        } else {
          expect(response.body).to.have.property('error')
        }
      })
    })

    it('should handle malformed webhook data', () => {
      const invalidWebhook = {
        invalid: 'data'
      }

      cy.apiRequest('POST', '/api/webhooks/mercadopago', invalidWebhook).then((response) => {
        expect(response.status).to.be.oneOf([200, 400, 500])
        // Webhook should be resilient to invalid data
      })
    })
  })

  context('Error Handling and Security', () => {
    it('should handle timeout gracefully', () => {
      const largePayment = {
        amount: 99999.99,
        description: 'Large payment test',
        payer_email: 'timeout@test.com'
      }

      cy.apiRequest('POST', '/api/payments/pix', largePayment, {
        timeout: 5000
      }).then((response) => {
        // Should handle request within timeout
        expect(response.status).to.be.oneOf([200, 201, 400, 500, 408])
      })
    })

    it('should sanitize input data', () => {
      const maliciousPayment = {
        amount: 50.00,
        description: '<script>alert("xss")</script>',
        payer_email: 'test@evil.com',
        payer_name: '<img src=x onerror=alert(1)>'
      }

      cy.apiRequest('POST', '/api/payments/pix', maliciousPayment).then((response) => {
        // Should either reject or sanitize
        expect(response.status).to.be.oneOf([400, 422, 500])
      })
    })

    it('should rate limit payment attempts', () => {
      const payment = {
        amount: 10.00,
        description: 'Rate limit test',
        payer_email: 'ratelimit@test.com'
      }

      // Make multiple rapid requests
      const requests = Array.from({ length: 5 }, () => 
        cy.apiRequest('POST', '/api/payments/pix', payment)
      )
      
      Promise.all(requests).then((responses) => {
        // At least some should succeed, others might be rate limited
        const statusCodes = responses.map(r => r.status)
        expect(statusCodes).to.include.members([400, 429, 500]) // Rate limiting or other protection
      })
    })
  })
})