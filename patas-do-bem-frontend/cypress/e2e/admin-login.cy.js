/// <reference types="cypress" />

describe('🔐 Admin Login E2E Tests', () => {
  beforeEach(() => {
    // Clear any existing sessions
    cy.clearAllSessionStorage()
    cy.clearAllLocalStorage()
    cy.clearAllCookies()
  })

  context('Login Page', () => {
    it('should display login form elements', () => {
      cy.visit('/login')
      
      // Check form elements exist
      cy.get('[data-cy="login-email"]').should('be.visible')
      cy.get('[data-cy="login-password"]').should('be.visible')
      cy.get('[data-cy="login-submit"]').should('be.visible')
      
      // Check initial state
      cy.get('[data-cy="login-submit"]').should('be.enabled')
      cy.get('[data-cy="login-error"]').should('not.exist')
    })

    it('should show validation errors for empty fields', () => {
      cy.visit('/login')
      
      // Try to submit empty form
      cy.get('[data-cy="login-submit"]').click()
      
      // Should show validation errors
      cy.get('[data-cy="login-email"]').then($input => {
        expect($input[0].validationMessage).to.not.be.empty
      })
    })

    it('should show validation errors for invalid email format', () => {
      cy.visit('/login')
      
      // Enter invalid email
      cy.get('[data-cy="login-email"]').type('invalid-email')
      cy.get('[data-cy="login-password"]').type('password123')
      cy.get('[data-cy="login-submit"]').click()
      
      // Should show email validation error
      cy.get('[data-cy="login-email"]').then($input => {
        expect($input[0].validationMessage).to.contain('email')
      })
    })
  })

  context('Authentication Flow', () => {
    it('should successfully login with valid credentials', () => {
      cy.visit('/login')
      
      // Fill valid credentials
      cy.get('[data-cy="login-email"]').type('admin@patasdobem.org')
      cy.get('[data-cy="login-password"]').type('admin123')
      
      // Mock successful login response
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: 'admin@patasdobem.org',
            role: 'admin'
          }
        }
      }).as('loginRequest')
      
      // Submit form
      cy.get('[data-cy="login-submit"]').click()
      
      // Wait for API call
      cy.wait('@loginRequest')
      
      // Should redirect to admin panel
      cy.url().should('include', '/admin')
      
      // Should store token
      cy.window().its('localStorage.adminToken').should('equal', 'mock-jwt-token')
    })

    it('should show error message for invalid credentials', () => {
      cy.visit('/login')
      
      // Fill invalid credentials
      cy.get('[data-cy="login-email"]').type('wrong@email.com')
      cy.get('[data-cy="login-password"]').type('wrongpassword')
      
      // Mock failed login response
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          success: false,
          error: 'Credenciais inválidas'
        }
      }).as('loginRequest')
      
      // Submit form
      cy.get('[data-cy="login-submit"]').click()
      
      // Wait for API call
      cy.wait('@loginRequest')
      
      // Should show error message
      cy.get('[data-cy="login-error"]').should('be.visible')
      cy.get('[data-cy="login-error"]').should('contain', 'Credenciais inválidas')
      
      // Should not redirect
      cy.url().should('include', '/login')
      
      // Should not store token
      cy.window().its('localStorage.adminToken').should('not.exist')
    })

    it('should handle network errors gracefully', () => {
      cy.visit('/login')
      
      // Fill credentials
      cy.get('[data-cy="login-email"]').type('admin@patasdobem.org')
      cy.get('[data-cy="login-password"]').type('admin123')
      
      // Mock network error
      cy.intercept('POST', '/api/auth/login', {
        forceNetworkError: true
      }).as('loginRequest')
      
      // Submit form
      cy.get('[data-cy="login-submit"]').click()
      
      // Wait for API call
      cy.wait('@loginRequest')
      
      // Should show network error
      cy.get('[data-cy="login-error"]').should('be.visible')
      cy.get('[data-cy="login-error"]').should('contain', 'Erro de conexão')
    })
  })

  context('Session Management', () => {
    it('should redirect authenticated users away from login page', () => {
      // Set existing token
      cy.window().then(win => {
        win.localStorage.setItem('adminToken', 'existing-token')
      })
      
      // Try to visit login page
      cy.visit('/login')
      
      // Should redirect to admin panel
      cy.url().should('include', '/admin')
    })

    it('should logout and redirect to login', () => {
      // Login first
      cy.loginAsAdmin()
      cy.visit('/admin')
      
      // Verify we're logged in
      cy.get('[data-cy="admin-header"]').should('be.visible')
      
      // Logout
      cy.get('[data-cy="admin-logout"]').click()
      
      // Should redirect to login
      cy.url().should('include', '/login')
      
      // Should clear token
      cy.window().its('localStorage.adminToken').should('not.exist')
    })

    it('should handle expired tokens', () => {
      // Set expired token
      cy.window().then(win => {
        win.localStorage.setItem('adminToken', 'expired-token')
      })
      
      // Mock 401 response for authenticated requests
      cy.intercept('GET', '/api/dashboard', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('dashboardRequest')
      
      // Visit admin page
      cy.visit('/admin')
      
      // Should redirect to login after token validation fails
      cy.url().should('include', '/login')
      
      // Should show session expired message
      cy.get('[data-cy="session-expired"]').should('be.visible')
    })
  })

  context('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      cy.visit('/login')
      
      // Password should be hidden initially
      cy.get('[data-cy="login-password"]').should('have.attr', 'type', 'password')
      
      // Click toggle button
      cy.get('[data-cy="password-toggle"]').click()
      
      // Password should be visible
      cy.get('[data-cy="login-password"]').should('have.attr', 'type', 'text')
      
      // Click toggle button again
      cy.get('[data-cy="password-toggle"]').click()
      
      // Password should be hidden again
      cy.get('[data-cy="login-password"]').should('have.attr', 'type', 'password')
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
        cy.visit('/login')
        
        // Form should be visible and properly sized
        cy.get('[data-cy="login-form"]').should('be.visible')
        cy.get('[data-cy="login-email"]').should('be.visible')
        cy.get('[data-cy="login-password"]').should('be.visible')
        cy.get('[data-cy="login-submit"]').should('be.visible')
        
        // Check form doesn't overflow
        cy.get('[data-cy="login-form"]').then($form => {
          expect($form.width()).to.be.at.most(width - 40) // 20px margin on each side
        })
      })
    })
  })

  context('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/login')
      
      // Tab through form elements
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-cy', 'login-email')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-cy', 'login-password')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-cy', 'login-submit')
    })

    it('should have proper labels and ARIA attributes', () => {
      cy.visit('/login')
      
      // Check form has proper labels
      cy.get('[data-cy="login-email"]').should('have.attr', 'aria-label')
      cy.get('[data-cy="login-password"]').should('have.attr', 'aria-label')
      
      // Check form has proper structure
      cy.get('[data-cy="login-form"]').should('have.attr', 'role', 'form')
    })
  })
})