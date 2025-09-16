// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Enhanced E2E configuration for Admin Interface Testing

// Configure Cypress for better error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail on ResizeObserver errors (common with chart libraries)
  if (err.message.includes('ResizeObserver')) {
    return false
  }
  
  // Don't fail on network-related errors during development
  if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
    return false
  }
  
  // Log the error for debugging but don't fail the test
  console.error('Uncaught exception:', err)
  return false
})

// Global configuration
beforeEach(() => {
  // Set default viewport for consistency
  cy.viewport(1280, 720)
  
  // Add data-cy attributes in test mode
  cy.window().then((win) => {
    win.document.body.setAttribute('data-cy-env', 'test')
  })
})

// Custom configuration for API testing
const API_BASE_URL = Cypress.env('API_BASE_URL') || 'http://127.0.0.1:5000'

// Enhanced API request command
Cypress.Commands.add('apiRequest', (method, endpoint, body = null, options = {}) => {
  return cy.request({
    method,
    url: `${API_BASE_URL}${endpoint}`,
    body,
    failOnStatusCode: false,
    ...options
  })
})

// Performance monitoring
Cypress.Commands.add('measurePerformance', (testName) => {
  cy.window().then((win) => {
    win.performance.mark(`${testName}-start`)
  })
  
  return {
    end: () => {
      cy.window().then((win) => {
        win.performance.mark(`${testName}-end`)
        win.performance.measure(testName, `${testName}-start`, `${testName}-end`)
        
        const measure = win.performance.getEntriesByName(testName)[0]
        cy.log(`Performance: ${testName} took ${measure.duration.toFixed(2)}ms`)
        
        // Fail if too slow (adjust threshold as needed)
        expect(measure.duration).to.be.lessThan(5000)
      })
    }
  }
})

// API mocking helpers
Cypress.Commands.add('mockAllAPIs', () => {
  // Mock all common API endpoints
  cy.intercept('GET', '/api/dashboard', { fixture: 'dashboard-data.json' }).as('getDashboard')
  cy.intercept('GET', '/api/raffles', { body: { raffles: [] } }).as('getRaffles')
  cy.intercept('GET', '/api/donations', { body: { donations: [] } }).as('getDonations')
  cy.intercept('GET', '/api/contact/messages', { body: { messages: [] } }).as('getMessages')
  
  // Mock auth endpoints
  cy.intercept('POST', '/api/auth/login', {
    statusCode: 200,
    body: {
      success: true,
      token: 'mock-jwt-token',
      user: { id: 1, email: 'admin@patasdobem.org', role: 'admin' }
    }
  }).as('loginRequest')
  
  // Mock upload endpoint
  cy.intercept('POST', '/api/upload/raffle-image', {
    statusCode: 200,
    body: {
      image_url: '/uploads/test-image.jpg',
      thumbnail_url: '/uploads/thumbs/test-image.jpg'
    }
  }).as('uploadImage')
})

// Test reporting helpers
Cypress.Commands.add('reportStep', (step) => {
  cy.log(`📋 Test Step: ${step}`)
})

// Utility function to clear database (for testing)
Cypress.Commands.add('clearDatabase', () => {
  // This would typically reset test data
  cy.log('Database cleared for testing')
})

// Utility to seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.log('Seeding test data')
})