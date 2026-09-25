/**
 * E2E: User management (admin flow).
 * Prerequisites: Backend on :8080, frontend on :3000. Default user is ADMIN.
 */
describe('Users (admin)', () => {
  beforeEach(() => {
    cy.login('inventory', 'inventory-test-password');
  });

  it('admin can open Users, create a user, and see them in the list', () => {
    cy.get('[data-testid="nav-users"]').click();
    cy.url().should('include', '/users');
    cy.contains('h1', 'Users');

    cy.get('[data-testid="link-new-user"]').click();
    cy.url().should('include', '/users/new');
    cy.get('#user-username').type('e2eoperator');
    cy.get('#user-password').type('pass123');
    cy.get('#user-role').select('OPERATOR');
    cy.get('button[type="submit"]').click();

    cy.url().should('eq', Cypress.config().baseUrl + '/users');
    cy.contains('e2eoperator');
    cy.contains('OPERATOR');
  });

  it('admin can edit another user role', () => {
    cy.get('[data-testid="nav-users"]').click();
    cy.get('[data-testid="link-new-user"]').click();
    cy.get('#user-username').type('e2eedit');
    cy.get('#user-password').type('pass123');
    cy.get('#user-role').select('OPERATOR');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/users');
    cy.get('table').contains('e2eedit').parent('tr').within(() => cy.get('[data-testid="user-edit-link"]').click());
    cy.get('#user-role').select('VIEWER');
    cy.get('button[type="submit"]').click();
    cy.contains('e2eedit');
    cy.contains('VIEWER');
  });
});
