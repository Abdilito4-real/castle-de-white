describe('Reservation Flow Error Handling', () => {
  beforeEach(() => {
    // Assumes the app is served at the root
    cy.visit('index.html');
    
    // Open the reservation modal
    cy.contains('Reserve a Room').click();
    cy.get('#modal').should('have.class', 'open');
  });

  it('displays validation errors for empty fields', () => {
    cy.get('#reserveBtn').click();
    
    // Check that visual error states are applied
    cy.get('#errFirst').should('be.visible').and('contain', 'first name');
    cy.get('#errEmail').should('be.visible').and('contain', 'valid email');
    cy.get('#guestFirst').should('have.class', 'error');
    
    // Verify the error toast appears
    cy.get('.toast-item.error')
      .should('be.visible')
      .and('contain', 'Please fix the highlighted fields');
  });

  it('validates email format', () => {
    // Fill other required fields
    cy.get('#guestFirst').type('Test');
    cy.get('#guestLast').type('User');
    cy.get('#guestPhone').type('08012345678');
    cy.get('#modalCheckin').type('2025-12-01');
    cy.get('#modalCheckout').type('2025-12-05');
    
    // Enter invalid email
    cy.get('#guestEmail').type('invalid-email-format');
    cy.get('#reserveBtn').click();
    
    cy.get('#errEmail').should('be.visible');
    cy.get('#guestEmail').should('have.class', 'error');
  });

  it('handles "Room not available" error from backend', () => {
    fillValidForm();

    // Mock backend response for unavailability
    cy.intercept('POST', '**/rest/v1/rpc/create_reservation', {
      statusCode: 200,
      body: {
        success: false,
        error: 'No deluxe available for these dates. Please try different dates.'
      }
    }).as('createResUnavailable');

    cy.get('#reserveBtn').click();
    cy.wait('@createResUnavailable');
    
    // Verify specific mapped error message in index.html logic
    cy.get('.toast-item.error').should('contain', 'Selected room is not available');
    
    // Ensure button resets state
    cy.get('#reserveBtn').should('not.be.disabled').and('contain', 'Confirm Reservation Request');
  });

  it('handles Rate Limit/Generic errors gracefully', () => {
    fillValidForm();

    // Mock backend rate limit response
    cy.intercept('POST', '**/rest/v1/rpc/create_reservation', {
      statusCode: 200,
      body: {
        success: false,
        error: 'High booking volume detected. Please try again in 15 minutes.'
      }
    }).as('createResRateLimit');

    cy.get('#reserveBtn').click();
    cy.wait('@createResRateLimit');
    
    // Should fall back to generic error message in frontend logic
    cy.get('.toast-item.error').should('contain', 'Could not submit reservation');
  });

  function fillValidForm() {
    cy.get('#guestFirst').type('Cypress');
    cy.get('#guestLast').type('Test');
    cy.get('#guestEmail').type('cypress@test.com');
    cy.get('#guestPhone').type('08099998888');
    // Use static future dates
    cy.get('#modalCheckin').type('2026-01-10');
    cy.get('#modalCheckout').type('2026-01-15');
  }
});