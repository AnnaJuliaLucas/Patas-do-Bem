/**
 * RifaDetalhes Page Integration Tests
 * 
 * Tests the integration between RifaDetalhes page and backend APIs
 */

describe('RifaDetalhes Page Integration Tests', () => {
  const raffleId = 1

  beforeEach(() => {
    // Intercept API calls
    cy.intercept('GET', '/api/config', { fixture: 'config.json' }).as('getConfig')
    cy.intercept('GET', `/api/raffles/${raffleId}`, { fixture: 'raffle-details.json' }).as('getRaffleDetails')
    cy.intercept('GET', `/api/raffles/${raffleId}/numbers`, { fixture: 'raffle-numbers.json' }).as('getRaffleNumbers')
    cy.intercept('POST', `/api/raffles/${raffleId}/tickets`, { fixture: 'raffle-purchase.json' }).as('purchaseTickets')
  })

  context('Page Loading and Data Display', () => {
    it('should load raffle details correctly', () => {
      cy.visit(`/rifas/${raffleId}`)
      
      cy.wait(['@getConfig', '@getRaffleDetails', '@getRaffleNumbers'])

      // Verify breadcrumb
      cy.contains('Rifas').should('be.visible')
      cy.contains('/').should('be.visible')

      // Verify raffle header information
      cy.get('[data-testid="raffle-header"]').within(() => {
        cy.contains('Rifa Solidária').should('be.visible')
        cy.contains('R$ 10,00').should('be.visible')
        cy.contains('65 disponíveis').should('be.visible')
      })

      // Verify number selection card is present
      cy.get('[data-testid="number-selection-card"]').should('be.visible')
      cy.get('[data-testid="purchase-form"]').should('be.visible')
    })

    it('should display loading state initially', () => {
      // Delay API responses
      cy.intercept('GET', `/api/raffles/${raffleId}`, { 
        delay: 2000, 
        fixture: 'raffle-details.json' 
      }).as('getDelayedRaffle')

      cy.visit(`/rifas/${raffleId}`)

      // Should show loading skeletons
      cy.get('[data-cy="loading-skeleton"]').should('exist')

      cy.wait('@getDelayedRaffle')

      // Loading should be replaced with content
      cy.get('[data-cy="loading-skeleton"]').should('not.exist')
      cy.contains('Selecione Seus Números').should('be.visible')
    })

    it('should handle raffle not found', () => {
      cy.intercept('GET', `/api/raffles/${raffleId}`, { 
        statusCode: 404,
        body: { error: 'Raffle not found' }
      }).as('getRaffleNotFound')

      cy.visit(`/rifas/${raffleId}`)

      cy.wait('@getRaffleNotFound')

      // Should show not found message
      cy.contains('Rifa não encontrada').should('be.visible')
      cy.contains('Voltar para Rifas').should('be.visible')
    })

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', `/api/raffles/${raffleId}`, { 
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getRaffleError')

      cy.visit(`/rifas/${raffleId}`)

      cy.wait('@getRaffleError')

      // Should show error toast
      cy.get('[data-testid="error-toast"]').should('be.visible')
      cy.get('[data-testid="error-toast"]').should('contain', 'Erro ao carregar')
    })
  })

  context('Number Selection', () => {
    beforeEach(() => {
      cy.visit(`/rifas/${raffleId}`)
      cy.wait(['@getConfig', '@getRaffleDetails', '@getRaffleNumbers'])
    })

    it('should display number grid with correct states', () => {
      cy.get('[data-testid="numbers-grid"]').should('be.visible')

      // Should have 100 numbers (based on fixture)
      cy.get('[data-testid="numbers-grid"] button').should('have.length', 100)

      // Check different number states
      cy.get('[data-testid="number-1"]').should('be.enabled') // Available
      cy.get('[data-testid="number-1"]').should('have.class', 'bg-white')

      // Sold numbers should be disabled and red
      cy.get('[data-testid="number-50"]').should('be.disabled')
      cy.get('[data-testid="number-50"]').should('have.class', 'bg-red-100')
    })

    it('should allow selecting available numbers', () => {
      // Click on available number
      cy.get('[data-testid="number-1"]').click()

      // Number should be selected (orange background)
      cy.get('[data-testid="number-1"]').should('have.class', 'bg-orange-600')

      // Selected numbers summary should appear
      cy.contains('Números selecionados:').should('be.visible')
      cy.contains('1 número').should('be.visible')
      cy.contains('01').should('be.visible')
    })

    it('should allow deselecting numbers', () => {
      // Select a number
      cy.get('[data-testid="number-1"]').click()
      cy.get('[data-testid="number-1"]').should('have.class', 'bg-orange-600')

      // Deselect the same number
      cy.get('[data-testid="number-1"]').click()
      cy.get('[data-testid="number-1"]').should('not.have.class', 'bg-orange-600')

      // Summary should disappear
      cy.contains('Números selecionados:').should('not.exist')
    })

    it('should select random numbers correctly', () => {
      // Click random selection button
      cy.contains('3 Aleatórios').click()

      // Should have 3 selected numbers
      cy.get('.bg-orange-600').should('have.length', 3)
      cy.contains('3 números').should('be.visible')
    })

    it('should clear selected numbers', () => {
      // Select some numbers first
      cy.get('[data-testid="number-1"]').click()
      cy.get('[data-testid="number-2"]').click()

      // Clear selection
      cy.contains('Limpar').click()

      // No numbers should be selected
      cy.get('.bg-orange-600').should('have.length', 0)
      cy.contains('Números selecionados:').should('not.exist')
    })
  })

  context('Purchase Form', () => {
    beforeEach(() => {
      cy.visit(`/rifas/${raffleId}`)
      cy.wait(['@getConfig', '@getRaffleDetails', '@getRaffleNumbers'])
      
      // Select a number first
      cy.get('[data-testid="number-1"]').click()
    })

    it('should update total amount correctly', () => {
      cy.get('[data-testid="purchase-form"]').within(() => {
        cy.contains('Total:').parent().should('contain', 'R$ 10,00')
      })

      // Select another number
      cy.get('[data-testid="number-2"]').click()

      cy.get('[data-testid="purchase-form"]').within(() => {
        cy.contains('Total:').parent().should('contain', 'R$ 20,00')
      })
    })

    it('should validate required fields', () => {
      cy.get('[data-testid="purchase-button"]').click()

      // Should show validation error
      cy.get('[data-testid="error-toast"]').should('be.visible')
      cy.get('[data-testid="error-toast"]').should('contain', 'nome e email')
    })

    it('should complete purchase flow successfully', () => {
      // Fill form
      cy.get('#buyer-name').type('João Silva')
      cy.get('#buyer-email').type('joao@email.com')
      cy.get('#buyer-phone').type('(32) 99999-9999')

      // Select payment method (PIX is default)
      cy.get('[value="pix"]').should('be.checked')

      // Submit purchase
      cy.get('[data-testid="purchase-button"]').click()

      cy.wait('@purchaseTickets')

      // Should show success message
      cy.get('[data-testid="success-toast"]').should('be.visible')
      cy.get('[data-testid="success-toast"]').should('contain', 'reservados com sucesso')

      // Form should be cleared
      cy.get('#buyer-name').should('have.value', '')
      cy.get('#buyer-email').should('have.value', '')
      cy.get('#buyer-phone').should('have.value', '')

      // Selection should be cleared
      cy.get('.bg-orange-600').should('have.length', 0)
    })

    it('should handle purchase errors', () => {
      cy.intercept('POST', `/api/raffles/${raffleId}/tickets`, {
        statusCode: 400,
        body: { error: 'Números já reservados: [1]' }
      }).as('purchaseError')

      // Fill form
      cy.get('#buyer-name').type('João Silva')
      cy.get('#buyer-email').type('joao@email.com')

      // Submit purchase
      cy.get('[data-testid="purchase-button"]').click()

      cy.wait('@purchaseError')

      // Should show error message
      cy.get('[data-testid="error-toast"]').should('be.visible')
      cy.get('[data-testid="error-toast"]').should('contain', 'já reservados')
    })

    it('should disable purchase button when no numbers selected', () => {
      // Clear any selected numbers
      cy.contains('Limpar').click()

      cy.get('[data-testid="purchase-button"]').should('be.disabled')
    })
  })

  context('Payment Methods', () => {
    beforeEach(() => {
      cy.visit(`/rifas/${raffleId}`)
      cy.wait(['@getConfig', '@getRaffleDetails', '@getRaffleNumbers'])
      cy.get('[data-testid="number-1"]').click()
    })

    it('should allow selecting different payment methods', () => {
      // PIX should be selected by default
      cy.get('[value="pix"]').should('be.checked')
      cy.contains('Pagamento instantâneo').should('be.visible')

      // Select credit card
      cy.get('[value="credit_card"]').click()
      cy.get('[value="credit_card"]').should('be.checked')
      cy.contains('Débito automático').should('be.visible')

      // Select boleto
      cy.get('[value="boleto"]').click()
      cy.get('[value="boleto"]').should('be.checked')
      cy.contains('Vencimento em 3 dias').should('be.visible')
    })
  })

  context('Raffle Information Display', () => {
    beforeEach(() => {
      cy.visit(`/rifas/${raffleId}`)
      cy.wait(['@getConfig', '@getRaffleDetails', '@getRaffleNumbers'])
    })

    it('should display raffle progress correctly', () => {
      // Progress should show sold vs total
      cy.contains('35/100').should('be.visible')

      // Progress bar should be visible
      cy.get('.bg-gradient-to-r').should('be.visible')
    })

    it('should display raffle information correctly', () => {
      cy.contains('R$ 10,00 por número').should('be.visible')
      cy.contains('100 números').should('be.visible')
    })
  })

  context('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-6')
      cy.visit(`/rifas/${raffleId}`)
      cy.wait(['@getConfig', '@getRaffleDetails', '@getRaffleNumbers'])

      // All main sections should be visible
      cy.get('[data-testid="number-selection-card"]').should('be.visible')
      cy.get('[data-testid="purchase-form"]').should('be.visible')

      // Number grid should be scrollable on mobile
      cy.get('[data-testid="numbers-grid"]').should('be.visible')
    })
  })

  context('Navigation', () => {
    it('should navigate back to raffles list', () => {
      cy.visit(`/rifas/${raffleId}`)
      
      cy.contains('Rifas').click()
      
      cy.url().should('include', '/rifas')
      cy.url().should('not.include', `/${raffleId}`)
    })
  })
})