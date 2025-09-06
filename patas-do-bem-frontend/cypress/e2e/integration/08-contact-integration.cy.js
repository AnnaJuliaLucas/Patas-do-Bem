/**
 * Contact Form Integration Tests
 * 
 * Tests for contact form frontend-backend integration
 */

describe('Contact Form Integration', () => {
  beforeEach(() => {
    // Ensure backend is running
    cy.request('GET', 'http://localhost:5000/api/config').should((response) => {
      expect(response.status).to.eq(200)
    })
    
    // Visit contact page
    cy.visit('http://localhost:5173/contato')
  })

  context('Contact Form UI and Submission', () => {
    it('should render contact form with all fields', () => {
      cy.get('h1').should('contain.text', 'Entre em Contato')
      
      // Check form fields
      cy.get('input[name="name"]').should('be.visible')
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="phone"]').should('be.visible')
      cy.get('input[name="subject"]').should('be.visible')
      cy.get('textarea[name="message"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible').should('contain.text', 'Enviar')
    })

    it('should show validation errors for empty required fields', () => {
      cy.get('button[type="submit"]').click()
      
      // Should show HTML5 validation for required fields
      cy.get('input[name="name"]:invalid').should('exist')
      cy.get('input[name="email"]:invalid').should('exist')
      cy.get('textarea[name="message"]:invalid').should('exist')
    })

    it('should submit contact form successfully with valid data', () => {
      // Intercept the API call
      cy.intercept('POST', 'http://localhost:5000/api/contact', {
        statusCode: 201,
        body: { message: 'Mensagem enviada com sucesso!' }
      }).as('submitContact')

      // Fill form
      cy.get('input[name="name"]').type('João Silva')
      cy.get('input[name="email"]').type('joao@test.com')
      cy.get('input[name="phone"]').type('(32) 99999-9999')
      cy.get('input[name="subject"]').type('Teste de contato')
      cy.get('textarea[name="message"]').type('Esta é uma mensagem de teste para verificar o funcionamento do sistema de contato.')
      
      // Submit form
      cy.get('button[type="submit"]').click()
      
      // Wait for API call
      cy.wait('@submitContact')
      
      // Should show success toast
      cy.get('[data-testid="toast-container"]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-testid="toast-container"]').should('contain.text', 'sucesso')
      
      // Form should be cleared after successful submission
      cy.get('input[name="name"]').should('have.value', '')
      cy.get('input[name="email"]').should('have.value', '')
      cy.get('textarea[name="message"]').should('have.value', '')
    })

    it('should handle API errors gracefully', () => {
      // Intercept the API call with error
      cy.intercept('POST', 'http://localhost:5000/api/contact', {
        statusCode: 400,
        body: { error: 'Dados inválidos' }
      }).as('submitContactError')

      // Fill form with valid data
      cy.get('input[name="name"]').type('João Silva')
      cy.get('input[name="email"]').type('joao@test.com')
      cy.get('textarea[name="message"]').type('Mensagem de teste')
      
      // Submit form
      cy.get('button[type="submit"]').click()
      
      // Wait for API call
      cy.wait('@submitContactError')
      
      // Should show error toast
      cy.get('[data-testid="toast-container"]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-testid="toast-container"]').should('contain.text', 'inválidos')
    })

    it('should show loading state during submission', () => {
      // Intercept with delay
      cy.intercept('POST', 'http://localhost:5000/api/contact', {
        statusCode: 201,
        body: { message: 'Mensagem enviada com sucesso!' },
        delay: 2000
      }).as('submitContactSlow')

      // Fill form
      cy.get('input[name="name"]').type('João Silva')
      cy.get('input[name="email"]').type('joao@test.com')
      cy.get('textarea[name="message"]').type('Mensagem de teste')
      
      // Submit form
      cy.get('button[type="submit"]').click()
      
      // Should show loading state
      cy.get('[data-testid="loading-overlay"]', { timeout: 1000 }).should('be.visible')
      
      // Wait for completion
      cy.wait('@submitContactSlow')
      
      // Loading should disappear
      cy.get('[data-testid="loading-overlay"]').should('not.exist')
    })
  })

  context('Contact Form with Real Backend', () => {
    it('should submit form to real backend and verify database storage', () => {
      // Fill form with test data
      const testData = {
        name: 'Cypress Test User',
        email: 'cypress@test.com',
        phone: '(32) 99999-9999',
        subject: 'Teste automatizado',
        message: 'Esta é uma mensagem de teste automatizada do Cypress.'
      }

      cy.get('input[name="name"]').type(testData.name)
      cy.get('input[name="email"]').type(testData.email)
      cy.get('input[name="phone"]').type(testData.phone)
      cy.get('input[name="subject"]').type(testData.subject)
      cy.get('textarea[name="message"]').type(testData.message)
      
      // Submit form
      cy.get('button[type="submit"]').click()
      
      // Wait for success message
      cy.get('[data-testid="toast-container"]', { timeout: 10000 }).should('contain.text', 'sucesso')
      
      // Verify message was stored in backend
      cy.request('GET', 'http://localhost:5000/api/contact/messages').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('messages')
        
        // Find our test message
        const testMessage = response.body.messages.find(msg => 
          msg.email === testData.email && msg.subject === testData.subject
        )
        
        expect(testMessage).to.exist
        expect(testMessage.name).to.eq(testData.name)
        expect(testMessage.message).to.eq(testData.message)
        expect(testMessage.status).to.eq('new')
      })
    })
  })

  context('Contact Form Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.get('input[name="name"]').focus()
      cy.focused().should('have.attr', 'name', 'name')
      
      cy.tab()
      cy.focused().should('have.attr', 'name', 'email')
      
      cy.tab()
      cy.focused().should('have.attr', 'name', 'phone')
      
      cy.tab()
      cy.focused().should('have.attr', 'name', 'subject')
      
      cy.tab()
      cy.focused().should('have.attr', 'name', 'message')
      
      cy.tab()
      cy.focused().should('have.attr', 'type', 'submit')
    })

    it('should have proper labels and ARIA attributes', () => {
      cy.get('label[for="name"]').should('exist')
      cy.get('input[name="name"]').should('have.attr', 'id', 'name')
      
      cy.get('label[for="email"]').should('exist')
      cy.get('input[name="email"]').should('have.attr', 'id', 'email')
      
      cy.get('label[for="message"]').should('exist')
      cy.get('textarea[name="message"]').should('have.attr', 'id', 'message')
    })
  })

  context('Contact Form Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport(375, 667) // iPhone SE
      
      // Form should still be visible and usable
      cy.get('input[name="name"]').should('be.visible')
      cy.get('input[name="email"]').should('be.visible')
      cy.get('textarea[name="message"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
      
      // Should be able to fill and submit
      cy.get('input[name="name"]').type('Mobile Test')
      cy.get('input[name="email"]').type('mobile@test.com')
      cy.get('textarea[name="message"]').type('Mobile test message')
      
      cy.get('button[type="submit"]').should('be.visible').click()
    })

    it('should work on tablet viewport', () => {
      cy.viewport(768, 1024) // iPad
      
      cy.get('input[name="name"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })
  })
})