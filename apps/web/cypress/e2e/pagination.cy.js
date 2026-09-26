/**
 * E2E: Pagination on Products and Raw Materials.
 * Prerequisites: Backend on :8080, frontend on :3000 (npm run dev).
 * Creates 21 products and 21 raw materials via API once (faster than full UI flows).
 */
describe('Pagination', () => {
  const PAGE_SIZE = 20;
  const NEEDED = PAGE_SIZE + 1; // 21 items => 2 pages

  before(function () {
    cy.login();
    cy.get('@apiToken').then((token) => {
      const base = Cypress.config().baseUrl;
      for (let i = 0; i < NEEDED; i++) {
        cy.request({
          method: 'POST',
          url: `${base}/api/products`,
          body: { code: `PAG${i}`, name: `Product ${i}`, price: 1 },
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      for (let i = 0; i < NEEDED; i++) {
        cy.request({
          method: 'POST',
          url: `${base}/api/raw-materials`,
          body: { code: `RMP${i}`, name: `Raw ${i}`, stockQuantity: 10 },
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    });
  });

  beforeEach(() => {
    cy.intercept('GET', '**/api/products*').as('productsApi');
    cy.intercept('GET', '**/api/raw-materials*').as('rawMaterialsApi');
    cy.login();
  });

  it('Products list shows pagination when more than one page', () => {
    cy.get('[data-testid="nav-products"]').click();
    cy.wait('@productsApi');
    cy.contains('h1', 'Products');

    cy.get('nav[aria-label="Products pagination"]').should('be.visible');
    cy.contains('Page 1 of 2');
    cy.get('button[aria-label="Next page"]').click();
    cy.contains('Page 2 of 2');
    cy.get('button[aria-label="Previous page"]').click();
    cy.contains('Page 1 of 2');
  });

  it('Raw Materials list shows pagination when more than one page', () => {
    cy.get('[data-testid="nav-raw-materials"]').click();
    cy.wait('@rawMaterialsApi');
    cy.contains('h1', 'Raw Materials');

    cy.get('nav[aria-label="Raw materials pagination"]').should('be.visible');
    cy.contains(/Page \d+ of \d+/);
  });
});
