/// <reference types="cypress" />

describe('🎯 Admin Raffle Management E2E Tests', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin()
    
    // Mock API responses
    cy.intercept('GET', '/api/raffles', {
      statusCode: 200,
      body: {
        raffles: [
          {
            id: 1,
            title: 'Rifa do Smartphone',
            description: 'iPhone 15 Pro Max',
            ticket_price: 10.00,
            total_numbers: 100,
            sold_numbers: 45,
            draw_date: '2024-12-25',
            status: 'active',
            image_url: '/uploads/raffle1.jpg'
          }
        ]
      }
    }).as('getRaffles')
    
    cy.intercept('GET', '/api/dashboard', { fixture: 'dashboard-data.json' }).as('getDashboard')
  })

  context('Raffle Management Interface', () => {
    it('should display raffles tab and existing raffles', () => {
      cy.visit('/admin')
      cy.wait('@getDashboard')
      
      // Navigate to raffles tab
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.wait('@getRaffles')
      
      // Check raffles content is visible
      cy.get('[data-cy="tab-content-raffles"]').should('be.visible')
      cy.get('[data-cy="raffle-creation-form"]').should('be.visible')
      cy.get('[data-cy="existing-raffles"]').should('be.visible')
      
      // Verify existing raffle is displayed
      cy.get('[data-cy="raffle-item-1"]').should('be.visible')
      cy.get('[data-cy="raffle-item-1"]').should('contain', 'Rifa do Smartphone')
      cy.get('[data-cy="raffle-item-1"]').should('contain', 'R$ 10,00')
      cy.get('[data-cy="raffle-item-1"]').should('contain', '45/100')
    })

    it('should display raffle creation form with all fields', () => {
      cy.visit('/admin')
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.wait('@getRaffles')
      
      // Check all form fields are present
      cy.get('[data-cy="raffle-title"]').should('be.visible')
      cy.get('[data-cy="raffle-price"]').should('be.visible')
      cy.get('[data-cy="raffle-numbers"]').should('be.visible')
      cy.get('[data-cy="raffle-date"]').should('be.visible')
      cy.get('[data-cy="raffle-description"]').should('be.visible')
      cy.get('[data-cy="raffle-image-upload"]').should('be.visible')
      cy.get('[data-cy="raffle-submit"]').should('be.visible')
      
      // Submit button should be disabled initially
      cy.get('[data-cy="raffle-submit"]').should('be.disabled')
    })
  })

  context('Form Validation', () => {
    beforeEach(() => {
      cy.visit('/admin')
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.wait('@getRaffles')
    })

    it('should validate required fields', () => {
      // Try to submit empty form
      cy.get('[data-cy="raffle-submit"]').should('be.disabled')
      
      // Fill only title
      cy.get('[data-cy="raffle-title"]').type('Teste')
      cy.get('[data-cy="raffle-submit"]').should('be.disabled')
      
      // Add price
      cy.get('[data-cy="raffle-price"]').type('10.00')
      cy.get('[data-cy="raffle-submit"]').should('be.disabled')
      
      // Add numbers
      cy.get('[data-cy="raffle-numbers"]').type('100')
      cy.get('[data-cy="raffle-submit"]').should('be.enabled')
    })

    it('should validate price format with real-time feedback', () => {
      // Test invalid price formats
      cy.testFormValidation('[data-cy="raffle-price"]', [
        { input: 'abc', shouldBeValid: false, errorMessage: 'Valor deve ter formato 00.00' },
        { input: '10', shouldBeValid: true },
        { input: '10.50', shouldBeValid: true },
        { input: '-5', shouldBeValid: false }
      ])
    })

    it('should validate numbers field', () => {
      cy.testFormValidation('[data-cy="raffle-numbers"]', [
        { input: 'abc', shouldBeValid: false },
        { input: '0', shouldBeValid: false },
        { input: '-10', shouldBeValid: false },
        { input: '50', shouldBeValid: true },
        { input: '1000', shouldBeValid: true }
      ])
    })

    it('should validate title length', () => {
      cy.testFormValidation('[data-cy="raffle-title"]', [
        { input: '', shouldBeValid: false, errorMessage: 'Campo obrigatório' },
        { input: 'A', shouldBeValid: true },
        { input: 'Título muito longo que excede o limite permitido para títulos de rifas e deve ser rejeitado pelo sistema de validação', shouldBeValid: false }
      ])
    })

    it('should show validation summary when form is invalid', () => {
      // Try to submit with invalid data
      cy.get('[data-cy="raffle-title"]').type('Test')
      cy.get('[data-cy="raffle-price"]').type('invalid')
      cy.get('[data-cy="raffle-numbers"]').type('0')
      
      // Should show validation summary
      cy.get('[data-cy="form-validation-summary"]').should('be.visible')
      cy.get('[data-cy="form-validation-summary"]').should('contain', 'corrija os erros')
    })
  })

  context('Raffle Creation', () => {
    beforeEach(() => {
      cy.visit('/admin')
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.wait('@getRaffles')
    })

    it('should create a new raffle successfully', () => {
      // Mock successful creation
      cy.intercept('POST', '/api/raffles', {
        statusCode: 201,
        body: {
          success: true,
          raffle: {
            id: 2,
            title: 'Nova Rifa Teste',
            ticket_price: 15.00,
            total_numbers: 50
          }
        }
      }).as('createRaffle')
      
      // Mock updated raffles list
      cy.intercept('GET', '/api/raffles', {
        statusCode: 200,
        body: {
          raffles: [
            {
              id: 1,
              title: 'Rifa do Smartphone',
              ticket_price: 10.00,
              total_numbers: 100,
              sold_numbers: 45,
              status: 'active'
            },
            {
              id: 2,
              title: 'Nova Rifa Teste',
              ticket_price: 15.00,
              total_numbers: 50,
              sold_numbers: 0,
              status: 'active'
            }
          ]
        }
      }).as('getRafflesUpdated')
      
      // Fill form with valid data
      cy.get('[data-cy="raffle-title"]').type('Nova Rifa Teste')
      cy.get('[data-cy="raffle-price"]').type('15.00')
      cy.get('[data-cy="raffle-numbers"]').type('50')
      cy.get('[data-cy="raffle-date"]').type('2024-12-31')
      cy.get('[data-cy="raffle-description"]').type('Descrição da nova rifa para teste')
      
      // Submit form
      cy.get('[data-cy="raffle-submit"]').click()
      
      // Wait for API call
      cy.wait('@createRaffle')
      cy.wait('@getRafflesUpdated')
      
      // Should show success message
      cy.get('[data-cy="raffle-message"]').should('be.visible')
      cy.get('[data-cy="raffle-message"]').should('contain', 'sucesso')
      
      // Form should be reset
      cy.get('[data-cy="raffle-title"]').should('have.value', '')
      cy.get('[data-cy="raffle-price"]').should('have.value', '')
      
      // New raffle should appear in list
      cy.get('[data-cy="raffle-item-2"]').should('be.visible')
      cy.get('[data-cy="raffle-item-2"]').should('contain', 'Nova Rifa Teste')
    })

    it('should handle creation errors gracefully', () => {
      // Mock error response
      cy.intercept('POST', '/api/raffles', {
        statusCode: 400,
        body: {
          success: false,
          error: 'Título da rifa já existe'
        }
      }).as('createRaffleError')
      
      // Fill form
      cy.get('[data-cy="raffle-title"]').type('Rifa Duplicada')
      cy.get('[data-cy="raffle-price"]').type('10.00')
      cy.get('[data-cy="raffle-numbers"]').type('100')
      
      // Submit form
      cy.get('[data-cy="raffle-submit"]').click()
      
      // Wait for API call
      cy.wait('@createRaffleError')
      
      // Should show error message
      cy.get('[data-cy="raffle-message"]').should('be.visible')
      cy.get('[data-cy="raffle-message"]').should('contain', 'Título da rifa já existe')
      
      // Form should not be reset
      cy.get('[data-cy="raffle-title"]').should('have.value', 'Rifa Duplicada')
    })

    it('should handle network errors during creation', () => {
      // Mock network error
      cy.intercept('POST', '/api/raffles', {
        forceNetworkError: true
      }).as('createRaffleNetworkError')
      
      // Fill and submit form
      cy.get('[data-cy="raffle-title"]').type('Rifa Teste')
      cy.get('[data-cy="raffle-price"]').type('10.00')
      cy.get('[data-cy="raffle-numbers"]').type('100')
      cy.get('[data-cy="raffle-submit"]').click()
      
      // Wait for API call
      cy.wait('@createRaffleNetworkError')
      
      // Should show network error
      cy.get('[data-cy="raffle-message"]').should('contain', 'Erro ao conectar')
    })
  })

  context('Image Upload Integration', () => {
    beforeEach(() => {
      cy.visit('/admin')
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.wait('@getRaffles')
    })

    it('should upload image during raffle creation', () => {
      // Mock image upload
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/test-raffle.jpg',
          thumbnail_url: '/uploads/thumbs/test-raffle.jpg'
        }
      }).as('uploadImage')
      
      // Mock raffle creation with image
      cy.intercept('POST', '/api/raffles', {
        statusCode: 201,
        body: {
          success: true,
          raffle: {
            id: 2,
            title: 'Rifa com Imagem',
            image_url: '/uploads/test-raffle.jpg'
          }
        }
      }).as('createRaffleWithImage')
      
      // Fill basic form data
      cy.get('[data-cy="raffle-title"]').type('Rifa com Imagem')
      cy.get('[data-cy="raffle-price"]').type('20.00')
      cy.get('[data-cy="raffle-numbers"]').type('75')
      
      // Upload image
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      
      // Wait for upload to complete
      cy.wait('@uploadImage')
      
      // Should show image preview
      cy.get('[data-cy="image-preview"]').should('be.visible')
      cy.get('[data-cy="upload-success"]').should('be.visible')
      
      // Submit form
      cy.get('[data-cy="raffle-submit"]').click()
      cy.wait('@createRaffleWithImage')
      
      // Should include image URL in request
      cy.get('@createRaffleWithImage').should(interception => {
        expect(interception.request.body).to.include({
          image_url: '/uploads/test-raffle.jpg',
          thumbnail_url: '/uploads/thumbs/test-raffle.jpg'
        })
      })
    })

    it('should handle image upload errors', () => {
      // Mock upload error
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 400,
        body: {
          error: 'Arquivo muito grande'
        }
      }).as('uploadImageError')
      
      // Try to upload image
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      
      // Wait for upload error
      cy.wait('@uploadImageError')
      
      // Should show error message
      cy.get('[data-cy="upload-error"]').should('be.visible')
      cy.get('[data-cy="upload-error"]').should('contain', 'Arquivo muito grande')
      
      // Should not show preview
      cy.get('[data-cy="image-preview"]').should('not.exist')
    })

    it('should validate image file types', () => {
      // Try to upload invalid file type
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/invalid-file.txt', { force: true })
      
      // Should show validation error
      cy.get('[data-cy="upload-error"]').should('be.visible')
      cy.get('[data-cy="upload-error"]').should('contain', 'Apenas imagens JPG, PNG ou WEBP')
    })
  })

  context('Raffle List Management', () => {
    it('should display raffle actions (view, edit, delete)', () => {
      cy.visit('/admin')
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.wait('@getRaffles')
      
      // Check action buttons are present
      cy.get('[data-cy="raffle-item-1"]').within(() => {
        cy.get('[data-cy="raffle-view"]').should('be.visible')
        cy.get('[data-cy="raffle-edit"]').should('be.visible')
        cy.get('[data-cy="raffle-delete"]').should('be.visible')
      })
    })

    it('should view raffle details', () => {
      // Mock raffle details
      cy.intercept('GET', '/api/raffles/1', {
        statusCode: 200,
        body: {
          id: 1,
          title: 'Rifa do Smartphone',
          description: 'iPhone 15 Pro Max 256GB',
          ticket_price: 10.00,
          total_numbers: 100,
          sold_numbers: 45,
          buyers: [
            { name: 'João Silva', numbers: [1, 5, 23], phone: '(11) 99999-9999' }
          ]
        }
      }).as('getRaffleDetails')
      
      cy.visit('/admin')
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.wait('@getRaffles')
      
      // Click view button
      cy.get('[data-cy="raffle-view-1"]').click()
      cy.wait('@getRaffleDetails')
      
      // Should show modal or navigate to details page
      cy.get('[data-cy="raffle-details"]').should('be.visible')
      cy.get('[data-cy="raffle-details"]').should('contain', 'iPhone 15 Pro Max')
      cy.get('[data-cy="raffle-buyers"]').should('be.visible')
    })

    it('should filter raffles by status', () => {
      // Mock raffles with different statuses
      cy.intercept('GET', '/api/raffles?status=active', {
        statusCode: 200,
        body: {
          raffles: [
            { id: 1, title: 'Rifa Ativa', status: 'active' }
          ]
        }
      }).as('getActiveRaffles')
      
      cy.visit('/admin')
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.wait('@getRaffles')
      
      // Use status filter
      cy.get('[data-cy="raffle-status-filter"]').select('active')
      cy.wait('@getActiveRaffles')
      
      // Should show only active raffles
      cy.get('[data-cy="raffle-item"]').should('have.length', 1)
      cy.get('[data-cy="raffle-item"]').should('contain', 'Rifa Ativa')
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
        cy.get('[data-cy="admin-tab-raffles"]').click()
        cy.wait('@getRaffles')
        
        // Form should be properly laid out
        cy.get('[data-cy="raffle-creation-form"]').should('be.visible')
        
        if (device === 'mobile') {
          // Form fields should stack on mobile
          cy.get('[data-cy="form-grid"]').should('have.class', 'grid-cols-1')
        } else {
          // Form should use grid on larger screens
          cy.get('[data-cy="form-grid"]').should('have.class', 'md:grid-cols-2')
        }
        
        // Raffle list should adapt
        cy.get('[data-cy="existing-raffles"]').should('be.visible')
      })
    })
  })

  context('Performance', () => {
    it('should handle large numbers of raffles efficiently', () => {
      // Mock large dataset
      const manyRaffles = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Rifa ${i + 1}`,
        ticket_price: 10.00,
        total_numbers: 100,
        sold_numbers: Math.floor(Math.random() * 100),
        status: 'active'
      }))
      
      cy.intercept('GET', '/api/raffles', {
        statusCode: 200,
        body: { raffles: manyRaffles }
      }).as('getManyRaffles')
      
      cy.visit('/admin')
      cy.get('[data-cy="admin-tab-raffles"]').click()
      cy.wait('@getManyRaffles')
      
      // Should render all raffles efficiently
      cy.get('[data-cy="raffle-item"]').should('have.length', 50)
      
      // Should implement pagination or virtual scrolling
      cy.get('[data-cy="raffles-pagination"]').should('be.visible')
    })
  })
})