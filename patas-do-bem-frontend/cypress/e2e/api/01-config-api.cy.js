/**
 * API Tests - Configuration Endpoints
 * 
 * Testa endpoints de configuração geral da aplicação
 */

describe('Config API Tests', () => {
  const API_BASE = Cypress.env('API_BASE_URL')

  context('GET /api/config', () => {
    it('should return organization configuration', () => {
      cy.apiRequest('GET', '/api/config').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('organization_name')
        expect(response.body).to.have.property('contact_info')
        expect(response.body).to.have.property('donation_plans')
        expect(response.body).to.have.property('social_links')
        expect(response.body).to.have.property('about')
        
        // Validate organization name
        expect(response.body.organization_name).to.include('Patas do Bem')
        
        // Validate contact info structure
        const contactInfo = response.body.contact_info
        expect(contactInfo).to.have.property('email')
        expect(contactInfo).to.have.property('phone')
        expect(contactInfo).to.have.property('address')
        expect(contactInfo.email).to.include('@')
        
        // Validate donation plans
        const plans = response.body.donation_plans
        expect(plans).to.be.an('array')
        expect(plans).to.have.length.greaterThan(0)
        
        plans.forEach(plan => {
          expect(plan).to.have.property('id')
          expect(plan).to.have.property('name')
          expect(plan).to.have.property('amount')
          expect(plan).to.have.property('description')
          expect(plan.amount).to.be.a('number')
          expect(plan.amount).to.be.greaterThan(0)
        })
        
        // Validate social links
        const socialLinks = response.body.social_links
        expect(socialLinks).to.have.property('instagram')
        expect(socialLinks).to.have.property('facebook') 
        expect(socialLinks).to.have.property('whatsapp')
        
        // Validate about section
        const about = response.body.about
        expect(about).to.have.property('mission')
        expect(about).to.have.property('history')
        expect(about).to.have.property('activities')
        expect(about.activities).to.be.an('array')
      })
    })

    it('should return consistent donation plans', () => {
      cy.apiRequest('GET', '/api/config').then((response) => {
        const plans = response.body.donation_plans
        
        // Should have the standard plans: R$20, R$50, R$100
        const amounts = plans.map(p => p.amount).sort((a, b) => a - b)
        expect(amounts).to.deep.equal([20, 50, 100])
        
        // Check plan IDs match expected format
        const planIds = plans.map(p => p.id)
        expect(planIds).to.include.members(['plan_20', 'plan_50', 'plan_100'])
        
        // Check plan names
        const planNames = plans.map(p => p.name)
        expect(planNames).to.include.members(['Apoiador', 'Protetor', 'Guardião'])
      })
    })

    it('should include all required social media links', () => {
      cy.apiRequest('GET', '/api/config').then((response) => {
        const socialLinks = response.body.social_links
        
        expect(socialLinks.instagram).to.include('instagram.com')
        expect(socialLinks.facebook).to.include('facebook.com')
        expect(socialLinks.whatsapp).to.include('wa.me')
        
        // Should have tiktok as mentioned in the proposal
        expect(socialLinks).to.have.property('tiktok')
        expect(socialLinks.tiktok).to.include('tiktok.com')
      })
    })

    it('should return proper CORS headers', () => {
      cy.apiRequest('GET', '/api/config').then((response) => {
        expect(response.headers).to.have.property('access-control-allow-origin')
      })
    })

    it('should handle rapid requests without errors', () => {
      // Make sequential requests instead of concurrent
      for(let i = 0; i < 3; i++) {
        cy.apiRequest('GET', '/api/config').then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property('organization_name')
        })
      }
    })
  })
})