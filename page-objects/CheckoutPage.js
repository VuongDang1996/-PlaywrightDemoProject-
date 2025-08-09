export class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.proceedToCheckoutSummaryBtn = page.locator('.cart_navigation .button');
    this.emailInput = page.locator('#email_create');
    this.createAccountBtn = page.locator('#SubmitCreate');
    // Add more locators for the guest checkout form as needed...
  }

  async proceedFromSummary() {
    await this.proceedToCheckoutSummaryBtn.click();
  }

  async enterGuestEmail(email) {
    await this.emailInput.fill(email);
    await this.createAccountBtn.click();
  }
}
