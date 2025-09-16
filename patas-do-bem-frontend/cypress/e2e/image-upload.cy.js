/// <reference types="cypress" />

describe('🖼️ Image Upload E2E Tests', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin()
    
    // Navigate to raffles tab where image upload is used
    cy.visit('/admin')
    cy.get('[data-cy="admin-tab-raffles"]').click()
  })

  context('Image Upload Interface', () => {
    it('should display image upload component', () => {
      // Check upload area is visible
      cy.get('[data-cy="image-upload"]').should('be.visible')
      cy.get('[data-cy="upload-area"]').should('be.visible')
      
      // Check initial state
      cy.get('[data-cy="upload-area"]').should('contain', 'Clique ou arraste uma imagem')
      cy.get('[data-cy="upload-guidelines"]').should('be.visible')
      cy.get('[data-cy="upload-guidelines"]').should('contain', 'JPG, PNG, WEBP até 5MB')
      
      // No preview should be shown initially
      cy.get('[data-cy="image-preview"]').should('not.exist')
    })

    it('should show upload guidelines and restrictions', () => {
      cy.get('[data-cy="upload-guidelines"]').should('be.visible')
      cy.get('[data-cy="upload-guidelines"]').should('contain', 'Recomendamos imagens em alta resolução')
      cy.get('[data-cy="upload-guidelines"]').should('contain', 'mínimo 800x600px')
      cy.get('[data-cy="upload-guidelines"]').should('contain', 'Formatos aceitos: JPG, PNG, WEBP')
      cy.get('[data-cy="upload-guidelines"]').should('contain', 'Tamanho máximo: 5MB')
    })
  })

  context('File Selection and Validation', () => {
    it('should accept valid image files', () => {
      // Mock successful upload
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/test-image.jpg',
          thumbnail_url: '/uploads/thumbs/test-image.jpg'
        }
      }).as('uploadSuccess')
      
      // Upload valid image
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      
      // Should show loading state
      cy.get('[data-cy="upload-loading"]').should('be.visible')
      cy.get('[data-cy="upload-loading"]').should('contain', 'Fazendo upload')
      
      // Wait for upload
      cy.wait('@uploadSuccess')
      
      // Should show preview
      cy.get('[data-cy="image-preview"]').should('be.visible')
      cy.get('[data-cy="upload-success"]').should('be.visible')
      cy.get('[data-cy="upload-success"]').should('contain', 'Imagem carregada com sucesso')
      
      // Should show remove button
      cy.get('[data-cy="remove-image"]').should('be.visible')
    })

    it('should reject invalid file types', () => {
      // Create a text file to simulate invalid upload
      cy.writeFile('cypress/fixtures/invalid-file.txt', 'This is not an image')
      
      // Try to upload invalid file
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/invalid-file.txt', { force: true })
      
      // Should show error immediately (client-side validation)
      cy.get('[data-cy="upload-error"]').should('be.visible')
      cy.get('[data-cy="upload-error"]').should('contain', 'Apenas imagens JPG, PNG ou WEBP são permitidas')
      
      // Should not show preview
      cy.get('[data-cy="image-preview"]').should('not.exist')
      
      // Should not make API call
      cy.get('@uploadSuccess').should('not.exist')
    })

    it('should reject files that are too large', () => {
      // Mock file size validation error
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 400,
        body: {
          error: 'Arquivo muito grande. Máximo 5MB permitido'
        }
      }).as('uploadSizeError')
      
      // Try to upload large file (mock by intercepting)
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      
      cy.wait('@uploadSizeError')
      
      // Should show size error
      cy.get('[data-cy="upload-error"]').should('be.visible')
      cy.get('[data-cy="upload-error"]').should('contain', 'Arquivo muito grande')
      
      // Should not show preview
      cy.get('[data-cy="image-preview"]').should('not.exist')
    })

    it('should validate image dimensions', () => {
      // Mock dimension validation error
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 400,
        body: {
          error: 'Imagem muito pequena. Mínimo 800x600px recomendado'
        }
      }).as('uploadDimensionError')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      
      cy.wait('@uploadDimensionError')
      
      // Should show dimension error but as warning, not blocking
      cy.get('[data-cy="upload-warning"]').should('be.visible')
      cy.get('[data-cy="upload-warning"]').should('contain', 'Imagem muito pequena')
    })
  })

  context('Drag and Drop Functionality', () => {
    it('should support drag and drop upload', () => {
      // Mock successful upload
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/dropped-image.jpg',
          thumbnail_url: '/uploads/thumbs/dropped-image.jpg'
        }
      }).as('uploadDropped')
      
      // Simulate drag and drop
      cy.fixture('test-image.jpg', 'base64').then(fileContent => {
        const blob = Cypress.Blob.base64StringToBlob(fileContent)
        const file = new File([blob], 'dropped-image.jpg', { type: 'image/jpeg' })
        
        cy.get('[data-cy="upload-area"]').trigger('dragover')
        cy.get('[data-cy="upload-area"]').should('have.class', 'border-orange-400') // Hover state
        
        cy.get('[data-cy="upload-area"]').trigger('drop', {
          dataTransfer: {
            files: [file]
          }
        })
      })
      
      cy.wait('@uploadDropped')
      
      // Should show success
      cy.get('[data-cy="image-preview"]').should('be.visible')
      cy.get('[data-cy="upload-success"]').should('be.visible')
    })

    it('should show visual feedback during drag', () => {
      // Simulate drag enter
      cy.get('[data-cy="upload-area"]').trigger('dragenter')
      cy.get('[data-cy="upload-area"]').should('have.class', 'border-orange-400')
      
      // Simulate drag leave
      cy.get('[data-cy="upload-area"]').trigger('dragleave')
      cy.get('[data-cy="upload-area"]').should('not.have.class', 'border-orange-400')
    })
  })

  context('Image Preview and Management', () => {
    beforeEach(() => {
      // Upload an image first
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/preview-test.jpg',
          thumbnail_url: '/uploads/thumbs/preview-test.jpg'
        }
      }).as('uploadForPreview')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      cy.wait('@uploadForPreview')
    })

    it('should display image preview correctly', () => {
      // Check preview is shown
      cy.get('[data-cy="image-preview"]').should('be.visible')
      cy.get('[data-cy="preview-image"]').should('be.visible')
      cy.get('[data-cy="preview-image"]').should('have.attr', 'src').and('include', '/uploads/preview-test.jpg')
      
      // Check preview has proper styling
      cy.get('[data-cy="preview-image"]').should('have.class', 'w-full')
      cy.get('[data-cy="preview-image"]').should('have.class', 'h-48')
      cy.get('[data-cy="preview-image"]').should('have.class', 'object-cover')
    })

    it('should allow removing uploaded image', () => {
      // Click remove button
      cy.get('[data-cy="remove-image"]').click()
      
      // Preview should be hidden
      cy.get('[data-cy="image-preview"]').should('not.exist')
      
      // Upload area should be shown again
      cy.get('[data-cy="upload-area"]').should('be.visible')
      cy.get('[data-cy="upload-area"]').should('contain', 'Clique ou arraste')
      
      // File input should be cleared
      cy.get('[data-cy="image-upload-input"]').should('have.value', '')
    })

    it('should replace existing image when new one is uploaded', () => {
      // Upload another image
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/replacement-image.jpg',
          thumbnail_url: '/uploads/thumbs/replacement-image.jpg'
        }
      }).as('uploadReplacement')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      cy.wait('@uploadReplacement')
      
      // Should show new image
      cy.get('[data-cy="preview-image"]').should('have.attr', 'src').and('include', '/uploads/replacement-image.jpg')
    })
  })

  context('Error Handling', () => {
    it('should handle server errors gracefully', () => {
      // Mock server error
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 500,
        body: {
          error: 'Erro interno do servidor'
        }
      }).as('uploadServerError')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      cy.wait('@uploadServerError')
      
      // Should show error message
      cy.get('[data-cy="upload-error"]').should('be.visible')
      cy.get('[data-cy="upload-error"]').should('contain', 'Erro interno do servidor')
      
      // Should not show preview
      cy.get('[data-cy="image-preview"]').should('not.exist')
      
      // Should allow retry
      cy.get('[data-cy="upload-retry"]').should('be.visible')
    })

    it('should handle network timeouts', () => {
      // Mock timeout
      cy.intercept('POST', '/api/upload/raffle-image', {
        delay: 30000,
        statusCode: 408
      }).as('uploadTimeout')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      
      // Should show loading for a while
      cy.get('[data-cy="upload-loading"]').should('be.visible')
      
      // After timeout, should show error
      cy.get('[data-cy="upload-error"]', { timeout: 35000 }).should('be.visible')
      cy.get('[data-cy="upload-error"]').should('contain', 'Tempo limite excedido')
    })

    it('should handle authentication errors', () => {
      // Mock auth error
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 401,
        body: {
          error: 'Token de autenticação inválido'
        }
      }).as('uploadAuthError')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      cy.wait('@uploadAuthError')
      
      // Should show auth error
      cy.get('[data-cy="upload-error"]').should('be.visible')
      cy.get('[data-cy="upload-error"]').should('contain', 'Token de autenticação inválido')
      
      // Should suggest re-login
      cy.get('[data-cy="relogin-suggestion"]').should('be.visible')
    })
  })

  context('Integration with Form', () => {
    it('should integrate uploaded image with raffle creation', () => {
      // Upload image first
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/raffle-image.jpg',
          thumbnail_url: '/uploads/thumbs/raffle-image.jpg'
        }
      }).as('uploadImage')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      cy.wait('@uploadImage')
      
      // Fill raffle form
      cy.get('[data-cy="raffle-title"]').type('Rifa com Imagem')
      cy.get('[data-cy="raffle-price"]').type('25.00')
      cy.get('[data-cy="raffle-numbers"]').type('200')
      
      // Mock raffle creation
      cy.intercept('POST', '/api/raffles', {
        statusCode: 201,
        body: {
          success: true,
          raffle: {
            id: 1,
            title: 'Rifa com Imagem',
            image_url: '/uploads/raffle-image.jpg'
          }
        }
      }).as('createRaffle')
      
      // Submit form
      cy.get('[data-cy="raffle-submit"]').click()
      cy.wait('@createRaffle')
      
      // Should include image URLs in request
      cy.get('@createRaffle').should(interception => {
        expect(interception.request.body).to.deep.include({
          image_url: '/uploads/raffle-image.jpg',
          thumbnail_url: '/uploads/thumbs/raffle-image.jpg'
        })
      })
    })

    it('should reset image when form is reset', () => {
      // Upload image and fill form
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/reset-test.jpg',
          thumbnail_url: '/uploads/thumbs/reset-test.jpg'
        }
      }).as('uploadForReset')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      cy.wait('@uploadForReset')
      
      cy.get('[data-cy="raffle-title"]').type('Test Raffle')
      
      // Reset form
      cy.get('[data-cy="form-reset"]').click()
      
      // Image should be cleared
      cy.get('[data-cy="image-preview"]').should('not.exist')
      cy.get('[data-cy="upload-area"]').should('be.visible')
    })
  })

  context('Performance and Optimization', () => {
    it('should handle multiple rapid uploads correctly', () => {
      // Mock first upload
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/first-image.jpg',
          thumbnail_url: '/uploads/thumbs/first-image.jpg'
        },
        delay: 1000
      }).as('uploadFirst')
      
      // Mock second upload
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/second-image.jpg',
          thumbnail_url: '/uploads/thumbs/second-image.jpg'
        },
        delay: 500
      }).as('uploadSecond')
      
      // Upload first image
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      
      // Immediately upload second image (before first completes)
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      
      // Should handle this gracefully - show latest upload result
      cy.wait('@uploadSecond')
      
      // Should show second image
      cy.get('[data-cy="preview-image"]').should('have.attr', 'src').and('include', '/uploads/second-image.jpg')
    })

    it('should compress large images automatically', () => {
      // Mock compression response
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/compressed-image.jpg',
          thumbnail_url: '/uploads/thumbs/compressed-image.jpg',
          compressed: true,
          original_size: 8000000,
          compressed_size: 2000000
        }
      }).as('uploadCompressed')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      cy.wait('@uploadCompressed')
      
      // Should show compression info
      cy.get('[data-cy="compression-info"]').should('be.visible')
      cy.get('[data-cy="compression-info"]').should('contain', 'Imagem otimizada automaticamente')
    })
  })

  context('Accessibility', () => {
    it('should be keyboard accessible', () => {
      // Should be able to focus upload area
      cy.get('[data-cy="upload-area"]').focus()
      cy.focused().should('have.attr', 'data-cy', 'upload-area')
      
      // Should be able to trigger with Enter/Space
      cy.get('[data-cy="upload-area"]').type('{enter}')
      // File dialog should open (can't test actual dialog, but can verify focus behavior)
    })

    it('should have proper ARIA labels and descriptions', () => {
      // Check ARIA attributes
      cy.get('[data-cy="image-upload"]').should('have.attr', 'aria-label')
      cy.get('[data-cy="upload-area"]').should('have.attr', 'aria-describedby')
      cy.get('[data-cy="upload-guidelines"]').should('have.attr', 'id')
      
      // Check screen reader text
      cy.get('[data-cy="upload-screen-reader"]').should('exist')
      cy.get('[data-cy="upload-screen-reader"]').should('contain', 'Arraste e solte uma imagem ou clique para selecionar')
    })

    it('should announce upload status to screen readers', () => {
      // Mock upload
      cy.intercept('POST', '/api/upload/raffle-image', {
        statusCode: 200,
        body: {
          image_url: '/uploads/accessible-test.jpg',
          thumbnail_url: '/uploads/thumbs/accessible-test.jpg'
        }
      }).as('uploadAccessible')
      
      cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
      cy.wait('@uploadAccessible')
      
      // Should have live region for status updates
      cy.get('[data-cy="upload-status-live"]').should('exist')
      cy.get('[data-cy="upload-status-live"]').should('contain', 'Imagem carregada com sucesso')
    })
  })
})