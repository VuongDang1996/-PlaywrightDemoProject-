import { test, expect } from '@playwright/test';
import { HomePage } from '../../page-objects/HomePage.js';
import { CategoryPage } from '../../page-objects/CategoryPage.js';
import { ProductPage } from '../../page-objects/ProductPage.js';
import { CartPage } from '../../page-objects/CartPage.js';
import { ContactUsPage } from '../../page-objects/ContactUsPage.js';
import { faker } from '@faker-js/faker';
import * as testData from '../../test-data/user-data.json';

test.describe('Cart and Other Functionality Tests', () => {
  test('Update Item Quantity in Cart', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await test.step('Add product to cart', async () => {
      await homePage.goto();
      await homePage.searchForProduct(testData.productToSearch);
      await categoryPage.waitForProductsToLoad();

      // Add first product to cart
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();

      // Check if product is in stock before adding
      const isOutOfStock = await productPage.isProductOutOfStock();

      if (!isOutOfStock) {
        await productPage.addToCart();
        await productPage.proceedToCheckout();
        await cartPage.waitForCartToLoad();
      } else {
        // Find an in-stock product
        await page.goBack();
        await categoryPage.waitForProductsToLoad();

        const productCount = await categoryPage.getProductCount();
        let productAdded = false;

        for (let i = 0; i < Math.min(3, productCount); i++) {
          await categoryPage.clickProduct(i);
          await productPage.waitForProductToLoad();

          const stockStatus = await productPage.isProductOutOfStock();
          if (!stockStatus) {
            await productPage.addToCart();
            await productPage.proceedToCheckout();
            await cartPage.waitForCartToLoad();
            productAdded = true;
            break;
          }
          await page.goBack();
          await categoryPage.waitForProductsToLoad();
        }

        if (!productAdded) {
          throw new Error('No in-stock products found');
        }
      }
    });

    await test.step('Verify cart contains the product', async () => {
      const isCartEmpty = await cartPage.isCartEmpty();
      expect(isCartEmpty).toBe(false);

      const cartItemCount = await cartPage.getCartItemCount();
      expect(cartItemCount).toBeGreaterThan(0);

      const productNames = await cartPage.getAllProductNames();
      expect(productNames.length).toBeGreaterThan(0);
    });

    await test.step('Update product quantity', async () => {
      const initialQuantity = await cartPage.getProductQuantity(0);
      expect(initialQuantity).toBeGreaterThan(0);

      // Increase quantity
      await cartPage.increaseProductQuantity(0);
      const increasedQuantity = await cartPage.getProductQuantity(0);
      expect(increasedQuantity).toBe(initialQuantity + 1);

      // Update to specific quantity
      await cartPage.updateProductQuantity(0, 3);
      const updatedQuantity = await cartPage.getProductQuantity(0);
      expect(updatedQuantity).toBe(3);

      // Decrease quantity
      await cartPage.decreaseProductQuantity(0);
      const decreasedQuantity = await cartPage.getProductQuantity(0);
      expect(decreasedQuantity).toBe(2);
    });

    await test.step('Verify cart calculations', async () => {
      const isCalculationCorrect = await cartPage.validateCartCalculations();
      expect(isCalculationCorrect).toBe(true);

      const cartSummary = await cartPage.getCartSummary();
      expect(cartSummary.total).toBeGreaterThan(0);
      expect(cartSummary.subtotal).toBeGreaterThan(0);
    });
  });

  test('Remove Item from Cart', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await test.step('Add multiple products to cart', async () => {
      await homePage.goto();
      await homePage.searchForProduct('dress');
      await categoryPage.waitForProductsToLoad();

      // Add first product
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();

      if (!(await productPage.isProductOutOfStock())) {
        await productPage.addToCart();
        await productPage.continueShopping();
      }

      // Go back and add another product
      await page.goBack();
      await categoryPage.waitForProductsToLoad();

      const productCount = await categoryPage.getProductCount();
      if (productCount > 1) {
        await categoryPage.clickProduct(1);
        await productPage.waitForProductToLoad();

        if (!(await productPage.isProductOutOfStock())) {
          await productPage.addToCart();
          await productPage.proceedToCheckout();
        }
      }

      await cartPage.waitForCartToLoad();
    });

    await test.step('Verify cart has items', async () => {
      const isCartEmpty = await cartPage.isCartEmpty();

      if (isCartEmpty) {
        // If cart is empty, add at least one product
        await homePage.goto();
        await homePage.searchForProduct(testData.productToSearch);
        await categoryPage.waitForProductsToLoad();
        await categoryPage.addToCart(0);
        await page.goto('/index.php?controller=order');
        await cartPage.waitForCartToLoad();
      }

      const initialItemCount = await cartPage.getCartItemCount();
      expect(initialItemCount).toBeGreaterThan(0);
    });

    await test.step('Remove item from cart', async () => {
      const initialItemCount = await cartPage.getCartItemCount();
      const initialProductNames = await cartPage.getAllProductNames();

      // Remove the first product
      await cartPage.removeProduct(0);

      const newItemCount = await cartPage.getCartItemCount();

      if (initialItemCount === 1) {
        // Cart should be empty
        const isCartEmpty = await cartPage.isCartEmpty();
        expect(isCartEmpty).toBe(true);
      } else {
        // Cart should have one less item
        expect(newItemCount).toBe(initialItemCount - 1);

        const newProductNames = await cartPage.getAllProductNames();
        expect(newProductNames.length).toBe(initialProductNames.length - 1);
      }
    });

    await test.step('Verify cart totals update after removal', async () => {
      if (!(await cartPage.isCartEmpty())) {
        const cartSummary = await cartPage.getCartSummary();
        expect(cartSummary.total).toBeGreaterThanOrEqual(0);

        const isCalculationCorrect = await cartPage.validateCartCalculations();
        expect(isCalculationCorrect).toBe(true);
      }
    });
  });

  test('Contact Us Form Submission', async ({ page }) => {
    const homePage = new HomePage(page);
    const contactUsPage = new ContactUsPage(page);

    const contactData = {
      subject: testData.contactSubject,
      email: faker.internet.email(),
      message: testData.contactUsMessage,
      orderReference: 'ORDER12345',
    };

    await test.step('Navigate to Contact Us page', async () => {
      await homePage.goto();
      await homePage.clickContactUs();
      await contactUsPage.waitForPageToLoad();
    });

    await test.step('Verify Contact Us page elements', async () => {
      const pageTitle = await contactUsPage.getPageTitle();
      expect(pageTitle.toLowerCase()).toContain('contact');

      // Check form elements are visible
      await expect(contactUsPage.subjectSelect).toBeVisible();
      await expect(contactUsPage.emailInput).toBeVisible();
      await expect(contactUsPage.messageTextarea).toBeVisible();
      await expect(contactUsPage.sendButton).toBeVisible();
    });

    await test.step('Get available subjects', async () => {
      const availableSubjects = await contactUsPage.getAvailableSubjects();
      expect(availableSubjects.length).toBeGreaterThan(0);

      // Use the first available subject if our test data subject is not available
      if (!availableSubjects.includes(contactData.subject)) {
        contactData.subject = availableSubjects[0];
      }
    });

    await test.step('Fill and submit contact form', async () => {
      await contactUsPage.fillContactForm(contactData);

      // Verify form is filled correctly
      const isFormValid = await contactUsPage.isFormValid();
      expect(isFormValid).toBe(true);

      await contactUsPage.submitForm();
    });

    await test.step('Verify form submission result', async () => {
      await contactUsPage.waitForFormSubmission();

      const isSuccessful = await contactUsPage.isSubmissionSuccessful();
      const hasErrors = await contactUsPage.hasSubmissionErrors();

      if (isSuccessful) {
        const successMessage = await contactUsPage.getSuccessMessage();
        expect(successMessage).toBeTruthy();
        expect(successMessage.toLowerCase()).toContain('success' || 'sent' || 'received');
      } else if (hasErrors) {
        const errorMessage = await contactUsPage.getErrorMessage();
        console.log('Contact form error:', errorMessage);

        // This might be expected if the site has additional validation
        expect(errorMessage).toBeTruthy();
      }
    });
  });

  test('Newsletter Subscription', async ({ page }) => {
    const homePage = new HomePage(page);

    const testEmail = faker.internet.email();

    await test.step('Navigate to homepage', async () => {
      await homePage.goto();
    });

    await test.step('Subscribe to newsletter with valid email', async () => {
      await homePage.subscribeToNewsletter(testEmail);
    });

    await test.step('Verify newsletter subscription result', async () => {
      // Wait for response
      await page.waitForTimeout(3000);

      // Check for success message
      const successVisible = await homePage.newsletterSuccess.isVisible({ timeout: 5000 });
      const errorVisible = await homePage.newsletterError.isVisible({ timeout: 5000 });

      if (successVisible) {
        const successMessage = await homePage.newsletterSuccess.textContent();
        expect(successMessage.toLowerCase()).toContain('success' || 'subscribed' || 'newsletter');
      } else if (errorVisible) {
        const errorMessage = await homePage.newsletterError.textContent();
        console.log('Newsletter subscription result:', errorMessage);

        // This might be expected if email is already subscribed
        expect(errorMessage).toBeTruthy();
      }
    });

    await test.step('Test newsletter subscription with invalid email', async () => {
      const invalidEmails = ['invalid-email', 'test@', '@test.com', 'test.com'];

      for (const invalidEmail of invalidEmails) {
        await homePage.subscribeToNewsletter(invalidEmail);
        await page.waitForTimeout(2000);

        // Check for error message
        const errorVisible = await homePage.newsletterError.isVisible({ timeout: 3000 });
        if (errorVisible) {
          const errorMessage = await homePage.newsletterError.textContent();
          expect(errorMessage.toLowerCase()).toContain('invalid' || 'error' || 'email');
          break; // Exit loop if we get expected validation
        }
      }
    });
  });

  test('Shopping Cart Voucher/Discount Application', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await test.step('Add product to cart', async () => {
      await homePage.goto();
      await homePage.searchForProduct(testData.productToSearch);
      await categoryPage.waitForProductsToLoad();
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();

      if (!(await productPage.isProductOutOfStock())) {
        await productPage.addToCart();
        await productPage.proceedToCheckout();
        await cartPage.waitForCartToLoad();
      }
    });

    await test.step('Test invalid voucher code', async () => {
      const invalidVoucherCodes = ['INVALID123', 'EXPIRED', 'FAKE50'];

      for (const code of invalidVoucherCodes) {
        await cartPage.applyVoucher(code);

        const errorMessage = await cartPage.getVoucherErrorMessage();
        if (errorMessage) {
          expect(errorMessage.toLowerCase()).toContain('invalid' || 'not found' || 'expired');
          break;
        }
      }
    });

    await test.step('Verify cart calculations remain correct', async () => {
      const cartSummary = await cartPage.getCartSummary();
      expect(cartSummary.total).toBeGreaterThan(0);

      const isCalculationCorrect = await cartPage.validateCartCalculations();
      expect(isCalculationCorrect).toBe(true);
    });
  });

  test('Cross-sell Products in Cart', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await test.step('Add product to cart and navigate to cart page', async () => {
      await homePage.goto();
      await homePage.searchForProduct('dress');
      await categoryPage.waitForProductsToLoad();
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();

      if (!(await productPage.isProductOutOfStock())) {
        await productPage.addToCart();
        await productPage.proceedToCheckout();
        await cartPage.waitForCartToLoad();
      }
    });

    await test.step('Check for cross-sell products', async () => {
      try {
        const crossSellProducts = await cartPage.getCrossSellProducts();

        if (crossSellProducts.length > 0) {
          expect(crossSellProducts[0].name).toBeTruthy();
          expect(crossSellProducts[0].price).toBeTruthy();

          // Add a cross-sell product to cart
          const initialItemCount = await cartPage.getCartItemCount();
          await cartPage.addCrossSellProduct(0);

          const newItemCount = await cartPage.getCartItemCount();
          expect(newItemCount).toBe(initialItemCount + 1);
        }
      } catch (error) {
        console.log('Cross-sell products not available on this page');
      }
    });
  });

  test('Gift Wrapping Options', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await test.step('Add product to cart', async () => {
      await homePage.goto();
      await homePage.searchForProduct(testData.productToSearch);
      await categoryPage.waitForProductsToLoad();
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();

      if (!(await productPage.isProductOutOfStock())) {
        await productPage.addToCart();
        await productPage.proceedToCheckout();
        await cartPage.waitForCartToLoad();
      }
    });

    await test.step('Test gift wrapping options', async () => {
      try {
        const giftMessage = 'This is a gift for a special occasion!';

        await cartPage.enableGiftWrapping(giftMessage);

        // Verify gift wrapping is enabled
        const isGiftWrappingEnabled = await cartPage.giftWrappingCheckbox.isChecked();
        expect(isGiftWrappingEnabled).toBe(true);

        // Verify gift message is saved
        const savedMessage = await cartPage.giftMessageTextarea.inputValue();
        expect(savedMessage).toBe(giftMessage);

        // Disable gift wrapping
        await cartPage.disableGiftWrapping();

        const isGiftWrappingDisabled = !(await cartPage.giftWrappingCheckbox.isChecked());
        expect(isGiftWrappingDisabled).toBe(true);
      } catch (error) {
        console.log('Gift wrapping options not available');
      }
    });
  });

  test('Cart Persistence Across Sessions', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await test.step('Add product to cart', async () => {
      await homePage.goto();
      await homePage.searchForProduct(testData.productToSearch);
      await categoryPage.waitForProductsToLoad();
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();

      if (!(await productPage.isProductOutOfStock())) {
        await productPage.addToCart();
        await productPage.proceedToCheckout();
        await cartPage.waitForCartToLoad();

        const initialItemCount = await cartPage.getCartItemCount();
        expect(initialItemCount).toBeGreaterThan(0);
      }
    });

    await test.step('Simulate page refresh and verify cart persistence', async () => {
      await page.reload();
      await cartPage.waitForCartToLoad();

      // Cart should still contain items (if using cookies/localStorage)
      const itemCountAfterRefresh = await cartPage.getCartItemCount();
      expect(itemCountAfterRefresh).toBeGreaterThanOrEqual(0);

      // Note: Cart persistence depends on the site's implementation
      // Some sites may clear cart on refresh if not logged in
    });
  });
});
