/**
 * Dynamic Header and Footer Integration Tests
 * 
 * Tests for dynamic header and footer content from backend
 */

describe('Dynamic Header and Footer Integration', () => {
  beforeEach(() => {
    // Ensure backend is running
    cy.request('GET', 'http://localhost:5000/api/config').should((response) => {
      expect(response.status).to.eq(200)
    })
  })

  context('Dynamic Header Content', () => {
    it('should display dynamic organization name and location in header', () => {
      // Get config from API first
      cy.request('GET', 'http://localhost:5000/api/config').then((response) => {
        const config = response.body
        
        // Visit home page
        cy.visit('http://localhost:5173/')
        
        // Wait for header to load
        cy.get('header').should('be.visible')
        
        // Check organization name
        if (config.organization_name) {
          cy.get('header').should('contain.text', config.organization_name)
        } else {
          cy.get('header').should('contain.text', 'Patas do Bem')
        }
        
        // Check location
        if (config.location) {
          cy.get('header').should('contain.text', config.location)
        } else {
          cy.get('header').should('contain.text', 'Santos Dumont/MG')
        }
      })
    })

    it('should display header content consistently across all pages', () => {
      const pages = [
        { path: '/', name: 'Home' },
        { path: '/sobre', name: 'Sobre' },
        { path: '/rifas', name: 'Rifas' },
        { path: '/contato', name: 'Contato' },
        { path: '/admin', name: 'Admin' }
      ]
      
      pages.forEach((page) => {
        cy.visit(`http://localhost:5173${page.path}`)
        
        // Wait for page to load
        cy.get('header').should('be.visible')
        
        // Header should contain organization info
        cy.get('header').should('contain.text', 'Patas do Bem')
        cy.get('header').should('contain.text', 'Santos Dumont/MG')
        
        // Navigation should be present
        cy.get('nav').should('be.visible')
      })
    })

    it('should handle missing config data gracefully', () => {
      // Intercept config API with minimal data
      cy.intercept('GET', 'http://localhost:5000/api/config', {
        statusCode: 200,
        body: {} // Empty config
      }).as('emptyConfig')
      
      cy.visit('http://localhost:5173/')
      cy.wait('@emptyConfig')
      
      // Should show default values
      cy.get('header').should('contain.text', 'Patas do Bem')
      cy.get('header').should('contain.text', 'Santos Dumont/MG')
    })

    it('should display navigation menu correctly', () => {
      cy.visit('http://localhost:5173/')
      
      // Wait for header
      cy.get('header nav').should('be.visible')
      
      // Check navigation links
      cy.get('nav a[href="/"]').should('contain.text', 'Início')
      cy.get('nav a[href="/sobre"]').should('contain.text', 'Sobre')
      cy.get('nav a[href="/rifas"]').should('contain.text', 'Rifas')
      cy.get('nav a[href="/contato"]').should('contain.text', 'Contato')
    })

    it('should be responsive on mobile devices', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.visit('http://localhost:5173/')
      
      // Header should be visible on mobile
      cy.get('header').should('be.visible')
      
      // Organization name should still be visible
      cy.get('header').should('contain.text', 'Patas do Bem')
      
      // Check if mobile menu exists (hamburger menu)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="mobile-menu-button"]').length > 0) {
          cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
        }
      })
    })
  })

  context('Dynamic Footer Content', () => {
    it('should display dynamic organization information in footer', () => {
      // Get config from API first
      cy.request('GET', 'http://localhost:5000/api/config').then((response) => {
        const config = response.body
        
        cy.visit('http://localhost:5173/')
        
        // Wait for footer to load
        cy.get('footer').should('be.visible')
        
        // Check organization name in copyright
        const currentYear = new Date().getFullYear()
        if (config.organization_name) {
          cy.get('footer').should('contain.text', `© ${currentYear} ${config.organization_name}`)
        } else {
          cy.get('footer').should('contain.text', `© ${currentYear} Associação Patas do Bem`)
        }
      })
    })

    it('should display contact information from backend config', () => {
      cy.request('GET', 'http://localhost:5000/api/config').then((response) => {
        const config = response.body
        
        cy.visit('http://localhost:5173/')
        cy.get('footer').should('be.visible')
        
        // Check contact information if available
        if (config.phone) {
          cy.get('footer').should('contain.text', config.phone)
        }
        
        if (config.email) {
          cy.get('footer').should('contain.text', config.email)
        }
        
        if (config.address) {
          cy.get('footer').should('contain.text', config.address)
        }
      })
    })

    it('should display social media links if configured', () => {
      cy.request('GET', 'http://localhost:5000/api/config').then((response) => {
        const config = response.body
        
        cy.visit('http://localhost:5173/')
        cy.get('footer').should('be.visible')
        
        // Check social media links if available
        if (config.instagram_url) {
          cy.get('footer a[href*="instagram"]').should('exist')
        }
        
        if (config.facebook_url) {
          cy.get('footer a[href*="facebook"]').should('exist')
        }
        
        if (config.whatsapp_number) {
          cy.get('footer a[href*="whatsapp"]').should('exist')
        }
      })
    })

    it('should show footer consistently across all pages', () => {
      const pages = [
        { path: '/', name: 'Home' },
        { path: '/sobre', name: 'Sobre' },
        { path: '/rifas', name: 'Rifas' },
        { path: '/contato', name: 'Contato' }
      ]
      
      pages.forEach((page) => {
        cy.visit(`http://localhost:5173${page.path}`)
        
        // Wait for footer to load
        cy.get('footer').should('be.visible')
        
        // Footer should contain organization info
        const currentYear = new Date().getFullYear()
        cy.get('footer').should('contain.text', `© ${currentYear}`)
        cy.get('footer').should('contain.text', 'Patas do Bem')
      })
    })

    it('should handle missing footer config gracefully', () => {
      // Intercept config API with minimal data
      cy.intercept('GET', 'http://localhost:5000/api/config', {
        statusCode: 200,
        body: {} // Empty config
      }).as('emptyFooterConfig')
      
      cy.visit('http://localhost:5173/')
      cy.wait('@emptyFooterConfig')
      
      // Should show default footer content
      cy.get('footer').should('be.visible')
      const currentYear = new Date().getFullYear()
      cy.get('footer').should('contain.text', `© ${currentYear} Associação Patas do Bem`)
    })

    it('should be responsive on mobile devices', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.visit('http://localhost:5173/')
      
      // Footer should be visible and properly formatted on mobile
      cy.get('footer').should('be.visible')
      
      // Copyright should be visible
      const currentYear = new Date().getFullYear()
      cy.get('footer').should('contain.text', `© ${currentYear}`)
      
      // Contact info should stack properly on mobile
      cy.get('footer').should('contain.text', 'Patas do Bem')
    })
  })

  context('Header and Footer Loading States', () => {
    it('should show loading states while fetching config', () => {
      // Intercept config with delay
      cy.intercept('GET', 'http://localhost:5000/api/config', {
        statusCode: 200,
        body: {
          organization_name: 'Test Organization',
          location: 'Test Location'
        },
        delay: 2000
      }).as('slowConfig')
      
      cy.visit('http://localhost:5173/')
      
      // Should show loading overlay or skeleton
      cy.get('[data-testid="loading-overlay"]', { timeout: 1000 }).should('exist')
      
      cy.wait('@slowConfig')
      
      // Loading should disappear
      cy.get('[data-testid="loading-overlay"]', { timeout: 3000 }).should('not.exist')
      
      // Content should be updated
      cy.get('header').should('contain.text', 'Test Organization')
    })

    it('should handle config API errors gracefully', () => {
      // Intercept config with error
      cy.intercept('GET', 'http://localhost:5000/api/config', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('configError')
      
      cy.visit('http://localhost:5173/')
      cy.wait('@configError')
      
      // Should show default content even with API error
      cy.get('header').should('be.visible')
      cy.get('footer').should('be.visible')
      
      // Should show default organization name
      cy.get('header').should('contain.text', 'Patas do Bem')
    })
  })

  context('Header and Footer Real Backend Integration', () => {
    it('should fetch and display real config data', () => {
      // Make direct API call to verify data
      cy.request('GET', 'http://localhost:5000/api/config').then((response) => {
        expect(response.status).to.eq(200)
        const config = response.body
        
        cy.visit('http://localhost:5173/')
        
        // Wait for page to load
        cy.get('header').should('be.visible')
        cy.get('footer').should('be.visible')
        
        // Verify header content matches API data
        if (config.organization_name) {
          cy.get('header').should('contain.text', config.organization_name)
        }
        
        if (config.location) {
          cy.get('header').should('contain.text', config.location)
        }
        
        // Verify footer content matches API data
        const currentYear = new Date().getFullYear()
        if (config.organization_name) {
          cy.get('footer').should('contain.text', `© ${currentYear} ${config.organization_name}`)
        }
      })
    })

    it('should update content when config changes', () => {
      // First, get initial config
      cy.visit('http://localhost:5173/')
      cy.get('header').should('contain.text', 'Patas do Bem')
      
      // Then simulate config change
      cy.intercept('GET', 'http://localhost:5000/api/config', {
        statusCode: 200,
        body: {
          organization_name: 'Updated Organization',
          location: 'Updated Location',
          email: 'updated@test.com',
          phone: '(11) 99999-9999'
        }
      }).as('updatedConfig')
      
      // Reload page to get updated config
      cy.reload()
      cy.wait('@updatedConfig')
      
      // Should show updated content
      cy.get('header').should('contain.text', 'Updated Organization')
      cy.get('header').should('contain.text', 'Updated Location')
    })
  })
})