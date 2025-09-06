/**
 * Rifas Page Integration Tests
 * 
 * Tests the integration between Rifas page components and backend APIs
 */

describe('Rifas Page Integration Tests', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('GET', '/api/config', { fixture: 'config.json' }).as('getConfig')
    cy.intercept('GET', '/api/raffles', { fixture: 'raffles.json' }).as('getRaffles')
  })

  context('Page Loading and API Integration', () => {
    it('should load raffles from API correctly', () => {
      cy.visit('/rifas')
      
      cy.wait(['@getConfig', '@getRaffles'])

      // Verify page title
      cy.contains('Rifas Solidárias').should('be.visible')

      // Verify raffles are displayed
      cy.get('[data-testid="raffle-card"]').should('have.length.at.least', 1)
      
      // Verify active raffles counter
      cy.get('[data-testid="raffles-count"]').should('contain', 'disponível')
    })

    it('should display loading state while fetching raffles', () => {
      // Delay API response to test loading state
      cy.intercept('GET', '/api/raffles', { 
        delay: 2000, 
        fixture: 'raffles.json' 
      }).as('getDelayedRaffles')

      cy.visit('/rifas')
      
      // Should show loading skeletons
      cy.get('[data-cy="raffle-loading"]').should('exist')
      
      cy.wait('@getDelayedRaffles')
      
      // Loading should be replaced with actual content
      cy.get('[data-cy="raffle-loading"]').should('not.exist')
      cy.get('[data-testid="raffle-card"]').should('be.visible')
    })

    it('should handle empty raffles list', () => {
      cy.intercept('GET', '/api/raffles', { 
        body: { raffles: [] } 
      }).as('getEmptyRaffles')

      cy.visit('/rifas')
      cy.wait('@getEmptyRaffles')

      // Should show empty state message
      cy.contains('Nenhuma rifa ativa no momento').should('be.visible')
      cy.contains('Entre em Contato').should('be.visible')
    })

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/raffles', { 
        statusCode: 500, 
        body: { error: 'Internal server error' } 
      }).as('getRafflesError')

      cy.visit('/rifas')
      cy.wait('@getRafflesError')

      // Should show error state or empty state
      cy.get('body').should('contain.text', 'Nenhuma rifa ativa')
    })
  })

  context('Raffle Card Content', () => {
    it('should display all raffle information from API', () => {
      cy.visit('/rifas')
      cy.wait('@getRaffles')

      cy.get('[data-testid="raffle-card"]').first().within(() => {
        // Title and description
        cy.get('[data-testid="raffle-title"]').should('not.be.empty')
        cy.get('[data-testid="raffle-description"]').should('not.be.empty')
        
        // Price and availability
        cy.get('[data-testid="raffle-price"]').should('contain', 'R$')
        cy.get('[data-testid="availability-badge"]').should('contain', 'disponíveis')
        
        // Progress bar
        cy.get('[data-testid="progress-bar"]').should('exist')
        cy.get('[data-testid="progress-text"]').should('contain', '/')
        
        // Action button
        cy.get('[data-testid="participate-button"]').should('be.visible')
      })
    })

    it('should show correct availability status colors', () => {
      cy.visit('/rifas')
      cy.wait('@getRaffles')

      cy.get('[data-testid="availability-badge"]').first().should('have.class', 'bg-green-100')
    })

    it('should display draw date when available', () => {
      cy.visit('/rifas')
      cy.wait('@getRaffles')

      // Check if any raffle has a draw date
      cy.get('[data-testid="raffle-card"]').then(($cards) => {
        const $cardWithDate = $cards.find(':contains("Sorteio:")').first()
        if ($cardWithDate.length > 0) {
          cy.wrap($cardWithDate).should('contain', 'Sorteio:')
        }
      })
    })
  })

  context('Navigation and Interaction', () => {
    it('should navigate to raffle details when participate button is clicked', () => {
      cy.visit('/rifas')
      cy.wait('@getRaffles')

      cy.get('[data-testid="participate-button"]').first().click()
      
      cy.url().should('match', /\/rifas\/\d+/)
    })

    it('should navigate to all raffles from home page link', () => {
      cy.visit('/')
      
      // Find and click "Ver Todas as Rifas" link if it exists
      cy.get('body').then(($body) => {
        if ($body.find(':contains("Ver Todas as Rifas")').length > 0) {
          cy.contains('Ver Todas as Rifas').click()
          cy.url().should('include', '/rifas')
        }
      })
    })
  })

  context('How It Works Section', () => {
    it('should display how it works section', () => {
      cy.visit('/rifas')
      
      cy.contains('Como Funciona').should('be.visible')
      
      // Verify all 4 steps are present
      cy.get('[data-testid="how-it-works"]').within(() => {
        cy.contains('1').should('be.visible')
        cy.contains('2').should('be.visible') 
        cy.contains('3').should('be.visible')
        cy.contains('4').should('be.visible')
        
        cy.contains('Escolha a Rifa').should('be.visible')
        cy.contains('Selecione Números').should('be.visible')
        cy.contains('Faça o Pagamento').should('be.visible')
        cy.contains('Aguarde o Sorteio').should('be.visible')
      })
    })
  })

  context('Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      cy.viewport('iphone-6')
      cy.visit('/rifas')
      cy.wait('@getRaffles')

      // Check mobile layout
      cy.get('[data-testid="raffle-card"]').should('be.visible')
      cy.get('[data-testid="how-it-works"]').should('be.visible')
    })

    it('should maintain grid layout on tablet', () => {
      cy.viewport('ipad-2')
      cy.visit('/rifas')
      cy.wait('@getRaffles')

      cy.get('[data-testid="raffle-card"]').should('be.visible')
    })
  })

  context('Performance', () => {
    it('should load page quickly', () => {
      const start = Date.now()
      
      cy.visit('/rifas')
      cy.wait('@getRaffles')
      
      cy.get('[data-testid="raffle-card"]').should('be.visible').then(() => {
        const loadTime = Date.now() - start
        expect(loadTime).to.be.lessThan(5000) // Should load within 5 seconds
      })
    })
  })
})