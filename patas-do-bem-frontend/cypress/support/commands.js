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

// Login command for admin authentication
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/admin')
  cy.get('[data-cy=username]').type('admin')
  cy.get('[data-cy=password]').type('password')
  cy.get('[data-cy=login-submit]').click()
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