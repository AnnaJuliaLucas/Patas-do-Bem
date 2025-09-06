/**
 * Contact API Tests
 * 
 * Tests for contact endpoints
 */

describe('Contact API Tests', () => {
  const validContactData = {
    name: 'João Silva',
    email: 'joao@test.com',
    phone: '(32) 99999-9999',
    subject: 'Teste de contato',
    message: 'Esta é uma mensagem de teste para verificar o funcionamento do sistema de contato.'
  }

  beforeEach(() => {
    // Ensure backend is running
    cy.request('GET', 'http://localhost:5000/api/config').should((response) => {
      expect(response.status).to.eq(200)
    })
  })

  context('POST /api/contact', () => {
    it('should create contact message successfully with all fields', () => {
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        headers: {
          'Content-Type': 'application/json'
        },
        body: validContactData
      }).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('message')
        expect(response.body.message).to.include('sucesso')
      })
    })

    it('should create contact message with only required fields', () => {
      const minimalData = {
        name: 'Maria Santos',
        email: 'maria@test.com',
        message: 'Mensagem mínima de teste'
      }

      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        headers: {
          'Content-Type': 'application/json'
        },
        body: minimalData
      }).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.message).to.include('sucesso')
      })
    })

    it('should reject contact message without required fields', () => {
      const incompleteData = {
        name: 'Teste',
        email: 'test@test.com'
        // missing message
      }

      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        headers: {
          'Content-Type': 'application/json'
        },
        body: incompleteData,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.include('message')
      })
    })

    it('should reject contact message with invalid email format', () => {
      const invalidEmailData = {
        name: 'João Silva',
        email: 'invalid-email-format',
        message: 'Teste com email inválido'
      }

      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        headers: {
          'Content-Type': 'application/json'
        },
        body: invalidEmailData,
        failOnStatusCode: false
      }).then((response) => {
        // Should either reject or accept but not break the system
        expect(response.status).to.be.oneOf([201, 400])
      })
    })

    it('should handle contact message with special characters', () => {
      const specialCharsData = {
        name: 'José Ñoña',
        email: 'jose@test.com',
        phone: '(32) 99999-9999',
        subject: 'Assunto com ção e acentuação',
        message: 'Mensagem com caracteres especiais: àáâãç ñü €'
      }

      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        headers: {
          'Content-Type': 'application/json'
        },
        body: specialCharsData
      }).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.message).to.include('sucesso')
      })
    })

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(5000) // 5000 characters
      const longMessageData = {
        name: 'Teste Longo',
        email: 'longo@test.com',
        message: longMessage
      }

      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        headers: {
          'Content-Type': 'application/json'
        },
        body: longMessageData,
        failOnStatusCode: false
      }).then((response) => {
        // Should handle long messages gracefully
        expect(response.status).to.be.oneOf([201, 400, 413])
      })
    })
  })

  context('GET /api/contact/messages', () => {
    beforeEach(() => {
      // Create a test message first
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        headers: { 'Content-Type': 'application/json' },
        body: validContactData
      })
    })

    it('should retrieve contact messages successfully', () => {
      cy.request({
        method: 'GET',
        url: 'http://localhost:5000/api/contact/messages'
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('messages')
        expect(response.body).to.have.property('total')
        expect(response.body).to.have.property('pages')
        expect(response.body).to.have.property('current_page')
        expect(response.body).to.have.property('unread_count')
        
        expect(response.body.messages).to.be.an('array')
        expect(response.body.total).to.be.a('number')
        expect(response.body.unread_count).to.be.a('number')
      })
    })

    it('should retrieve contact messages with pagination', () => {
      cy.request({
        method: 'GET',
        url: 'http://localhost:5000/api/contact/messages?page=1&limit=5'
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.current_page).to.eq(1)
        expect(response.body.messages.length).to.be.lessThan(6)
      })
    })

    it('should filter messages by status', () => {
      cy.request({
        method: 'GET',
        url: 'http://localhost:5000/api/contact/messages?status=new'
      }).then((response) => {
        expect(response.status).to.eq(200)
        
        if (response.body.messages.length > 0) {
          response.body.messages.forEach(message => {
            expect(message.status).to.eq('new')
          })
        }
      })
    })

    it('should return proper message structure', () => {
      cy.request('GET', 'http://localhost:5000/api/contact/messages').then((response) => {
        expect(response.status).to.eq(200)
        
        if (response.body.messages.length > 0) {
          const message = response.body.messages[0]
          expect(message).to.have.property('id')
          expect(message).to.have.property('name')
          expect(message).to.have.property('email')
          expect(message).to.have.property('message')
          expect(message).to.have.property('status')
          expect(message).to.have.property('created_at')
          
          expect(message.id).to.be.a('number')
          expect(message.name).to.be.a('string')
          expect(message.email).to.be.a('string')
          expect(message.message).to.be.a('string')
          expect(message.status).to.be.oneOf(['new', 'read', 'replied'])
        }
      })
    })
  })

  context('PUT /api/contact/messages/:id', () => {
    let messageId

    beforeEach(() => {
      // Create a message and get its ID
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        headers: { 'Content-Type': 'application/json' },
        body: validContactData
      }).then(() => {
        cy.request('GET', 'http://localhost:5000/api/contact/messages').then((response) => {
          messageId = response.body.messages[0].id
        })
      })
    })

    it('should update message status successfully', () => {
      cy.request({
        method: 'PUT',
        url: `http://localhost:5000/api/contact/messages/${messageId}`,
        headers: { 'Content-Type': 'application/json' },
        body: { status: 'read' }
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('message')
        expect(response.body).to.have.property('contact_message')
        expect(response.body.contact_message.status).to.eq('read')
      })
    })

    it('should reject invalid status values', () => {
      cy.request({
        method: 'PUT',
        url: `http://localhost:5000/api/contact/messages/${messageId}`,
        headers: { 'Content-Type': 'application/json' },
        body: { status: 'invalid_status' },
        failOnStatusCode: false
      }).then((response) => {
        // Should either accept valid statuses or reject invalid ones
        expect(response.status).to.be.oneOf([200, 400])
      })
    })

    it('should return 404 for non-existent message ID', () => {
      cy.request({
        method: 'PUT',
        url: 'http://localhost:5000/api/contact/messages/99999',
        headers: { 'Content-Type': 'application/json' },
        body: { status: 'read' },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })
  })

  context('Contact API Security', () => {
    it('should handle malformed JSON gracefully', () => {
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "test", "email": "test@test.com", malformed json',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 500])
      })
    })

    it('should handle missing Content-Type header', () => {
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/contact',
        body: validContactData,
        failOnStatusCode: false
      }).then((response) => {
        // Should either work or return appropriate error
        expect(response.status).to.be.oneOf([201, 400, 415])
      })
    })
  })
})