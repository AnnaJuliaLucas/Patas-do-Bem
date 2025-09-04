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

// Custom configuration for API testing
const API_BASE_URL = Cypress.env('API_BASE_URL') || 'http://127.0.0.1:5000'

// Add global commands for API testing
Cypress.Commands.add('apiRequest', (method, endpoint, body = null, options = {}) => {
  return cy.request({
    method,
    url: `${API_BASE_URL}${endpoint}`,
    body,
    failOnStatusCode: false,
    ...options
  })
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