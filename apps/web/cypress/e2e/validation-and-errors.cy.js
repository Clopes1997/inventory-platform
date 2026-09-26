/**
 * E2E: Validation and error handling.
 * Prerequisites: Backend running on :8080, frontend on :3000 (npm run dev).
 */
describe('Validation and errors', () => {
  beforeEach(() => {
    cy.login();
  });

  it('shows error when creating product with negative price', () => {
    cy.get('[data-testid="link-new-product"]').click();
    cy.get('#product-code').type('NEGPRICE');
    cy.get('#product-name').type('Negative Price Product');
    cy.get('#product-price').clear().type('-10');
    cy.get('button[type="submit"]').click();
    cy.get('#product-price').then(($input) => expect($input[0].validity.valid).to.equal(false));
    cy.url().should('include', '/products/new');
  });

  it('shows error or stays on page when creating product with blank code', () => {
    cy.get('[data-testid="link-new-product"]').click();
    cy.get('#product-code').clear();
    cy.get('#product-name').type('No Code');
    cy.get('#product-price').type('5');
    cy.get('button[type="submit"]').click();
    cy.get('form').should('be.visible');
  });

  it('shows error when visiting edit for non-existent product', () => {
    cy.login();
    cy.window().then((window) => {
      window.history.pushState({}, '', '/products/99999/edit');
      window.dispatchEvent(new window.PopStateEvent('popstate'));
    });
    cy.contains(/error|not found/i, { timeout: 10000 }).should('be.visible');
  });
});
