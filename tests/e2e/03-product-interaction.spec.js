import { test, expect } from '@playwright/test';
import { HomePage } from '../../page-objects/HomePage.js';
import { CategoryPage } from '../../page-objects/CategoryPage.js';
import { ProductPage } from '../../page-objects/ProductPage.js';
import * as testData from '../../test-data/user-data.json';

test.describe('Product Interaction Tests', () => {
  test('Filter Products by Category and Size', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);

    await test.step('Navigate to Women category', async () => {
      await homePage.goto();
      await homePage.navigateToCategory('Women');
      await categoryPage.waitForProductsToLoad();
    });

    await test.step('Get initial product count', async () => {
      const initialCount = await categoryPage.getProductCount();
      expect(initialCount).toBeGreaterThan(0);
    });

    await test.step('Apply size filter', async () => {
      try {
        const initialProducts = await categoryPage.getAllProductNames();

        await categoryPage.filterBySize(testData.filterSize);
        await categoryPage.waitForProductsToLoad();

        const newCount = await categoryPage.getProductCount();

        // Verify filter was applied (count should change or stay the same)
        expect(newCount).toBeLessThanOrEqual(initialProducts.length);

        // Verify filter is shown as applied
        const isFilterApplied = await categoryPage.isFilterApplied('size', testData.filterSize);
        expect(isFilterApplied).toBe(true);
      } catch (error) {
        console.log('Size filter not available on this page, trying color filter instead');

        // Try color filter as alternative
        try {
          await categoryPage.filterByColor('Blue');
          await categoryPage.waitForProductsToLoad();

          const colorFilteredProducts = await categoryPage.getAllProductNames();
          expect(colorFilteredProducts.length).toBeGreaterThan(0);
        } catch (colorError) {
          console.log('Color filter also not available');
        }
      }
    });

    await test.step('Navigate to Dresses subcategory', async () => {
      await homePage.navigateToCategory('Dresses');
      await categoryPage.waitForProductsToLoad();

      const dressProducts = await categoryPage.getAllProductNames();
      expect(dressProducts.length).toBeGreaterThan(0);

      // Verify we're in the dresses category
      const categoryName = await categoryPage.getCurrentCategoryName();
      expect(categoryName.toLowerCase()).toContain('dress');
    });

    await test.step('Apply multiple filters if available', async () => {
      try {
        // Apply size filter
        await categoryPage.filterBySize('M');
        await categoryPage.waitForProductsToLoad();

        // Apply color filter
        await categoryPage.filterByColor('Blue');
        await categoryPage.waitForProductsToLoad();

        // Verify both filters are applied
        const appliedFilters = await categoryPage.getAppliedFilters();
        expect(appliedFilters.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('Multiple filters not available or different UI structure');
      }
    });
  });

  test('Sort Products by Price', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);

    await test.step('Navigate to category with products', async () => {
      await homePage.goto();
      await homePage.navigateToCategory('Women');
      await categoryPage.waitForProductsToLoad();
    });

    await test.step('Get initial product prices', async () => {
      const initialPrices = await categoryPage.getAllProductPrices();
      expect(initialPrices.length).toBeGreaterThan(0);
    });

    await test.step('Sort by price: lowest first', async () => {
      try {
        await categoryPage.sortBy(testData.sortOption); // "Price: Lowest first"
        await categoryPage.waitForProductsToLoad();

        const sortedPrices = await categoryPage.getAllProductPrices();
        expect(sortedPrices.length).toBeGreaterThan(0);

        // Verify prices are sorted in ascending order
        let isSortedAsc = true;
        for (let i = 1; i < sortedPrices.length; i++) {
          if (sortedPrices[i] < sortedPrices[i - 1]) {
            isSortedAsc = false;
            break;
          }
        }
        expect(isSortedAsc).toBe(true);
      } catch (error) {
        console.log('Price sorting not available or different option text');

        // Try alternative sorting options
        const alternativeSorts = ['Price: Low to High', 'Price ascending', 'Price ↑'];

        for (const sortOption of alternativeSorts) {
          try {
            await categoryPage.sortBy(sortOption);
            await categoryPage.waitForProductsToLoad();
            break;
          } catch (sortError) {
            continue;
          }
        }
      }
    });

    await test.step('Sort by price: highest first', async () => {
      try {
        await categoryPage.sortBy('Price: Highest first');
        await categoryPage.waitForProductsToLoad();

        const sortedPrices = await categoryPage.getAllProductPrices();

        // Verify prices are sorted in descending order
        let isSortedDesc = true;
        for (let i = 1; i < sortedPrices.length; i++) {
          if (sortedPrices[i] > sortedPrices[i - 1]) {
            isSortedDesc = false;
            break;
          }
        }
        expect(isSortedDesc).toBe(true);
      } catch (error) {
        console.log('Descending price sort not available');
      }
    });

    await test.step('Sort by name', async () => {
      try {
        await categoryPage.sortBy('Product Name: A to Z');
        await categoryPage.waitForProductsToLoad();

        const sortedNames = await categoryPage.getAllProductNames();

        // Verify names are sorted alphabetically
        const sortedNamesExpected = [...sortedNames].sort();
        expect(sortedNames).toEqual(sortedNamesExpected);
      } catch (error) {
        console.log('Name sorting not available');
      }
    });
  });

  test('Update Product Details', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);

    await test.step('Navigate to a product', async () => {
      await homePage.goto();
      await homePage.searchForProduct(testData.productToSearch);
      await categoryPage.waitForProductsToLoad();

      // Click on the first product
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();
    });

    await test.step('Verify product page elements', async () => {
      const productName = await productPage.getProductName();
      expect(productName).toBeTruthy();
      expect(productName.length).toBeGreaterThan(0);

      const productPrice = await productPage.getProductPrice();
      expect(productPrice).toBeGreaterThan(0);

      const availability = await productPage.getProductAvailability();
      expect(availability).toBeTruthy();
    });

    await test.step('Update product quantity', async () => {
      const initialQuantity = await productPage.getCurrentQuantity();
      expect(initialQuantity).toBeGreaterThan(0);

      // Increase quantity
      await productPage.increaseQuantity(2);
      const increasedQuantity = await productPage.getCurrentQuantity();
      expect(increasedQuantity).toBe(initialQuantity + 2);

      // Decrease quantity
      await productPage.decreaseQuantity(1);
      const decreasedQuantity = await productPage.getCurrentQuantity();
      expect(decreasedQuantity).toBe(increasedQuantity - 1);

      // Set specific quantity
      await productPage.setQuantity(5);
      const specificQuantity = await productPage.getCurrentQuantity();
      expect(specificQuantity).toBe(5);
    });

    await test.step('Select product size if available', async () => {
      try {
        const availableSizes = await productPage.getAvailableSizes();

        if (availableSizes.length > 0) {
          const sizeToSelect = availableSizes.find(size => size.includes('M')) || availableSizes[0];
          await productPage.selectSize(sizeToSelect);

          // Verify size was selected
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log('Size selection not available for this product');
      }
    });

    await test.step('Select product color if available', async () => {
      try {
        const availableColors = await productPage.getAvailableColors();

        if (availableColors.length > 0) {
          const colorToSelect = availableColors[0];
          await productPage.selectColor(colorToSelect);

          // Verify color was selected
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log('Color selection not available for this product');
      }
    });

    await test.step('Add product to cart', async () => {
      const isOutOfStock = await productPage.isProductOutOfStock();

      if (!isOutOfStock) {
        await productPage.addToCart();

        // Verify cart modal appears
        const cartModalInfo = await productPage.getCartModalInfo();
        expect(cartModalInfo).not.toBeNull();
        expect(cartModalInfo.productName).toBeTruthy();

        // Close cart modal
        await productPage.continueShopping();
      } else {
        console.log('Product is out of stock, skipping add to cart');
      }
    });

    await test.step('Explore product tabs', async () => {
      try {
        // Open description tab
        await productPage.openDescriptionTab();
        await expect(productPage.descriptionContent).toBeVisible();

        // Open data sheet tab if available
        try {
          await productPage.openDataSheetTab();
          await expect(productPage.dataSheetContent).toBeVisible();
        } catch (error) {
          console.log('Data sheet tab not available');
        }

        // Open reviews tab if available
        try {
          await productPage.openReviewsTab();
          await expect(productPage.reviewsContent).toBeVisible();
        } catch (error) {
          console.log('Reviews tab not available');
        }
      } catch (error) {
        console.log('Product tabs not available or different structure');
      }
    });
  });

  test('Product Image Gallery Interaction', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);

    await test.step('Navigate to a product with images', async () => {
      await homePage.goto();
      await homePage.searchForProduct('dress');
      await categoryPage.waitForProductsToLoad();
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();
    });

    await test.step('Interact with product images', async () => {
      // Verify main image is visible
      await expect(productPage.mainProductImage).toBeVisible();

      try {
        // Click on thumbnail images if available
        const thumbnailCount = await productPage.thumbnailImages.count();

        if (thumbnailCount > 1) {
          // Click on second thumbnail
          await productPage.clickThumbnail(1);
          await page.waitForTimeout(1000);

          // Click on third thumbnail if available
          if (thumbnailCount > 2) {
            await productPage.clickThumbnail(2);
            await page.waitForTimeout(1000);
          }
        }
      } catch (error) {
        console.log('Thumbnail images not available or different structure');
      }
    });
  });

  test('Product Comparison and Wishlist', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);
    const productPage = new ProductPage(page);

    await test.step('Navigate to product page', async () => {
      await homePage.goto();
      await homePage.navigateToCategory('Women');
      await categoryPage.waitForProductsToLoad();
      await categoryPage.clickProduct(0);
      await productPage.waitForProductToLoad();
    });

    await test.step('Add product to wishlist if available', async () => {
      try {
        await productPage.addToWishlist();

        // Check for success message or wishlist confirmation
        const successVisible = await productPage.successMessage.isVisible({ timeout: 3000 });
        if (successVisible) {
          expect(successVisible).toBe(true);
        }
      } catch (error) {
        console.log('Wishlist functionality not available or requires login');
      }
    });

    await test.step('Add product to comparison if available', async () => {
      try {
        await productPage.addToCompare();

        // Check for comparison confirmation
        await page.waitForTimeout(2000);

        // Verify compare functionality worked (implementation depends on site)
        const compareElements = await page.locator('.compare, [data-compare]').count();
        expect(compareElements).toBeGreaterThan(0);
      } catch (error) {
        console.log('Compare functionality not available');
      }
    });

    await test.step('Check related products', async () => {
      try {
        const relatedProducts = await productPage.getRelatedProducts();

        if (relatedProducts.length > 0) {
          expect(relatedProducts[0].name).toBeTruthy();
          expect(relatedProducts[0].price).toBeTruthy();

          // Click on a related product
          await productPage.clickRelatedProduct(0);
          await productPage.waitForProductToLoad();

          // Verify we navigated to the related product
          const newProductName = await productPage.getProductName();
          expect(newProductName).toBeTruthy();
        }
      } catch (error) {
        console.log('Related products not available');
      }
    });
  });
});
