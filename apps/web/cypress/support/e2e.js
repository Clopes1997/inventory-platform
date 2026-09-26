// Cypress E2E support.
// E2E depends on backend (:8080) and frontend (:3000). CI should wait for health/port before running.
// retries (runMode: 2) in cypress.config.js reduces flakiness; use cy.intercept + wait for API in specs for stability.
Cypress.Commands.add('login', (username, password) => {
  cy.task('workflowCredentials', null, {log:false}).then(credentials => {
  username ??= credentials.username; password ??= credentials.password;
  cy.intercept('POST', '**/api/auth/login').as('sessionLogin');
  cy.visit('/login');
  cy.get('#login-username').type(username);
  cy.get('#login-password').type(password, {log:false});
  cy.get('button[type="submit"]').click();
  cy.wait('@sessionLogin').then(({ response }) => {
    expect(response.statusCode, 'login HTTP status').to.equal(200);
    cy.wrap(response.body.token, { log: false }).as('apiToken');
  });
  cy.url().should('not.include', '/login');
  });
});
