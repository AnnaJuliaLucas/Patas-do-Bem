/**
 * Admin Dashboard Integration Tests
 * 
 * Tests for admin dashboard frontend-backend integration
 */

describe('Admin Dashboard Integration', () => {
  beforeEach(() => {
    // Ensure backend is running
    cy.request('GET', 'http://localhost:5000/api/config').should((response) => {
      expect(response.status).to.eq(200)
    })
    
    // Visit admin page
    cy.visit('http://localhost:5173/admin')
  })

  context('Dashboard Loading and Data Display', () => {
    it('should load and display dashboard data', () => {
      // Wait for page to load
      cy.get('h1').should('contain.text', 'Painel Administrativo')
      
      // Should show loading state initially
      cy.get('[data-testid="loading-overlay"]', { timeout: 2000 }).should('exist')
      
      // Wait for data to load and loading to disappear
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // Should display dashboard sections
      cy.get('h2').should('contain.text', 'Resumo de Doações')
      cy.get('h2').should('contain.text', 'Resumo de Rifas')
      cy.get('h2').should('contain.text', 'Atividades Recentes')
    })

    it('should display donations summary with real data', () => {
      // Wait for data to load
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // Check donations summary section
      cy.get('h2').contains('Resumo de Doações').parent().within(() => {
        // Should show donation metrics
        cy.contains('Total de Doações').should('be.visible')
        cy.contains('Valor Total').should('be.visible')
        cy.contains('Doadores Únicos').should('be.visible')
        cy.contains('Recorrentes Mensais').should('be.visible')
        
        // Values should be numbers (can be 0)
        cy.get('[data-testid="total-donations"]').should('exist')
        cy.get('[data-testid="total-amount"]').should('exist')
        cy.get('[data-testid="total-donors"]').should('exist')
        cy.get('[data-testid="monthly-recurring"]').should('exist')
      })
    })

    it('should display raffles summary with real data', () => {
      // Wait for data to load
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // Check raffles summary section
      cy.get('h2').contains('Resumo de Rifas').parent().within(() => {
        // Should show raffle metrics
        cy.contains('Rifas Ativas').should('be.visible')
        cy.contains('Total de Rifas').should('be.visible')
        
        // Values should be numbers
        cy.get('[data-testid="active-raffles"]').should('exist')
        cy.get('[data-testid="total-raffles"]').should('exist')
      })
    })

    it('should display recent activities section', () => {
      // Wait for data to load
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // Check recent activities section
      cy.get('h2').contains('Atividades Recentes').should('be.visible')
      
      // Should have activities list (can be empty)
      cy.get('[data-testid="recent-activities"]').should('exist')
    })

    it('should handle API errors gracefully', () => {
      // Intercept dashboard API with error
      cy.intercept('GET', 'http://localhost:5000/api/dashboard', {
        statusCode: 500,
        body: { error: 'Erro interno do servidor' }
      }).as('dashboardError')

      // Reload page to trigger error
      cy.reload()
      
      // Wait for error
      cy.wait('@dashboardError')
      
      // Should show error toast or message
      cy.get('[data-testid="toast-container"]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-testid="toast-container"]').should('contain.text', 'erro')
    })
  })

  context('Dashboard Real Backend Integration', () => {
    it('should fetch and display real dashboard data from backend', () => {
      // Make direct API call to verify backend is working
      cy.request('GET', 'http://localhost:5000/api/dashboard').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('donations_summary')
        expect(response.body).to.have.property('raffles_summary')
        expect(response.body).to.have.property('recent_activity')
        expect(response.body).to.have.property('pending_actions')
      })

      // Wait for page to load data
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // Verify UI matches backend data
      cy.request('GET', 'http://localhost:5000/api/dashboard').then((response) => {
        const data = response.body
        
        // Check if donations data matches
        if (data.donations_summary.total_donations > 0) {
          cy.get('[data-testid="total-donations"]').should('not.contain.text', '0')
        }
        
        if (data.raffles_summary.active_raffles > 0) {
          cy.get('[data-testid="active-raffles"]').should('not.contain.text', '0')
        }
      })
    })

    it('should handle empty dashboard data gracefully', () => {
      // Even with no data, dashboard should render without errors
      cy.get('h1').should('contain.text', 'Painel Administrativo')
      
      // Wait for loading to complete
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // All sections should still be visible even if empty
      cy.get('h2').should('contain.text', 'Resumo de Doações')
      cy.get('h2').should('contain.text', 'Resumo de Rifas')
      cy.get('h2').should('contain.text', 'Atividades Recentes')
    })
  })

  context('Dashboard Navigation and Functionality', () => {
    it('should allow navigation to different sections', () => {
      // Wait for page to load
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // Check if navigation links exist and are clickable
      cy.get('nav').within(() => {
        // These links might exist based on the admin structure
        if (cy.get('a[href="/admin/donations"]').should('exist')) {
          cy.get('a[href="/admin/donations"]').should('be.visible')
        }
        if (cy.get('a[href="/admin/raffles"]').should('exist')) {
          cy.get('a[href="/admin/raffles"]').should('be.visible')
        }
      })
    })

    it('should refresh data when refresh button is clicked', () => {
      // Wait for initial load
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // Look for refresh button if it exists
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="refresh-dashboard"]').length > 0) {
          cy.get('[data-testid="refresh-dashboard"]').click()
          
          // Should show loading again
          cy.get('[data-testid="loading-overlay"]').should('exist')
          cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
        }
      })
    })
  })

  context('Dashboard Performance and UX', () => {
    it('should load dashboard data within reasonable time', () => {
      const startTime = Date.now()
      
      // Wait for data to load
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      cy.then(() => {
        const endTime = Date.now()
        const loadTime = endTime - startTime
        
        // Should load within 10 seconds
        expect(loadTime).to.be.lessThan(10000)
      })
    })

    it('should show proper loading states', () => {
      // On page load, should show loading
      cy.get('[data-testid="loading-overlay"]').should('exist')
      
      // Loading should disappear when data loads
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // Content should be visible after loading
      cy.get('h1').should('be.visible')
      cy.get('h2').should('be.visible')
    })
  })

  context('Dashboard Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport(375, 667) // iPhone SE
      
      // Wait for data to load
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      // Dashboard should be visible and usable on mobile
      cy.get('h1').should('be.visible')
      cy.get('h2').should('be.visible')
      
      // Summary cards should stack properly on mobile
      cy.get('[data-testid="donations-summary"]').should('be.visible')
      cy.get('[data-testid="raffles-summary"]').should('be.visible')
    })

    it('should work on tablet viewport', () => {
      cy.viewport(768, 1024) // iPad
      
      // Wait for data to load
      cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
      
      cy.get('h1').should('be.visible')
      cy.get('h2').should('be.visible')
    })
  })

  context('Dashboard Data Consistency', () => {
    it('should maintain data consistency between API and UI', () => {
      // Get data from API
      cy.request('GET', 'http://localhost:5000/api/dashboard').then((apiResponse) => {
        const apiData = apiResponse.body
        
        // Wait for UI to load
        cy.get('[data-testid="loading-overlay"]', { timeout: 10000 }).should('not.exist')
        
        // Compare API data with UI display
        cy.get('[data-testid="total-donations"]').invoke('text').then((uiText) => {
          const uiValue = parseInt(uiText.replace(/\D/g, '')) || 0
          expect(uiValue).to.eq(apiData.donations_summary.total_donations)
        })
        
        cy.get('[data-testid="active-raffles"]').invoke('text').then((uiText) => {
          const uiValue = parseInt(uiText.replace(/\D/g, '')) || 0
          expect(uiValue).to.eq(apiData.raffles_summary.active_raffles)
        })
      })
    })
  })
})