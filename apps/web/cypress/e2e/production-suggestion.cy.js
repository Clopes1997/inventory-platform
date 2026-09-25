/**
 * E2E: Create product, raw material, add material to product, open Production Suggestion.
 * Prerequisites: Backend running on :8080, frontend on :3000 (npm run dev).
 * Uses data-testid for nav and actions so tests are stable if UI copy changes.
 */
describe('Production suggestion flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/auth/login').as('login');
    cy.intercept('GET', '**/api/products*').as('productsApi');
    cy.intercept('GET', '**/api/raw-materials*').as('rawMaterialsApi');
    cy.intercept('GET', '**/api/production/suggestion*').as('suggestionApi');
    cy.login();
    cy.wait('@login');
  });

  it('creates product and raw material, adds material to product, then shows production suggestion', () => {
    cy.get('[data-testid="link-new-product"]').click();
    cy.get('#product-code').type('E2EPROD');
    cy.get('#product-name').type('E2E Product');
    cy.get('#product-price').type('25');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/edit');
    cy.contains('E2EPROD');

    cy.get('[data-testid="nav-raw-materials"]').click();
    cy.get('[data-testid="link-new-raw-material"]').click();
    cy.get('#raw-material-code').type('E2ERM');
    cy.get('#raw-material-name').type('E2E Raw');
    cy.get('#raw-material-stock').type('100');
    cy.get('button[type="submit"]').click();

    cy.url().should('match', /\/raw-materials\/\d+\/edit/);
    cy.url().then((url) => {
      const match = url.match(/\/raw-materials\/(\d+)\/edit/);
      if (match) cy.wrap(match[1]).as('newRawMaterialId');
    });

    cy.get('[data-testid="nav-products"]').click();
    cy.get('table').contains('E2EPROD').parent('tr').within(() => cy.get('[data-testid="product-edit-link"]').click());
    cy.contains('Raw materials (recipe)');
    cy.get('@newRawMaterialId').then((id) => {
      cy.get('[data-testid="add-raw-material-select"]').select(id);
    });
    cy.get('[data-testid="add-required-quantity"]').type('10');
    cy.get('.product-materials-section').contains('button', 'Add').click();
    cy.contains('E2ERM');

    cy.get('[data-testid="nav-production-suggestion"]').click();
    cy.wait('@suggestionApi');
    cy.get('[data-testid="production-suggestion-page"]').should('be.visible');
    cy.contains('E2EPROD');
    cy.get('[data-testid="production-total-value"]').should('be.visible');
  });
});
