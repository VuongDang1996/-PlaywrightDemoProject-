export class LoginPage {
  constructor(page) {
    this.page = page;

    // Login form elements
    this.loginEmailInput = page.locator('#email');
    this.loginPasswordInput = page.locator('#passwd');
    this.loginSubmitButton = page.locator('#SubmitLogin');
    this.loginError = page.locator('.alert-danger');

    // Create account form elements
    this.createAccountEmailInput = page.locator('#email_create');
    this.createAccountButton = page.locator('#SubmitCreate');
    this.createAccountError = page.locator('.alert-danger');

    // Registration form elements (appears after create account)
    this.titleMr = page.locator('#id_gender1');
    this.titleMrs = page.locator('#id_gender2');
    this.firstNameInput = page.locator('#customer_firstname');
    this.lastNameInput = page.locator('#customer_lastname');
    this.passwordInput = page.locator('#passwd');
    this.dobDaySelect = page.locator('#days');
    this.dobMonthSelect = page.locator('#months');
    this.dobYearSelect = page.locator('#years');
    this.newsletterCheckbox = page.locator('#newsletter');
    this.offersCheckbox = page.locator('#optin');

    // Address form elements
    this.addressFirstNameInput = page.locator('#firstname');
    this.addressLastNameInput = page.locator('#lastname');
    this.companyInput = page.locator('#company');
    this.addressInput = page.locator('#address1');
    this.address2Input = page.locator('#address2');
    this.cityInput = page.locator('#city');
    this.stateSelect = page.locator('#id_state');
    this.postalCodeInput = page.locator('#postcode');
    this.countrySelect = page.locator('#id_country');
    this.additionalInfoInput = page.locator('#other');
    this.homePhoneInput = page.locator('#phone');
    this.mobilePhoneInput = page.locator('#phone_mobile');
    this.addressAliasInput = page.locator('#alias');

    // Submit button for registration
    this.registerButton = page.locator('#submitAccount');

    // Success/Error messages
    this.successMessage = page.locator('.alert-success');
    this.errorMessage = page.locator('.alert-danger');

    // Account page elements
    this.myAccountTitle = page.locator('.page-heading');
    this.accountInfo = page.locator('.info-account');
    this.logoutLink = page.locator('.logout');
  }

  async login(email, password) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async createAccount(email) {
    await this.createAccountEmailInput.fill(email);
    await this.createAccountButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillRegistrationForm(userData) {
    // Personal information
    if (userData.gender === 'Mr') {
      await this.titleMr.check();
    } else {
      await this.titleMrs.check();
    }

    await this.firstNameInput.fill(userData.firstName);
    await this.lastNameInput.fill(userData.lastName);
    await this.passwordInput.fill(userData.password);

    // Date of birth (optional)
    if (userData.dobDay) {
      await this.dobDaySelect.selectOption(userData.dobDay);
    }
    if (userData.dobMonth) {
      await this.dobMonthSelect.selectOption(userData.dobMonth);
    }
    if (userData.dobYear) {
      await this.dobYearSelect.selectOption(userData.dobYear);
    }

    // Address information
    await this.addressFirstNameInput.fill(userData.firstName);
    await this.addressLastNameInput.fill(userData.lastName);

    if (userData.company) {
      await this.companyInput.fill(userData.company);
    }

    await this.addressInput.fill(userData.address);

    if (userData.address2) {
      await this.address2Input.fill(userData.address2);
    }

    await this.cityInput.fill(userData.city);

    if (userData.state) {
      await this.stateSelect.selectOption({ label: userData.state });
    }

    await this.postalCodeInput.fill(userData.zipCode);

    if (userData.country) {
      await this.countrySelect.selectOption({ label: userData.country });
    }

    if (userData.additionalInfo) {
      await this.additionalInfoInput.fill(userData.additionalInfo);
    }

    if (userData.homePhone) {
      await this.homePhoneInput.fill(userData.homePhone);
    }

    if (userData.mobilePhone) {
      await this.mobilePhoneInput.fill(userData.mobilePhone);
    }

    if (userData.addressAlias) {
      await this.addressAliasInput.fill(userData.addressAlias);
    }
  }

  async submitRegistration() {
    await this.registerButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async completeRegistration(email, userData) {
    await this.createAccount(email);
    await this.fillRegistrationForm(userData);
    await this.submitRegistration();
  }

  async logout() {
    await this.logoutLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getLoginErrorMessage() {
    if (await this.loginError.isVisible()) {
      return await this.loginError.textContent();
    }
    return null;
  }

  async getCreateAccountErrorMessage() {
    if (await this.createAccountError.isVisible()) {
      return await this.createAccountError.textContent();
    }
    return null;
  }

  async isLoggedIn() {
    return await this.logoutLink.isVisible();
  }

  async isOnMyAccountPage() {
    return (
      (await this.myAccountTitle.isVisible()) &&
      (await this.myAccountTitle.textContent()).includes('My account')
    );
  }
}
