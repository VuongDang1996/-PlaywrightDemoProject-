export class HomePage {
  constructor(page) {
    this.page = page;
    // Search elements
    this.searchQueryInput = page.locator('#search_query_top');
    this.searchQuerySubmit = page.locator('[name="submit_search"]');
    this.searchAutoComplete = page.locator('.ac_results');
    this.searchNoResults = page.locator('.alert-warning');

    // Navigation elements
    this.signInLink = page.locator('.login');
    this.contactUsLink = page.locator('#contact-link a');
    this.logo = page.locator('#header_logo');

    // Product elements
    this.addToCartButton = page.locator('.ajax_add_to_cart_button');
    this.proceedToCheckoutButton = page.locator('[title="Proceed to checkout"]');
    this.cartDropdown = page.locator('.shopping_cart');

    // Newsletter elements
    this.newsletterInput = page.locator('#newsletter-input');
    this.newsletterSubmit = page.locator('[name="submitNewsletter"]');
    this.newsletterSuccess = page.locator('.alert-success');
    this.newsletterError = page.locator('.alert-danger');

    // Category navigation
    this.womenCategory = page.locator('a[title="Women"]').first();
    this.dressesCategory = page.locator('a[title="Dresses"]').first();
    this.tshirtsCategory = page.locator('a[title="T-shirts"]').first();
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async searchForProduct(productName) {
    await this.searchQueryInput.fill(productName);
    await this.searchQuerySubmit.click();
    await this.page.waitForLoadState('networkidle');
  }

  async waitForSearchAutoComplete() {
    await this.searchAutoComplete.waitFor({ state: 'visible', timeout: 5000 });
  }

  async selectAutoCompleteOption(optionText) {
    await this.searchAutoComplete.locator(`text=${optionText}`).click();
  }

  async addFirstProductToCart() {
    await this.addToCartButton.first().click();
    await this.page.waitForTimeout(2000); // Wait for cart animation
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }

  async clickSignIn() {
    await this.signInLink.click();
  }

  async clickContactUs() {
    await this.contactUsLink.click();
  }

  async subscribeToNewsletter(email) {
    await this.newsletterInput.fill(email);
    await this.newsletterSubmit.click();
  }

  async navigateToCategory(categoryName) {
    switch (categoryName.toLowerCase()) {
      case 'women':
        await this.womenCategory.hover();
        await this.womenCategory.click();
        break;
      case 'dresses':
        await this.womenCategory.hover();
        await this.dressesCategory.click();
        break;
      case 't-shirts':
        await this.womenCategory.hover();
        await this.tshirtsCategory.click();
        break;
      default:
        throw new Error(`Category ${categoryName} not found`);
    }
    await this.page.waitForLoadState('networkidle');
  }

  async getSearchResultsCount() {
    try {
      // Try different possible selectors for result count
      const selectors = ['.product-count', '.heading-counter', '.toolbar-amount', '.nb-products'];
      for (const selector of selectors) {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 2000 })) {
          const resultsText = await element.textContent();
          return resultsText || '0';
        }
      }
      // If no count element found, count products directly
      const productCount = await this.page.locator('.product-container, .product_list li').count();
      return productCount.toString();
    } catch (error) {
      return '0';
    }
  }

  async isNoResultsDisplayed() {
    return await this.searchNoResults.isVisible();
  }
}
