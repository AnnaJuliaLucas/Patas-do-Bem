// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- Custom commands for Patas do Bem testing --

// Enhanced login command for admin authentication
Cypress.Commands.add('loginAsAdmin', (email = 'admin@patasdobem.org', password = 'admin123') => {
  cy.session([email, password], () => {
    cy.visit('/login')
    
    // Fill login form
    cy.get('[data-cy="login-email"]').type(email)
    cy.get('[data-cy="login-password"]').type(password)
    cy.get('[data-cy="login-submit"]').click()
    
    // Wait for redirect to admin panel
    cy.url().should('include', '/admin')
    cy.get('[data-cy="admin-header"]').should('be.visible')
    
    // Verify token is stored
    cy.window().its('localStorage.adminToken').should('exist')
  })
})

// Create a test raffle
Cypress.Commands.add('createTestRaffle', (raffleData = {}) => {
  const defaultRaffle = {
    title: 'Rifa Teste E2E',
    description: 'Rifa criada automaticamente para testes',
    ticket_price: '10.00',
    total_numbers: '100',
    draw_date: '2024-12-31'
  }
  
  const raffle = { ...defaultRaffle, ...raffleData }
  
  cy.loginAsAdmin()
  cy.visit('/admin')
  
  // Navigate to raffles tab
  cy.get('[data-cy="admin-tab-raffles"]').click()
  
  // Fill raffle form
  cy.get('[data-cy="raffle-title"]').clear().type(raffle.title)
  cy.get('[data-cy="raffle-price"]').clear().type(raffle.ticket_price)
  cy.get('[data-cy="raffle-numbers"]').clear().type(raffle.total_numbers)
  cy.get('[data-cy="raffle-date"]').clear().type(raffle.draw_date)
  cy.get('[data-cy="raffle-description"]').clear().type(raffle.description)
  
  // Submit form
  cy.get('[data-cy="raffle-submit"]').click()
  
  // Verify success message
  cy.get('[data-cy="raffle-message"]').should('contain', 'sucesso')
  
  return cy.wrap(raffle)
})

// Upload test image
Cypress.Commands.add('uploadTestImage', (fileName, selector) => {
  cy.fixture(fileName, 'base64').then(fileContent => {
    cy.get(selector).then(input => {
      const testFile = new File([Cypress.Blob.base64StringToBlob(fileContent)], fileName, {
        type: 'image/jpeg'
      })
      
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(testFile)
      
      input[0].files = dataTransfer.files
      input[0].dispatchEvent(new Event('change', { bubbles: true }))
    })
  })
})

// Wait for dashboard data to load
Cypress.Commands.add('waitForDashboardData', () => {
  cy.get('[data-cy="dashboard-stats"]').should('be.visible')
  cy.get('[data-cy="dashboard-charts"]').should('be.visible')
})

// Test form validation
Cypress.Commands.add('testFormValidation', (fieldSelector, validations) => {
  validations.forEach(({ input, shouldBeValid, errorMessage }) => {
    cy.get(fieldSelector).clear()
    if (input) {
      cy.get(fieldSelector).type(input)
    }
    cy.get(fieldSelector).blur()
    
    if (shouldBeValid) {
      cy.get(fieldSelector).parent().should('not.contain', errorMessage || 'erro')
    } else {
      cy.get(fieldSelector).parent().should('contain', errorMessage || 'erro')
    }
  })
})

// Command to fill payment form
Cypress.Commands.add('fillPaymentForm', (paymentData) => {
  cy.get('[data-cy=donor-name]').type(paymentData.name)
  cy.get('[data-cy=donor-email]').type(paymentData.email)
  if (paymentData.phone) {
    cy.get('[data-cy=donor-phone]').type(paymentData.phone)
  }
})

// Command to select payment method
Cypress.Commands.add('selectPaymentMethod', (method) => {
  cy.get(`[data-cy=payment-method-${method}]`).click()
})

// Command to complete PIX payment
Cypress.Commands.add('completePIXPayment', (amount) => {
  cy.selectPaymentMethod('pix')
  cy.get('[data-cy=confirm-payment]').click()
  cy.get('[data-cy=pix-qr-code]').should('be.visible')
  cy.get('[data-cy=pix-copy-paste]').should('contain', 'Pix copia e cola')
})

// Command to fill credit card form
Cypress.Commands.add('fillCreditCardForm', (cardData) => {
  cy.get('[data-cy=card-number]').type(cardData.number)
  cy.get('[data-cy=card-name]').type(cardData.name)
  cy.get('[data-cy=card-expiry]').type(cardData.expiry)
  cy.get('[data-cy=card-cvv]').type(cardData.cvv)
})

// Command to select raffle numbers
Cypress.Commands.add('selectRaffleNumbers', (numbers) => {
  numbers.forEach(number => {
    cy.get(`[data-cy=raffle-number-${number}]`).click()
  })
})

// Command to wait for API response
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201, 202])
  })
})