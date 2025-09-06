/**
 * Dashboard API Tests
 * 
 * Tests for dashboard endpoints
 */

describe('Dashboard API Tests', () => {
  beforeEach(() => {
    // Ensure backend is running
    cy.request('GET', 'http://localhost:5000/api/config').should((response) => {
      expect(response.status).to.eq(200)
    })
  })

  context('GET /api/dashboard', () => {
    it('should return dashboard data successfully', () => {
      cy.request({
        method: 'GET',
        url: 'http://localhost:5000/api/dashboard',
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('donations_summary')
        expect(response.body).to.have.property('raffles_summary')
        expect(response.body).to.have.property('recent_activity')
        expect(response.body).to.have.property('pending_actions')
        
        // Verify donations summary structure
        expect(response.body.donations_summary).to.have.property('total_donations')
        expect(response.body.donations_summary).to.have.property('total_amount')
        expect(response.body.donations_summary).to.have.property('monthly_recurring')
        expect(response.body.donations_summary).to.have.property('total_donors')
        
        // Verify raffles summary structure
        expect(response.body.raffles_summary).to.have.property('active_raffles')
        expect(response.body.raffles_summary).to.have.property('total_raffles')
        
        // Verify data types
        expect(response.body.donations_summary.total_donations).to.be.a('number')
        expect(response.body.donations_summary.total_amount).to.be.a('number')
        expect(response.body.raffles_summary.active_raffles).to.be.a('number')
        expect(response.body.recent_activity).to.be.an('array')
        expect(response.body.pending_actions).to.be.an('array')
      })
    })

    it('should return valid recent activity data', () => {
      cy.request('GET', 'http://localhost:5000/api/dashboard').then((response) => {
        expect(response.status).to.eq(200)
        
        if (response.body.recent_activity.length > 0) {
          const activity = response.body.recent_activity[0]
          expect(activity).to.have.property('type')
          expect(activity).to.have.property('description')
          expect(activity).to.have.property('date')
          expect(activity.type).to.be.oneOf(['donation', 'message'])
          
          // Verify date format
          expect(activity.date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        }
      })
    })

    it('should return pending actions when available', () => {
      cy.request('GET', 'http://localhost:5000/api/dashboard').then((response) => {
        expect(response.status).to.eq(200)
        
        if (response.body.pending_actions.length > 0) {
          const action = response.body.pending_actions[0]
          expect(action).to.have.property('description')
          expect(action).to.have.property('count')
          expect(action).to.have.property('type')
          expect(action.count).to.be.a('number')
          expect(action.count).to.be.greaterThan(0)
        }
      })
    })

    it('should handle dashboard data with no activity gracefully', () => {
      cy.request('GET', 'http://localhost:5000/api/dashboard').then((response) => {
        expect(response.status).to.eq(200)
        
        // Should always return arrays even if empty
        expect(response.body.recent_activity).to.be.an('array')
        expect(response.body.pending_actions).to.be.an('array')
      })
    })
  })

  context('Dashboard Performance', () => {
    it('should respond within reasonable time', () => {
      const startTime = Date.now()
      
      cy.request('GET', 'http://localhost:5000/api/dashboard').then((response) => {
        const endTime = Date.now()
        const responseTime = endTime - startTime
        
        expect(response.status).to.eq(200)
        expect(responseTime).to.be.lessThan(5000) // Should respond within 5 seconds
      })
    })
  })

  context('Dashboard Data Consistency', () => {
    it('should return consistent data structure on multiple calls', () => {
      let firstResponse

      cy.request('GET', 'http://localhost:5000/api/dashboard').then((response) => {
        firstResponse = response.body
        expect(response.status).to.eq(200)
      })

      cy.request('GET', 'http://localhost:5000/api/dashboard').then((response) => {
        expect(response.status).to.eq(200)
        
        // Should have same structure
        expect(response.body).to.have.all.keys(Object.keys(firstResponse))
        expect(response.body.donations_summary).to.have.all.keys(Object.keys(firstResponse.donations_summary))
        expect(response.body.raffles_summary).to.have.all.keys(Object.keys(firstResponse.raffles_summary))
      })
    })
  })
})