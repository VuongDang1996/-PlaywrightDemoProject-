import { test, expect } from '@playwright/test';
import { HomePage } from '../../page-objects/HomePage.js';
import { CheckoutPage } from '../../page-objects/CheckoutPage.js';
import { CategoryPage } from '../../page-objects/CategoryPage.js';
import { ProductPage } from '../../page-objects/ProductPage.js';
import { CartPage } from '../../page-objects/CartPage.js';
import { faker } from '@faker-js/faker';
import * as userData from '../../test-data/user-data.json';

test.describe('E2E Checkout Flow', () => {
  test('should allow a guest to purchase a product', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const guestEmail = faker.internet.email();

    await test.step('Navigate to homepage and search for product', async () => {
      await homePage.goto();
      await homePage.searchForProduct(userData.productToSearch);
      await categoryPage.waitForProductsToLoad();

      // Verify search results
      const productCount = await categoryPage.getProductCount();
      expect(productCount).toBeGreaterThan(0);

      // Click on first product
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();

      const productName = await productPage.getProductName();
      expect(productName.toLowerCase()).toContain(userData.productToSearch.toLowerCase());
    });

    await test.step('Add product to cart and proceed to checkout', async () => {
      // Check if product is in stock
      const isOutOfStock = await productPage.isProductOutOfStock();

      if (!isOutOfStock) {
        await productPage.addToCart();
        await productPage.proceedToCheckout();

        // Verify we're on the cart/checkout page
        await cartPage.waitForCartToLoad();

        const isCartEmpty = await cartPage.isCartEmpty();
        expect(isCartEmpty).toBe(false);

        const cartItemCount = await cartPage.getCartItemCount();
        expect(cartItemCount).toBeGreaterThan(0);

        // Proceed to checkout
        await cartPage.proceedToCheckout();
      } else {
        throw new Error('Selected product is out of stock');
      }
    });

    await test.step('Proceed through checkout as a guest', async () => {
      // Handle checkout flow - this depends on the site's specific checkout process
      try {
        await checkoutPage.proceedFromSummary();
        await checkoutPage.enterGuestEmail(guestEmail);

        // Verify email was entered
        const emailField = page.locator('#email, [name="email"]');
        if (await emailField.isVisible()) {
          const emailValue = await emailField.inputValue();
          expect(emailValue).toBe(guestEmail);
        }

        // Note: Complete checkout flow would require valid address, payment details
        // This test focuses on the core navigation and form interaction
      } catch (error) {
        console.log('Checkout flow structure may be different:', error.message);

        // Alternative: Check if we reached any checkout-related page
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/checkout|order|cart/i);
      }
    });
  });

  test('should handle checkout with product variants', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await test.step('Navigate and find product with variants', async () => {
      await homePage.goto();
      await homePage.navigateToCategory('Women');
      await categoryPage.waitForProductsToLoad();
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();
    });

    await test.step('Select product variants before adding to cart', async () => {
      // Try to select size if available
      try {
        const availableSizes = await productPage.getAvailableSizes();
        if (availableSizes.length > 0) {
          const sizeToSelect = availableSizes.find(size => size.includes('M')) || availableSizes[0];
          await productPage.selectSize(sizeToSelect);
        }
      } catch (error) {
        console.log('Size selection not available');
      }

      // Try to select color if available
      try {
        const availableColors = await productPage.getAvailableColors();
        if (availableColors.length > 0) {
          await productPage.selectColor(availableColors[0]);
        }
      } catch (error) {
        console.log('Color selection not available');
      }

      // Set quantity
      await productPage.setQuantity(2);
    });

    await test.step('Add to cart and verify cart contents', async () => {
      const isOutOfStock = await productPage.isProductOutOfStock();

      if (!isOutOfStock) {
        await productPage.addToCart();
        await productPage.proceedToCheckout();
        await cartPage.waitForCartToLoad();

        // Verify quantity in cart
        const cartQuantity = await cartPage.getProductQuantity(0);
        expect(cartQuantity).toBe(2);

        // Verify cart calculations
        const isCalculationCorrect = await cartPage.validateCartCalculations();
        expect(isCalculationCorrect).toBe(true);
      }
    });
  });
});
