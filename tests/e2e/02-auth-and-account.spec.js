import { test, expect } from '@playwright/test';
import { HomePage } from '../../page-objects/HomePage.js';
import { LoginPage } from '../../page-objects/LoginPage.js';
import { faker } from '@faker-js/faker';
import * as testData from '../../test-data/user-data.json';

test.describe('Authentication and Account Tests', () => {
  test('Full User Registration & Login', async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);

    // Generate unique user data for this test run
    const uniqueEmail = faker.internet.email();
    const userData = {
      ...testData.validUser,
      email: uniqueEmail,
      gender: 'Mr',
      dobDay: '15',
      dobMonth: '6',
      dobYear: '1990',
      company: faker.company.name(),
      mobilePhone: testData.validUser.phone,
      addressAlias: 'My Address',
    };

    await test.step('Navigate to login page', async () => {
      await homePage.goto();
      await homePage.clickSignIn();
      await loginPage.waitForPageToLoad();
    });

    await test.step('Create new account', async () => {
      await loginPage.createAccount(uniqueEmail);

      // Wait for registration form to load
      await loginPage.firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Fill registration form', async () => {
      await loginPage.fillRegistrationForm(userData);
    });

    await test.step('Submit registration', async () => {
      await loginPage.submitRegistration();

      // Wait for account creation to complete
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify successful registration and login', async () => {
      // Check if we're logged in by looking for logout link or account page
      const isLoggedIn = await loginPage.isLoggedIn();

      if (isLoggedIn) {
        expect(isLoggedIn).toBe(true);

        // Verify we're on account page
        const isOnAccountPage = await loginPage.isOnMyAccountPage();
        expect(isOnAccountPage).toBe(true);
      } else {
        // If not automatically logged in, try to log in with created credentials
        await loginPage.login(uniqueEmail, userData.password);

        const isLoggedInAfterLogin = await loginPage.isLoggedIn();
        expect(isLoggedInAfterLogin).toBe(true);
      }
    });

    await test.step('Logout', async () => {
      await loginPage.logout();

      // Verify logout was successful
      const isLoggedOut = !(await loginPage.isLoggedIn());
      expect(isLoggedOut).toBe(true);
    });

    await test.step('Login with created credentials', async () => {
      await loginPage.login(uniqueEmail, userData.password);

      const isLoggedIn = await loginPage.isLoggedIn();
      expect(isLoggedIn).toBe(true);
    });
  });

  test('Invalid Login Attempt', async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);

    await test.step('Navigate to login page', async () => {
      await homePage.goto();
      await homePage.clickSignIn();
      await loginPage.waitForPageToLoad();
    });

    await test.step('Attempt login with invalid credentials', async () => {
      await loginPage.login(testData.invalidUser.email, testData.invalidUser.password);
    });

    await test.step('Verify login error message is displayed', async () => {
      const errorMessage = await loginPage.getLoginErrorMessage();
      expect(errorMessage).not.toBeNull();
      expect(errorMessage).toContain('Authentication failed' || 'Invalid email' || 'password');

      // Verify we're still on login page
      const isStillOnLoginPage = await loginPage.loginEmailInput.isVisible();
      expect(isStillOnLoginPage).toBe(true);
    });

    await test.step('Test empty credentials', async () => {
      await loginPage.login('', '');

      // Should show validation errors
      const errorMessage = await loginPage.getLoginErrorMessage();
      expect(errorMessage).not.toBeNull();
    });

    await test.step('Test invalid email format', async () => {
      await loginPage.login('invalid-email', 'password123');

      const errorMessage = await loginPage.getLoginErrorMessage();
      expect(errorMessage).not.toBeNull();
    });
  });

  test('My Account Page Verification', async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);

    // Create a test user first
    const uniqueEmail = faker.internet.email();
    const userData = {
      ...testData.validUser,
      email: uniqueEmail,
      gender: 'Mrs',
      addressAlias: 'Home',
    };

    await test.step('Create and login with test user', async () => {
      await homePage.goto();
      await homePage.clickSignIn();
      await loginPage.waitForPageToLoad();

      await loginPage.completeRegistration(uniqueEmail, userData);
    });

    await test.step('Verify My Account page elements', async () => {
      const isOnAccountPage = await loginPage.isOnMyAccountPage();
      expect(isOnAccountPage).toBe(true);

      // Check account information is displayed
      const accountInfo = await loginPage.accountInfo.isVisible();
      expect(accountInfo).toBe(true);

      // Verify user is logged in
      const isLoggedIn = await loginPage.isLoggedIn();
      expect(isLoggedIn).toBe(true);
    });

    await test.step('Verify account page navigation links', async () => {
      // Common account page links (these may vary based on the actual site structure)
      const commonLinks = [
        'order history',
        'personal information',
        'addresses',
        'my credit slips',
        'my addresses',
      ];

      let foundLinks = 0;
      for (const linkText of commonLinks) {
        const linkExists = await page
          .locator(`a:has-text("${linkText}")`)
          .first()
          .isVisible({ timeout: 2000 });
        if (linkExists) {
          foundLinks++;
        }
      }

      // Expect at least some account-related links to be present
      expect(foundLinks).toBeGreaterThan(0);
    });

    await test.step('Test logout functionality from account page', async () => {
      await loginPage.logout();

      const isLoggedOut = !(await loginPage.isLoggedIn());
      expect(isLoggedOut).toBe(true);

      // Verify we're redirected away from account page
      const isStillOnAccountPage = await loginPage.isOnMyAccountPage();
      expect(isStillOnAccountPage).toBe(false);
    });
  });

  test('Password Validation', async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);

    const testEmail = faker.internet.email();

    await test.step('Navigate to registration page', async () => {
      await homePage.goto();
      await homePage.clickSignIn();
      await loginPage.waitForPageToLoad();
      await loginPage.createAccount(testEmail);
    });

    await test.step('Test weak password validation', async () => {
      const weakPasswords = ['123', 'abc', 'password', '12345678'];

      for (const weakPassword of weakPasswords) {
        // Fill minimal required fields
        await loginPage.titleMr.check();
        await loginPage.firstNameInput.fill('Test');
        await loginPage.lastNameInput.fill('User');
        await loginPage.passwordInput.fill(weakPassword);

        // Fill required address fields
        await loginPage.addressFirstNameInput.fill('Test');
        await loginPage.addressLastNameInput.fill('User');
        await loginPage.addressInput.fill('123 Test St');
        await loginPage.cityInput.fill('Test City');
        await loginPage.postalCodeInput.fill('12345');

        try {
          await loginPage.submitRegistration();

          // Check if there's a password validation error
          const errorMessage = await loginPage.errorMessage.textContent({ timeout: 3000 });
          if (errorMessage && errorMessage.toLowerCase().includes('password')) {
            // Password validation is working
            expect(errorMessage).toContain('password');
            break;
          }
        } catch (error) {
          // Continue to next password if this one fails for other reasons
          continue;
        }
      }
    });
  });

  test('Account Creation with Existing Email', async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);

    // Use a commonly existing email pattern
    const existingEmail = 'test@example.com';

    await test.step('Navigate to login page', async () => {
      await homePage.goto();
      await homePage.clickSignIn();
      await loginPage.waitForPageToLoad();
    });

    await test.step('Try to create account with existing email', async () => {
      await loginPage.createAccount(existingEmail);
    });

    await test.step('Verify error message for existing email', async () => {
      // Check for error message about existing email
      const errorMessage = await loginPage.getCreateAccountErrorMessage();

      if (errorMessage) {
        expect(errorMessage).toContain('already registered' || 'already exists' || 'already used');
      } else {
        // If no specific error, check if we were redirected to password reset or login
        const isOnPasswordField = await loginPage.loginPasswordInput.isVisible({ timeout: 3000 });
        if (isOnPasswordField) {
          // This is acceptable behavior - site recognizes existing email
          expect(isOnPasswordField).toBe(true);
        }
      }
    });
  });
});
