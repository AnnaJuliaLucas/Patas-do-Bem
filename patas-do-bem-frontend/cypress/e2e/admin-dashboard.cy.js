/// <reference types="cypress" />

describe('📊 Admin Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin()
    
    // Mock dashboard API responses
    cy.intercept('GET', '/api/dashboard', { fixture: 'dashboard-data.json' }).as('getDashboard')
    cy.intercept('GET', '/api/donations', { 
      statusCode: 200, 
      body: { donations: [] } 
    }).as('getDonations')
    cy.intercept('GET', '/api/contact/messages', { 
      statusCode: 200, 
      body: { messages: [] } 
    }).as('getMessages')
  })

  context('Dashboard Loading and Display', () => {
    it('should load dashboard successfully', () => {
      cy.visit('/admin')
      
      // Wait for API calls
      cy.wait('@getDashboard')
      
      // Check main elements are visible
      cy.get('[data-cy="admin-header"]').should('be.visible')
      cy.get('[data-cy="dashboard-stats"]').should('be.visible')
      cy.get('[data-cy="admin-tabs"]').should('be.visible')
      
      // Verify dashboard tab is active by default
      cy.get('[data-cy="admin-tab-dashboard"]').should('have.class', 'data-[state=active]:bg-background')
    })

    it('should display statistics cards', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Check all statistics cards are present
      const expectedStats = [
        'Total Arrecadado',
        'Doações Mensais', 
        'Total de Doadores',
        'Rifas Ativas'
      ]
      
      expectedStats.forEach(stat => {
        cy.get('[data-cy="dashboard-stats"]').should('contain', stat)
      })
      
      // Verify values are displayed correctly
      cy.get('[data-cy="stat-total-amount"]').should('contain', 'R$ 15.650,75')
      cy.get('[data-cy="stat-monthly-recurring"]').should('contain', 'R$ 2.340,00')
      cy.get('[data-cy="stat-total-donors"]').should('contain', '87')
      cy.get('[data-cy="stat-active-raffles"]').should('contain', '3')
    })

    it('should display dashboard charts', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Wait for charts to load
      cy.waitForDashboardData()
      
      // Check charts are rendered
      cy.get('[data-cy="dashboard-charts"]').should('be.visible')
      cy.get('[data-cy="monthly-donations-chart"]').should('be.visible')
      cy.get('[data-cy="payment-methods-chart"]').should('be.visible')
      cy.get('[data-cy="raffles-performance-chart"]').should('be.visible')
      
      // Verify chart data is loaded
      cy.get('[data-cy="monthly-donations-chart"]').within(() => {
        cy.get('.recharts-wrapper').should('exist')
        cy.get('.recharts-area').should('exist')
      })
    })

    it('should display pending actions when available', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Check pending actions section
      cy.get('[data-cy="pending-actions"]').should('be.visible')
      cy.get('[data-cy="pending-actions"]').should('contain', 'Ações Pendentes')
      
      // Verify specific pending actions
      cy.get('[data-cy="pending-action-payments"]').should('contain', 'Pagamentos pendentes')
      cy.get('[data-cy="pending-action-payments"]').should('contain', '3')
      
      cy.get('[data-cy="pending-action-messages"]').should('contain', 'Novas mensagens')
      cy.get('[data-cy="pending-action-messages"]').should('contain', '5')
    })

    it('should display recent activity', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Check recent activity section
      cy.get('[data-cy="recent-activity"]').should('be.visible')
      cy.get('[data-cy="recent-activity"]').should('contain', 'Atividade Recente')
      
      // Verify activity items are displayed
      cy.get('[data-cy="activity-item"]').should('have.length.at.least', 1)
      
      // Check activity item structure
      cy.get('[data-cy="activity-item"]').first().within(() => {
        cy.get('[data-cy="activity-icon"]').should('be.visible')
        cy.get('[data-cy="activity-description"]').should('be.visible')
        cy.get('[data-cy="activity-date"]').should('be.visible')
      })
    })
  })

  context('Dashboard Interactions', () => {
    it('should refresh data when refresh button is clicked', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Click refresh button
      cy.get('[data-cy="dashboard-refresh"]').click()
      
      // Should make new API call
      cy.wait('@getDashboard')
      
      // Should show loading state briefly
      cy.get('[data-cy="dashboard-loading"]').should('be.visible')
      cy.get('[data-cy="dashboard-loading"]').should('not.exist')
    })

    it('should handle real-time updates', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Simulate real-time update
      cy.intercept('GET', '/api/dashboard', {
        ...cy.fixture('dashboard-data.json'),
        donations_summary: {
          total_amount: 16000.00,
          total_donors: 88
        }
      }).as('getDashboardUpdated')
      
      // Trigger update (could be automatic polling or manual refresh)
      cy.get('[data-cy="dashboard-refresh"]').click()
      cy.wait('@getDashboardUpdated')
      
      // Verify updated values
      cy.get('[data-cy="stat-total-amount"]').should('contain', 'R$ 16.000,00')
      cy.get('[data-cy="stat-total-donors"]').should('contain', '88')
    })
  })

  context('Tab Navigation', () => {
    it('should navigate between tabs correctly', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Test each tab
      const tabs = ['dashboard', 'raffles', 'donations', 'messages']
      
      tabs.forEach(tab => {
        cy.get(`[data-cy="admin-tab-${tab}"]`).click()
        cy.get(`[data-cy="tab-content-${tab}"]`).should('be.visible')
        
        // Verify correct tab is active
        cy.get(`[data-cy="admin-tab-${tab}"]`).should('have.class', 'data-[state=active]:bg-background')
      })
    })

    it('should maintain tab state on page refresh', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Navigate to raffles tab
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.get('[data-cy="tab-content-raffles"]').should('be.visible')
      
      // Refresh page
      cy.reload()
      cy.wait('@getDashboard')
      
      // Should still be on raffles tab
      cy.get('[data-cy="tab-content-raffles"]').should('be.visible')
      cy.get('[data-cy="admin-tab-raffles"]').should('have.class', 'data-[state=active]:bg-background')
    })
  })

  context('Error Handling', () => {
    it('should handle dashboard API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/dashboard', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getDashboardError')
      
      cy.visit('/admin')
      cy.wait('@getDashboardError')
      
      // Should show error message
      cy.get('[data-cy="dashboard-error"]').should('be.visible')
      cy.get('[data-cy="dashboard-error"]').should('contain', 'Erro ao carregar dados')
      
      // Should show retry button
      cy.get('[data-cy="dashboard-retry"]').should('be.visible')
    })

    it('should retry loading data after error', () => {
      // Mock initial error
      cy.intercept('GET', '/api/dashboard', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getDashboardError')
      
      cy.visit('/admin')
      cy.wait('@getDashboardError')
      
      // Mock successful retry
      cy.intercept('GET', '/api/dashboard', { fixture: 'dashboard-data.json' }).as('getDashboardSuccess')
      
      // Click retry
      cy.get('[data-cy="dashboard-retry"]').click()
      cy.wait('@getDashboardSuccess')
      
      // Should show dashboard normally
      cy.get('[data-cy="dashboard-stats"]').should('be.visible')
      cy.get('[data-cy="dashboard-error"]').should('not.exist')
    })

    it('should handle network timeouts', () => {
      // Mock timeout
      cy.intercept('GET', '/api/dashboard', {
        delay: 30000,
        statusCode: 408
      }).as('getDashboardTimeout')
      
      cy.visit('/admin')
      
      // Should show loading state
      cy.get('[data-cy="dashboard-loading"]').should('be.visible')
      
      // After timeout, should show error
      cy.get('[data-cy="dashboard-error"]', { timeout: 35000 }).should('be.visible')
      cy.get('[data-cy="dashboard-error"]').should('contain', 'timeout')
    })
  })

  context('Responsive Design', () => {
    const viewports = [
      { device: 'mobile', width: 375, height: 667 },
      { device: 'tablet', width: 768, height: 1024 },
      { device: 'desktop', width: 1280, height: 720 }
    ]

    viewports.forEach(({ device, width, height }) => {
      it(`should be responsive on ${device}`, () => {
        cy.viewport(width, height)
        cy.visit('/admin')
        cy.wait('@getDashboard')
        
        // Dashboard should be visible and properly laid out
        cy.get('[data-cy="admin-header"]').should('be.visible')
        cy.get('[data-cy="dashboard-stats"]').should('be.visible')
        
        // Check grid layout adapts to screen size
        if (device === 'mobile') {
          // On mobile, stats should stack vertically
          cy.get('[data-cy="stats-grid"]').should('have.class', 'grid-cols-1')
        } else if (device === 'tablet') {
          // On tablet, should show 2 columns
          cy.get('[data-cy="stats-grid"]').should('have.class', 'md:grid-cols-2')
        } else {
          // On desktop, should show 4 columns
          cy.get('[data-cy="stats-grid"]').should('have.class', 'lg:grid-cols-4')
        }
        
        // Charts should be responsive
        cy.get('[data-cy="dashboard-charts"]').within(() => {
          cy.get('.recharts-wrapper').should('exist')
          cy.get('.recharts-responsive-container').should('exist')
        })
      })
    })
  })

  context('Performance', () => {
    it('should load dashboard data efficiently', () => {
      // Track performance
      cy.visit('/admin')
      
      // Dashboard should load within reasonable time
      cy.get('[data-cy="dashboard-stats"]', { timeout: 5000 }).should('be.visible')
      cy.waitForDashboardData()
      
      // Verify all charts are rendered
      cy.get('[data-cy="dashboard-charts"]').within(() => {
        cy.get('.recharts-wrapper').should('have.length.at.least', 3)
      })
    })

    it('should handle large datasets in charts', () => {
      // Mock large dataset
      const largeDataset = {
        monthly_donations: Array.from({ length: 24 }, (_, i) => ({
          month: `2023-${String(i + 1).padStart(2, '0')}-01`,
          total_amount: Math.random() * 5000,
          donation_count: Math.floor(Math.random() * 50)
        }))
      }
      
      cy.intercept('GET', '/api/dashboard', {
        ...cy.fixture('dashboard-data.json'),
        ...largeDataset
      }).as('getLargeDashboard')
      
      cy.visit('/admin')
      cy.wait('@getLargeDashboard')
      cy.waitForDashboardData()
      
      // Charts should still render properly
      cy.get('[data-cy="monthly-donations-chart"]').should('be.visible')
      cy.get('[data-cy="monthly-donations-chart"]').within(() => {
        cy.get('.recharts-area').should('exist')
      })
    })
  })

  context('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Should be able to tab through interactive elements
      cy.get('body').tab()
      cy.focused().should('be.visible')
      
      // Tab through all tabs
      cy.get('[data-cy="admin-tab-dashboard"]').focus()
      cy.focused().should('have.attr', 'data-cy', 'admin-tab-dashboard')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-cy', 'admin-tab-raffles')
    })

    it('should have proper ARIA labels', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Check important elements have proper labels
      cy.get('[data-cy="dashboard-stats"]').should('have.attr', 'aria-label')
      cy.get('[data-cy="admin-tabs"]').should('have.attr', 'role', 'tablist')
      
      // Charts should have proper accessibility
      cy.get('[data-cy="dashboard-charts"]').within(() => {
        cy.get('[aria-label]').should('exist')
      })
    })
  })
})