/**
 * Apoie Page Integration Tests
 * 
 * Tests the integration between Apoie (donations) page and backend APIs
 */

describe('Apoie Page Integration Tests', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('GET', '/api/config', { fixture: 'config.json' }).as('getConfig')
    cy.intercept('POST', '/api/donations', { fixture: 'donation-response.json' }).as('createDonation')
    cy.intercept('GET', '/api/payments/config', { fixture: 'payment-config.json' }).as('getPaymentConfig')
  })

  context('Page Loading and Configuration', () => {
    it('should load donation plans from config API', () => {
      cy.visit('/apoie')
      cy.wait('@getConfig')

      // Verify page title
      cy.contains('Apoie Nossa Causa').should('be.visible')

      // Verify donation plans are displayed
      cy.get('[data-testid="donation-plan"]').should('have.length', 3)
      
      // Verify plan details
      cy.get('[data-testid="donation-plan"]').within(() => {
        cy.contains('R$').should('be.visible')
        cy.contains('Apoiador').should('be.visible')
        cy.contains('Protetor').should('be.visible') 
        cy.contains('Guardião').should('be.visible')
      })
    })

    it('should display fallback plans when config API fails', () => {
      cy.intercept('GET', '/api/config', { 
        statusCode: 500, 
        body: { error: 'Server error' } 
      }).as('getConfigError')

      cy.visit('/apoie')
      cy.wait('@getConfigError')

      // Should still show default plans
      cy.get('[data-testid="donation-plan"]').should('have.length', 3)
      cy.contains('R$ 20,00').should('be.visible')
      cy.contains('R$ 50,00').should('be.visible')
      cy.contains('R$ 100,00').should('be.visible')
    })
  })

  context('Form Interaction', () => {
    beforeEach(() => {
      cy.visit('/apoie')
      cy.wait('@getConfig')
    })

    it('should allow selecting donation type', () => {
      // Test recurring donation selection
      cy.get('[data-testid="recurring-donation"]').click()
      cy.get('[data-testid="recurring-donation"]').should('be.checked')

      // Test one-time donation selection
      cy.get('[data-testid="onetime-donation"]').click()
      cy.get('[data-testid="onetime-donation"]').should('be.checked')
    })

    it('should allow selecting donation plans', () => {
      // Select different plans
      cy.get('[data-testid="plan-20"]').click()
      cy.get('[data-testid="summary-amount"]').should('contain', '20,00')

      cy.get('[data-testid="plan-50"]').click()
      cy.get('[data-testid="summary-amount"]').should('contain', '50,00')

      cy.get('[data-testid="plan-100"]').click()
      cy.get('[data-testid="summary-amount"]').should('contain', '100,00')
    })

    it('should allow custom amount input', () => {
      cy.get('[data-testid="custom-plan"]').click()
      cy.get('[data-testid="custom-amount"]').type('75.50')
      
      cy.get('[data-testid="summary-amount"]').should('contain', '75,50')
      cy.get('[data-testid="summary-plan"]').should('contain', 'Valor Personalizado')
    })

    it('should validate required form fields', () => {
      // Try to submit without filling required fields
      cy.get('[data-testid="submit-button"]').click()

      // Should show validation error (via Toast)
      cy.get('[data-testid="error-toast"]').should('be.visible')
      cy.get('[data-testid="error-toast"]').should('contain', 'nome e email')
    })

    it('should validate email format', () => {
      cy.get('[data-testid="donor-name"]').type('João Silva')
      cy.get('[data-testid="donor-email"]').type('invalid-email')
      cy.get('[data-testid="submit-button"]').click()

      // Backend should reject invalid email
      cy.intercept('POST', '/api/donations', {
        statusCode: 400,
        body: { error: 'Formato de email inválido' }
      }).as('createDonationError')

      // Should show error message
      cy.get('[data-testid="error-toast"]').should('contain', 'email inválido')
    })
  })

  context('Donation Creation Flow', () => {
    beforeEach(() => {
      cy.visit('/apoie')
      cy.wait('@getConfig')
    })

    it('should create donation and show payment modal', () => {
      // Fill form with valid data
      cy.get('[data-testid="recurring-donation"]').click()
      cy.get('[data-testid="plan-50"]').click()
      cy.get('[data-testid="donor-name"]').type('João Silva')
      cy.get('[data-testid="donor-email"]').type('joao@email.com')
      cy.get('[data-testid="donor-phone"]').type('(32) 99999-9999')

      // Submit form
      cy.get('[data-testid="submit-button"]').click()

      // Wait for donation creation
      cy.wait('@createDonation')

      // Payment modal should appear
      cy.get('[data-testid="payment-modal"]').should('be.visible')
      cy.get('[data-testid="payment-modal"]').should('contain', 'R$ 50,00')
    })

    it('should handle donation creation errors', () => {
      cy.intercept('POST', '/api/donations', {
        statusCode: 400,
        body: { error: 'Dados inválidos' }
      }).as('createDonationError')

      cy.get('[data-testid="donor-name"]').type('João Silva')
      cy.get('[data-testid="donor-email"]').type('joao@email.com')
      cy.get('[data-testid="submit-button"]').click()

      cy.wait('@createDonationError')

      // Should show error toast
      cy.get('[data-testid="error-toast"]').should('be.visible')
      cy.get('[data-testid="error-toast"]').should('contain', 'inválidos')
    })

    it('should show global loading state during donation creation', () => {
      // Delay API response to test loading state
      cy.intercept('POST', '/api/donations', { 
        delay: 2000, 
        fixture: 'donation-response.json' 
      }).as('createDelayedDonation')

      cy.get('[data-testid="donor-name"]').type('João Silva')
      cy.get('[data-testid="donor-email"]').type('joao@email.com')
      cy.get('[data-testid="submit-button"]').click()

      // Should show loading overlay
      cy.get('[data-testid="loading-overlay"]').should('be.visible')

      cy.wait('@createDelayedDonation')

      // Loading should disappear
      cy.get('[data-testid="loading-overlay"]').should('not.exist')
    })
  })

  context('Summary and Display', () => {
    beforeEach(() => {
      cy.visit('/apoie')
      cy.wait('@getConfig')
    })

    it('should update summary when selection changes', () => {
      // Start with one-time donation
      cy.get('[data-testid="onetime-donation"]').click()
      cy.get('[data-testid="plan-20"]').click()

      cy.get('[data-testid="summary-type"]').should('contain', 'Única')
      cy.get('[data-testid="summary-amount"]').should('contain', '20,00')
      cy.get('[data-testid="summary-plan"]').should('contain', 'Apoiador')

      // Switch to recurring
      cy.get('[data-testid="recurring-donation"]').click()
      cy.get('[data-testid="summary-type"]').should('contain', 'Mensal')
    })

    it('should display impact information correctly', () => {
      cy.contains('Veja o Impacto da Sua Doação').should('be.visible')
      
      // Verify impact examples
      cy.contains('R$ 20').should('be.visible')
      cy.contains('Alimenta 5 animais').should('be.visible')
      
      cy.contains('R$ 50').should('be.visible')
      cy.contains('1 castração completa').should('be.visible')
      
      cy.contains('R$ 100').should('be.visible')
      cy.contains('tratamento veterinário').should('be.visible')
    })
  })

  context('Success Flow', () => {
    it('should handle successful payment completion', () => {
      cy.visit('/apoie')
      cy.wait('@getConfig')

      // Fill form
      cy.get('[data-testid="donor-name"]').type('João Silva')
      cy.get('[data-testid="donor-email"]').type('joao@email.com')
      cy.get('[data-testid="submit-button"]').click()

      cy.wait('@createDonation')

      // Simulate payment success
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('paymentSuccess', {
          detail: { paymentId: 'PAY123', status: 'completed' }
        }))
      })

      // Should show success message
      cy.get('[data-testid="success-toast"]').should('be.visible')
      cy.get('[data-testid="success-toast"]').should('contain', 'sucesso')

      // Form should be reset
      cy.get('[data-testid="donor-name"]').should('have.value', '')
      cy.get('[data-testid="donor-email"]').should('have.value', '')
    })
  })

  context('Responsive Design', () => {
    it('should work correctly on mobile devices', () => {
      cy.viewport('iphone-6')
      cy.visit('/apoie')
      cy.wait('@getConfig')

      // All sections should be visible and functional
      cy.get('[data-testid="donation-plan"]').should('be.visible')
      cy.get('[data-testid="donor-form"]').should('be.visible')
      cy.get('[data-testid="donation-summary"]').should('be.visible')
    })
  })
})