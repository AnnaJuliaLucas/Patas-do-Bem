/**
 * E2E Tests - Donation Flow
 * 
 * Testa o fluxo completo de doação da aplicação
 */

describe('Donation Flow E2E Tests', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('GET', '/api/config', { fixture: 'config.json' }).as('getConfig')
    cy.intercept('GET', '/api/payments/config', { fixture: 'payment-config.json' }).as('getPaymentConfig')
  })

  context('Navigation to Donation Page', () => {
    it('should navigate to donation page from homepage', () => {
      cy.visit('/')
      
      // From hero section
      cy.contains('Apoie Nossa Causa').click()
      cy.url().should('include', '/apoie')
      
      // Page should load
      cy.contains('Apoie a Causa').should('be.visible')
    })

    it('should navigate from header CTA button', () => {
      cy.visit('/')
      
      cy.contains('Doar Agora').click()
      cy.url().should('include', '/apoie')
    })

    it('should navigate from final CTA section', () => {
      cy.visit('/')
      
      cy.contains('Doar Mensalmente').click()
      cy.url().should('include', '/apoie')
    })
  })

  context('Donation Page UI', () => {
    beforeEach(() => {
      cy.visit('/apoie')
      cy.wait('@getConfig')
    })

    it('should display donation page elements', () => {
      // Page title
      cy.contains('Apoie a Causa').should('be.visible')
      
      // Donation type selector
      cy.contains('Tipo de Doação').should('be.visible')
      cy.get('[data-cy=donation-type-recurring]').should('be.visible')
      cy.get('[data-cy=donation-type-one-time]').should('be.visible')
      
      // Donation plans
      cy.contains('Apoiador').should('be.visible')
      cy.contains('Protetor').should('be.visible')
      cy.contains('Guardião').should('be.visible')
      cy.contains('R$ 20').should('be.visible')
      cy.contains('R$ 50').should('be.visible')
      cy.contains('R$ 100').should('be.visible')
      
      // Form fields
      cy.get('[data-cy=donor-name]').should('be.visible')
      cy.get('[data-cy=donor-email]').should('be.visible')
      cy.get('[data-cy=donor-phone]').should('be.visible')
      
      // Submit button
      cy.contains('Fazer Doação').should('be.visible')
    })

    it('should highlight popular plan', () => {
      // R$ 50 plan should be marked as popular
      cy.get('[data-cy=plan-50]').should('contain', 'Popular')
      cy.get('[data-cy=plan-50]').should('be.checked')
    })

    it('should allow custom amount selection', () => {
      cy.get('[data-cy=plan-custom]').click()
      cy.get('[data-cy=custom-amount]').should('be.visible')
      cy.get('[data-cy=custom-amount]').type('75')
      cy.get('[data-cy=donation-amount]').should('contain', 'R$ 75')
    })

    it('should switch between recurring and one-time donations', () => {
      // Default should be recurring
      cy.get('[data-cy=donation-type-recurring]').should('be.checked')
      
      // Switch to one-time
      cy.get('[data-cy=donation-type-one-time]').click()
      cy.contains('Doação Única').should('be.visible')
      
      // Switch back to recurring
      cy.get('[data-cy=donation-type-recurring]').click()
      cy.contains('Doação Mensal').should('be.visible')
    })
  })

  context('Form Validation', () => {
    beforeEach(() => {
      cy.visit('/apoie')
      cy.wait('@getConfig')
    })

    it('should validate required fields', () => {
      // Try to submit empty form
      cy.contains('Fazer Doação').click()
      
      // Should show validation errors
      cy.contains('Nome é obrigatório').should('be.visible')
      cy.contains('Email é obrigatório').should('be.visible')
    })

    it('should validate email format', () => {
      cy.fillDonationForm({
        name: 'João Silva',
        email: 'invalid-email',
        phone: '(32) 99999-9999'
      })
      
      cy.contains('Fazer Doação').click()
      cy.contains('Email inválido').should('be.visible')
    })

    it('should validate custom amount', () => {
      cy.get('[data-cy=plan-custom]').click()
      cy.get('[data-cy=custom-amount]').type('0')
      
      cy.fillDonationForm({
        name: 'João Silva',
        email: 'joao@test.com'
      })
      
      cy.contains('Fazer Doação').click()
      cy.contains('Valor deve ser maior que zero').should('be.visible')
    })

    it('should accept valid form data', () => {
      cy.fillDonationForm({
        name: 'Maria Santos',
        email: 'maria@test.com',
        phone: '(32) 99999-8888'
      })
      
      // Form should be valid
      cy.contains('Fazer Doação').click()
      
      // Should open payment modal
      cy.get('[data-cy=payment-modal]').should('be.visible')
    })
  })

  context('Payment Method Selection', () => {
    beforeEach(() => {
      cy.visit('/apoie')
      cy.wait(['@getConfig', '@getPaymentConfig'])
      
      // Fill form and proceed to payment
      cy.fillDonationForm({
        name: 'Carlos Test',
        email: 'carlos@test.com',
        phone: '(32) 99999-7777'
      })
      cy.contains('Fazer Doação').click()
    })

    it('should display payment method options', () => {
      cy.get('[data-cy=payment-modal]').should('be.visible')
      
      // Payment methods
      cy.get('[data-cy=payment-method-pix]').should('be.visible')
      cy.get('[data-cy=payment-method-credit-card]').should('be.visible')
      cy.get('[data-cy=payment-method-boleto]').should('be.visible')
      
      // Method descriptions
      cy.contains('Pagamento instantâneo').should('be.visible')
      cy.contains('Cartão de crédito').should('be.visible')
      cy.contains('Boleto bancário').should('be.visible')
    })

    it('should show different forms for each payment method', () => {
      // PIX method
      cy.selectPaymentMethod('pix')
      cy.contains('Confirmar Pagamento PIX').should('be.visible')
      
      // Credit card method
      cy.selectPaymentMethod('credit-card')
      cy.get('[data-cy=card-number]').should('be.visible')
      cy.get('[data-cy=card-name]').should('be.visible')
      cy.get('[data-cy=card-expiry]').should('be.visible')
      cy.get('[data-cy=card-cvv]').should('be.visible')
      
      // Boleto method
      cy.selectPaymentMethod('boleto')
      cy.get('[data-cy=cpf]').should('be.visible')
      cy.contains('Endereço para cobrança').should('be.visible')
    })
  })

  context('PIX Payment Flow', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/payments/pix', { fixture: 'pix-payment-success.json' }).as('createPixPayment')
      
      cy.visit('/apoie')
      cy.wait('@getConfig')
      
      cy.fillDonationForm({
        name: 'Ana PIX Test',
        email: 'ana@test.com'
      })
      cy.contains('Fazer Doação').click()
    })

    it('should complete PIX payment flow', () => {
      cy.selectPaymentMethod('pix')
      cy.contains('Confirmar Pagamento PIX').click()
      
      cy.wait('@createPixPayment')
      
      // Should show PIX payment details
      cy.get('[data-cy=pix-qr-code]').should('be.visible')
      cy.get('[data-cy=pix-copy-paste]').should('be.visible')
      cy.contains('Escaneie o QR Code').should('be.visible')
      cy.contains('Ou copie e cole o código').should('be.visible')
      
      // Payment info
      cy.contains('R$ 50,00').should('be.visible')
      cy.contains('Vencimento: 30 minutos').should('be.visible')
    })

    it('should allow copying PIX code', () => {
      cy.selectPaymentMethod('pix')
      cy.contains('Confirmar Pagamento PIX').click()
      cy.wait('@createPixPayment')
      
      cy.get('[data-cy=copy-pix-button]').click()
      cy.contains('Código copiado!').should('be.visible')
    })

    it('should show payment status polling', () => {
      cy.intercept('GET', '/api/payments/*/status', { 
        body: { success: true, status: 'approved', amount: 50.00 }
      }).as('getPaymentStatus')
      
      cy.selectPaymentMethod('pix')
      cy.contains('Confirmar Pagamento PIX').click()
      cy.wait('@createPixPayment')
      
      // Should start polling payment status
      cy.wait('@getPaymentStatus')
      cy.contains('Aguardando pagamento').should('be.visible')
    })
  })

  context('Credit Card Payment Flow', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/payments/credit-card', { fixture: 'card-payment-success.json' }).as('createCardPayment')
      
      cy.visit('/apoie')
      cy.wait('@getConfig')
      
      cy.fillDonationForm({
        name: 'Pedro Card Test',
        email: 'pedro@test.com'
      })
      cy.contains('Fazer Doação').click()
    })

    it('should complete credit card payment flow', () => {
      cy.selectPaymentMethod('credit-card')
      
      cy.fillCreditCardForm({
        number: '4111111111111111',
        name: 'Pedro Test',
        expiry: '12/25',
        cvv: '123'
      })
      
      cy.contains('Confirmar Pagamento').click()
      cy.wait('@createCardPayment')
      
      // Should show success message
      cy.contains('Pagamento aprovado!').should('be.visible')
      cy.contains('Obrigado pela sua doação').should('be.visible')
    })

    it('should validate credit card fields', () => {
      cy.selectPaymentMethod('credit-card')
      
      // Try to submit without filling card details
      cy.contains('Confirmar Pagamento').click()
      
      cy.contains('Número do cartão é obrigatório').should('be.visible')
      cy.contains('Nome no cartão é obrigatório').should('be.visible')
    })

    it('should show installment options for higher amounts', () => {
      // Go back and select higher amount
      cy.get('[data-cy=close-modal]').click()
      cy.get('[data-cy=plan-100]').click()
      cy.contains('Fazer Doação').click()
      
      cy.selectPaymentMethod('credit-card')
      
      // Should show installment options
      cy.get('[data-cy=installments]').should('be.visible')
      cy.get('[data-cy=installments]').select('2')
      cy.contains('2x de R$ 50,00').should('be.visible')
    })
  })

  context('Recurring Subscription Flow', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/payments/recurring', { fixture: 'recurring-payment-success.json' }).as('createRecurringPayment')
      
      cy.visit('/apoie')
      cy.wait('@getConfig')
      
      // Ensure recurring donation is selected
      cy.get('[data-cy=donation-type-recurring]').click()
      
      cy.fillDonationForm({
        name: 'Lucia Recurring Test',
        email: 'lucia@test.com'
      })
      cy.contains('Fazer Doação').click()
    })

    it('should create monthly recurring subscription', () => {
      cy.selectPaymentMethod('credit-card')
      
      cy.fillCreditCardForm({
        number: '4111111111111111',
        name: 'Lucia Test',
        expiry: '12/26',
        cvv: '456'
      })
      
      // Should show recurring payment info
      cy.contains('Doação mensal de R$ 50,00').should('be.visible')
      cy.contains('Primeira cobrança hoje').should('be.visible')
      cy.contains('Próxima cobrança em 30 dias').should('be.visible')
      
      cy.contains('Confirmar Assinatura').click()
      cy.wait('@createRecurringPayment')
      
      // Should show subscription success
      cy.contains('Assinatura criada com sucesso!').should('be.visible')
      cy.contains('Sua doação mensal foi configurada').should('be.visible')
      cy.contains('Você pode gerenciar sua assinatura').should('be.visible')
    })

    it('should allow subscription management', () => {
      cy.selectPaymentMethod('credit-card')
      cy.fillCreditCardForm({
        number: '4111111111111111',
        name: 'Lucia Test',
        expiry: '12/26',
        cvv: '456'
      })
      
      cy.contains('Confirmar Assinatura').click()
      cy.wait('@createRecurringPayment')
      
      // Should have link to manage subscription
      cy.contains('Gerenciar Assinatura').should('be.visible')
      cy.contains('Gerenciar Assinatura').click()
      
      // Should navigate to user area or show management options
      cy.url().should('match', /(\/usuario|\/assinatura)/)
    })
  })

  context('Boleto Payment Flow', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/payments/boleto', { fixture: 'boleto-payment-success.json' }).as('createBoletoPayment')
      
      cy.visit('/apoie')
      cy.wait('@getConfig')
      
      cy.fillDonationForm({
        name: 'Roberto Boleto Test',
        email: 'roberto@test.com'
      })
      cy.contains('Fazer Doação').click()
    })

    it('should complete boleto payment flow', () => {
      cy.selectPaymentMethod('boleto')
      
      // Fill required fields for boleto
      cy.get('[data-cy=cpf]').type('12345678901')
      cy.get('[data-cy=zip-code]').type('36240000')
      cy.get('[data-cy=street]').type('Rua Principal')
      cy.get('[data-cy=number]').type('123')
      cy.get('[data-cy=neighborhood]').type('Centro')
      
      cy.contains('Gerar Boleto').click()
      cy.wait('@createBoletoPayment')
      
      // Should show boleto details
      cy.contains('Boleto gerado com sucesso!').should('be.visible')
      cy.get('[data-cy=boleto-barcode]').should('be.visible')
      cy.get('[data-cy=boleto-due-date]').should('be.visible')
      cy.contains('Vencimento em 3 dias').should('be.visible')
      
      // Download/print options
      cy.contains('Baixar Boleto').should('be.visible')
      cy.contains('Imprimir').should('be.visible')
    })

    it('should validate boleto required fields', () => {
      cy.selectPaymentMethod('boleto')
      
      cy.contains('Gerar Boleto').click()
      
      // Should show validation errors
      cy.contains('CPF é obrigatório').should('be.visible')
      cy.contains('CEP é obrigatório').should('be.visible')
      cy.contains('Endereço é obrigatório').should('be.visible')
    })

    it('should copy boleto barcode', () => {
      cy.selectPaymentMethod('boleto')
      
      cy.get('[data-cy=cpf]').type('12345678901')
      cy.get('[data-cy=zip-code]').type('36240000')
      cy.get('[data-cy=street]').type('Rua Principal')
      cy.get('[data-cy=number]').type('123')
      cy.get('[data-cy=neighborhood]').type('Centro')
      
      cy.contains('Gerar Boleto').click()
      cy.wait('@createBoletoPayment')
      
      cy.get('[data-cy=copy-barcode-button]').click()
      cy.contains('Código de barras copiado!').should('be.visible')
    })
  })

  context('Payment Error Handling', () => {
    it('should handle PIX payment failure', () => {
      cy.intercept('POST', '/api/payments/pix', { 
        statusCode: 400,
        body: { error: 'Erro ao processar pagamento PIX' }
      }).as('createPixPaymentError')
      
      cy.visit('/apoie')
      cy.wait('@getConfig')
      
      cy.fillDonationForm({
        name: 'Error Test',
        email: 'error@test.com'
      })
      cy.contains('Fazer Doação').click()
      
      cy.selectPaymentMethod('pix')
      cy.contains('Confirmar Pagamento PIX').click()
      cy.wait('@createPixPaymentError')
      
      cy.contains('Erro ao processar pagamento').should('be.visible')
      cy.contains('Tente novamente').should('be.visible')
    })

    it('should handle network timeout', () => {
      cy.intercept('POST', '/api/payments/credit-card', { delay: 10000 }).as('slowPayment')
      
      cy.visit('/apoie')
      cy.wait('@getConfig')
      
      cy.fillDonationForm({
        name: 'Timeout Test',
        email: 'timeout@test.com'
      })
      cy.contains('Fazer Doação').click()
      
      cy.selectPaymentMethod('credit-card')
      cy.fillCreditCardForm({
        number: '4111111111111111',
        name: 'Timeout Test',
        expiry: '12/25',
        cvv: '123'
      })
      
      cy.contains('Confirmar Pagamento').click()
      
      // Should show loading state
      cy.contains('Processando pagamento').should('be.visible')
      cy.get('[data-cy=payment-loading]').should('be.visible')
    })

    it('should allow retry after error', () => {
      cy.intercept('POST', '/api/payments/pix', { 
        statusCode: 500,
        body: { error: 'Erro interno do servidor' }
      }).as('serverError')
      
      cy.visit('/apoie')
      cy.wait('@getConfig')
      
      cy.fillDonationForm({
        name: 'Retry Test',
        email: 'retry@test.com'
      })
      cy.contains('Fazer Doação').click()
      
      cy.selectPaymentMethod('pix')
      cy.contains('Confirmar Pagamento PIX').click()
      cy.wait('@serverError')
      
      // Should show error and retry option
      cy.contains('Erro interno do servidor').should('be.visible')
      cy.contains('Tentar Novamente').should('be.visible')
      
      // Mock successful retry
      cy.intercept('POST', '/api/payments/pix', { fixture: 'pix-payment-success.json' }).as('retrySuccess')
      
      cy.contains('Tentar Novamente').click()
      cy.wait('@retrySuccess')
      
      cy.get('[data-cy=pix-qr-code]').should('be.visible')
    })
  })

  context('Success and Confirmation', () => {
    it('should show donation success page', () => {
      cy.intercept('POST', '/api/payments/pix', { fixture: 'pix-payment-success.json' }).as('successPayment')
      cy.intercept('GET', '/api/payments/*/status', { 
        body: { success: true, status: 'approved', amount: 50.00 }
      }).as('approvedPayment')
      
      cy.visit('/apoie')
      cy.wait('@getConfig')
      
      cy.fillDonationForm({
        name: 'Success Test',
        email: 'success@test.com'
      })
      cy.contains('Fazer Doação').click()
      
      cy.selectPaymentMethod('pix')
      cy.contains('Confirmar Pagamento PIX').click()
      cy.wait('@successPayment')
      
      // Simulate payment approval
      cy.wait('@approvedPayment')
      
      // Should show success message
      cy.contains('Doação realizada com sucesso!').should('be.visible')
      cy.contains('Obrigado pelo seu apoio').should('be.visible')
      cy.contains('Sua doação faz a diferença').should('be.visible')
      
      // Should have options to share or return
      cy.contains('Compartilhar doação').should('be.visible')
      cy.contains('Fazer nova doação').should('be.visible')
      cy.contains('Voltar ao início').should('be.visible')
    })

    it('should send confirmation email', () => {
      // This would typically involve checking email service integration
      // For now, we'll verify the UI indicates email will be sent
      
      cy.intercept('POST', '/api/payments/pix', { fixture: 'pix-payment-success.json' }).as('successPayment')
      
      cy.visit('/apoie')
      cy.wait('@getConfig')
      
      cy.fillDonationForm({
        name: 'Email Test',
        email: 'email@test.com'
      })
      cy.contains('Fazer Doação').click()
      
      cy.selectPaymentMethod('pix')
      cy.contains('Confirmar Pagamento PIX').click()
      cy.wait('@successPayment')
      
      cy.contains('Enviamos uma confirmação para email@test.com').should('be.visible')
    })
  })
})