/**
 * E2E Tests - Homepage
 * 
 * Testa funcionalidades da página inicial do site
 */

describe('Homepage E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  context('Page Structure and Navigation', () => {
    it('should display main homepage elements', () => {
      // Header elements
      cy.get('header').should('be.visible')
      cy.contains('Patas do Bem').should('be.visible')
      
      // Navigation menu
      cy.contains('Home').should('be.visible')
      cy.contains('Apoie').should('be.visible')
      cy.contains('Rifas').should('be.visible')
      cy.contains('Contato').should('be.visible')
      
      // CTA Button in header
      cy.contains('Doar Agora').should('be.visible')
      
      // Hero section
      cy.contains('Transformando vidas').should('be.visible')
      cy.contains('10 anos de amor').should('be.visible')
      
      // Footer
      cy.get('footer').should('be.visible')
      cy.contains('© 2025 Associação Patas do Bem').should('be.visible')
    })

    it('should have working navigation links', () => {
      // Test navigation to different pages
      cy.contains('Apoie').click()
      cy.url().should('include', '/apoie')
      cy.go('back')
      
      cy.contains('Rifas').click()
      cy.url().should('include', '/rifas')
      cy.go('back')
      
      cy.contains('Contato').click()
      cy.url().should('include', '/contato')
      cy.go('back')
    })

    it('should have responsive mobile menu', () => {
      // Test mobile viewport
      cy.viewport(375, 667)
      
      // Mobile menu button should be visible
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
      
      // Desktop navigation should be hidden
      cy.get('nav').should('not.be.visible')
      
      // Open mobile menu
      cy.get('[data-testid="mobile-menu-button"]').click()
      
      // Check mobile menu items
      cy.contains('Home').should('be.visible')
      cy.contains('Apoie').should('be.visible')
      cy.contains('Rifas').should('be.visible')
      cy.contains('Contato').should('be.visible')
      
      // Test mobile navigation
      cy.contains('Apoie').click()
      cy.url().should('include', '/apoie')
    })
  })

  context('Hero Section', () => {
    it('should display hero content correctly', () => {
      // Main headline
      cy.contains('Transformando vidas com amor').should('be.visible')
      
      // Description text
      cy.contains('Há uma década protegendo e cuidando').should('be.visible')
      
      // CTA buttons
      cy.contains('Apoie Nossa Causa').should('be.visible')
      cy.contains('Ver Rifas Ativas').should('be.visible')
      
      // Hero image
      cy.get('img[alt*="Cães e gatos felizes"]').should('be.visible')
      
      // Statistics badge
      cy.contains('500+').should('be.visible')
      cy.contains('Vidas Salvas').should('be.visible')
    })

    it('should have working CTA buttons', () => {
      cy.contains('Apoie Nossa Causa').click()
      cy.url().should('include', '/apoie')
      cy.go('back')
      
      cy.contains('Ver Rifas Ativas').click()
      cy.url().should('include', '/rifas')
      cy.go('back')
    })

    it('should display badge with 10 years anniversary', () => {
      cy.contains('10 anos de amor e cuidado').should('be.visible')
    })
  })

  context('Impact Statistics Section', () => {
    it('should display impact statistics', () => {
      // Check for statistics cards
      cy.contains('500+').should('be.visible')
      cy.contains('Animais Resgatados').should('be.visible')
      
      cy.contains('300+').should('be.visible')
      cy.contains('Adoções Realizadas').should('be.visible')
      
      cy.contains('1000+').should('be.visible')
      cy.contains('Castrações Gratuitas').should('be.visible')
    })

    it('should have icons for each statistic', () => {
      // Icons should be visible (using Lucide React icons)
      cy.get('[data-testid="impact-stats"]').within(() => {
        cy.get('svg').should('have.length.at.least', 3)
      })
    })
  })

  context('About Section (Quem Somos)', () => {
    it('should display about section content', () => {
      cy.contains('Quem Somos').should('be.visible')
      cy.contains('A Associação Patas do Bem').should('be.visible')
      
      // History section
      cy.contains('Nossa História').should('be.visible')
      cy.contains('Projeto Castra Cat').should('be.visible')
      cy.contains('10 anos').should('be.visible')
      
      // CTA to contact
      cy.contains('Saiba Mais').should('be.visible')
      
      // Volunteer image
      cy.get('img[alt*="Voluntários"]').should('be.visible')
    })

    it('should have working "Saiba Mais" button', () => {
      cy.contains('Saiba Mais').click()
      cy.url().should('include', '/contato')
    })
  })

  context('Activities Section', () => {
    it('should display three main activities', () => {
      cy.contains('Nossas Atividades').should('be.visible')
      
      // Three activity cards
      cy.contains('Projeto Castra Cat').should('be.visible')
      cy.contains('Resgates e Cuidados').should('be.visible')
      cy.contains('Adoções Responsáveis').should('be.visible')
      
      // Each should have descriptions
      cy.contains('castrações gratuitas').should('be.visible')
      cy.contains('cuidados veterinários').should('be.visible')
      cy.contains('famílias amorosas').should('be.visible')
    })

    it('should have activity images', () => {
      // Check for activity images
      cy.get('img[alt*="Projeto Castra Cat"]').should('be.visible')
      cy.get('img[alt*="Resgates e Cuidados"]').should('be.visible')
      cy.get('img[alt*="Adoções Responsáveis"]').should('be.visible')
    })

    it('should have hover effects on activity cards', () => {
      cy.get('[data-testid="activity-card"]').first().trigger('mouseover')
      // Check for hover effects (scale, shadow, etc.)
      cy.get('[data-testid="activity-card"]').first().should('have.class', 'hover:shadow-lg')
    })
  })

  context('Active Raffles Section', () => {
    beforeEach(() => {
      // Intercept API call for raffles
      cy.intercept('GET', '/api/raffles', { fixture: 'raffles.json' }).as('getRaffles')
    })

    it('should display active raffles when available', () => {
      cy.wait('@getRaffles')
      
      // Raffles section should appear
      cy.contains('🎟️ Rifas Ativas').should('be.visible')
      cy.contains('Participe das nossas rifas').should('be.visible')
      
      // Should display raffle cards
      cy.get('[data-testid="raffle-card"]').should('have.length.at.least', 1)
    })

    it('should show raffle details correctly', () => {
      cy.wait('@getRaffles')
      
      // First raffle card
      cy.get('[data-testid="raffle-card"]').first().within(() => {
        // Should have title, description, price
        cy.get('[data-testid="raffle-title"]').should('be.visible')
        cy.get('[data-testid="raffle-description"]').should('be.visible')
        cy.get('[data-testid="raffle-price"]').should('contain', 'R$')
        cy.get('[data-testid="raffle-available"]').should('contain', 'disponíveis')
        
        // Participate button
        cy.contains('Participar da Rifa').should('be.visible')
      })
    })

    it('should navigate to raffle details', () => {
      cy.wait('@getRaffles')
      
      cy.get('[data-testid="raffle-card"]').first().within(() => {
        cy.contains('Participar da Rifa').click()
      })
      
      cy.url().should('include', '/rifas/')
    })

    it('should show "Ver Todas as Rifas" when more than 2 raffles', () => {
      // Mock more than 2 raffles
      cy.intercept('GET', '/api/raffles', { 
        body: { 
          raffles: new Array(5).fill(null).map((_, i) => ({
            id: i + 1,
            title: `Rifa ${i + 1}`,
            description: `Descrição da rifa ${i + 1}`,
            ticket_price: 10.00,
            available_numbers: 50
          }))
        }
      }).as('getMultipleRaffles')
      
      cy.reload()
      cy.wait('@getMultipleRaffles')
      
      cy.contains('Ver Todas as Rifas').should('be.visible')
      cy.contains('Ver Todas as Rifas').click()
      cy.url().should('include', '/rifas')
    })
  })

  context('Final CTA Section', () => {
    it('should display final call to action', () => {
      cy.contains('Faça a Diferença Hoje').should('be.visible')
      cy.contains('Sua doação, por menor que seja').should('be.visible')
      
      // Two CTA buttons
      cy.contains('Doar Mensalmente').should('be.visible')
      cy.contains('Participar de Rifas').should('be.visible')
    })

    it('should have working final CTA buttons', () => {
      cy.contains('Doar Mensalmente').click()
      cy.url().should('include', '/apoie')
      cy.go('back')
      
      cy.contains('Participar de Rifas').click()
      cy.url().should('include', '/rifas')
      cy.go('back')
    })
  })

  context('Footer', () => {
    it('should display footer content', () => {
      // Organization info
      cy.contains('Patas do Bem').should('be.visible')
      cy.contains('Santos Dumont/MG').should('be.visible')
      cy.contains('10 anos atuando').should('be.visible')
      
      // Quick links
      cy.contains('Links Rápidos').should('be.visible')
      cy.contains('Como Apoiar').should('be.visible')
      cy.contains('Rifas Ativas').should('be.visible')
      
      // Contact information
      cy.contains('Contato').should('be.visible')
      cy.contains('contato@patasdobem.org.br').should('be.visible')
      cy.contains('(32) 99999-9999').should('be.visible')
      
      // Social media links
      cy.get('a[href*="instagram.com"]').should('be.visible')
      cy.get('a[href*="facebook.com"]').should('be.visible')
      cy.get('a[href*="wa.me"]').should('be.visible')
    })

    it('should have working footer links', () => {
      // Test quick links
      cy.get('footer').within(() => {
        cy.contains('Como Apoiar').click()
      })
      cy.url().should('include', '/apoie')
      cy.go('back')
      
      // Test social media links (should open in new tab)
      cy.get('a[href*="instagram.com"]').should('have.attr', 'target', '_blank')
      cy.get('a[href*="facebook.com"]').should('have.attr', 'target', '_blank')
      cy.get('a[href*="wa.me"]').should('have.attr', 'target', '_blank')
    })

    it('should display copyright information', () => {
      cy.contains('© 2025 Associação Patas do Bem').should('be.visible')
      cy.contains('Todos os direitos reservados').should('be.visible')
      cy.contains('Feito com amor pelos animais').should('be.visible')
    })
  })

  context('Performance and Accessibility', () => {
    it('should load within acceptable time', () => {
      const startTime = Date.now()
      
      cy.visit('/').then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(3000) // Should load within 3 seconds
      })
    })

    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length', 1)
      cy.get('h1').should('contain', 'Transformando vidas')
      
      cy.get('h2').should('have.length.at.least', 3)
      cy.get('h3').should('have.length.at.least', 2)
    })

    it('should have alt text for images', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt').and('not.be.empty')
      })
    })

    it('should be keyboard navigable', () => {
      // Tab through interactive elements
      cy.get('body').tab()
      cy.focused().should('contain', 'Home')
      
      cy.focused().tab()
      cy.focused().should('contain', 'Apoie')
      
      cy.focused().tab()
      cy.focused().should('contain', 'Rifas')
    })
  })
})