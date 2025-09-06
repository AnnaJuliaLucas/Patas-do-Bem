/**
 * Home Page Integration Tests
 * 
 * Tests the integration between Home page components and backend APIs
 */

describe('Home Page Integration Tests', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('GET', '/api/config', { fixture: 'config.json' }).as('getConfig')
    cy.intercept('GET', '/api/raffles', { fixture: 'raffles.json' }).as('getRaffles')
    cy.intercept('GET', '/api/donations/stats', { fixture: 'donation-stats.json' }).as('getDonationStats')
  })

  context('Initial Page Load', () => {
    it('should load and display data from all APIs', () => {
      cy.visit('/')

      // Wait for API calls to complete
      cy.wait(['@getConfig', '@getRaffles', '@getDonationStats'])

      // Verify organization name is displayed
      cy.contains('Patas do Bem').should('be.visible')

      // Verify impact stats are displayed with real data
      cy.get('[data-testid="impact-stats"]').should('exist')
      cy.get('[data-testid="impact-stats"]').within(() => {
        // Should show actual donation amounts, not loading skeletons
        cy.contains('R$').should('be.visible')
      })

      // Verify active raffles section
      cy.get('[data-testid="active-raffles"]').should('exist')
    })

    it('should handle API loading states correctly', () => {
      // Delay API responses to test loading states
      cy.intercept('GET', '/api/donations/stats', { 
        delay: 2000, 
        fixture: 'donation-stats.json' 
      }).as('getDelayedStats')

      cy.visit('/')

      // Should show loading skeletons initially
      cy.get('[data-cy="loading-skeleton"]').should('exist')

      // Wait for delayed API call
      cy.wait('@getDelayedStats')

      // Loading skeletons should be replaced with actual data
      cy.get('[data-cy="loading-skeleton"]').should('not.exist')
      cy.contains('R$').should('be.visible')
    })

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/donations/stats', { 
        statusCode: 500, 
        body: { error: 'Internal server error' } 
      }).as('getStatsError')

      cy.visit('/')

      cy.wait('@getStatsError')

      // Should show fallback content when stats API fails
      cy.get('[data-testid="impact-stats"]').within(() => {
        cy.contains('...').should('be.visible')
      })
    })
  })

  context('Raffles Integration', () => {
    it('should display active raffles from API', () => {
      cy.visit('/')
      cy.wait('@getRaffles')

      cy.get('[data-testid="active-raffles"]').within(() => {
        cy.get('[data-testid="raffle-card"]').should('have.length.at.least', 1)
        
        // Verify raffle card contains API data
        cy.get('[data-testid="raffle-card"]').first().within(() => {
          cy.get('[data-testid="raffle-title"]').should('not.be.empty')
          cy.get('[data-testid="raffle-price"]').should('contain', 'R$')
          cy.get('[data-testid="raffle-available"]').should('contain', 'disponíveis')
        })
      })
    })

    it('should navigate to raffle details when clicked', () => {
      cy.visit('/')
      cy.wait('@getRaffles')

      cy.get('[data-testid="raffle-card"]').first().within(() => {
        cy.get('[data-testid="participate-button"]').click()
      })

      // Should navigate to raffle details page
      cy.url().should('include', '/rifas/')
    })
  })

  context('Dynamic Content', () => {
    it('should display mission statement from config API', () => {
      cy.visit('/')
      cy.wait('@getConfig')

      // Hero section should show mission from API
      cy.get('[data-testid="hero-section"]').within(() => {
        cy.contains('missão').should('be.visible')
      })
    })

    it('should display activities from config API', () => {
      cy.visit('/')
      cy.wait('@getConfig')

      cy.get('[data-testid="activities-section"]').should('exist')
      cy.get('[data-testid="activity-card"]').should('have.length.at.least', 1)
    })
  })

  context('Responsive Design', () => {
    it('should work correctly on mobile devices', () => {
      cy.viewport('iphone-6')
      cy.visit('/')
      
      cy.wait(['@getConfig', '@getRaffles', '@getDonationStats'])

      // Check that mobile layout works
      cy.get('[data-testid="impact-stats"]').should('be.visible')
      cy.get('[data-testid="active-raffles"]').should('be.visible')
    })
  })
})