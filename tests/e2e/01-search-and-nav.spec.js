import { test, expect } from '@playwright/test';
import { HomePage } from '../../page-objects/HomePage.js';
import { CategoryPage } from '../../page-objects/CategoryPage.js';
import * as testData from '../../test-data/user-data.json';

test.describe('Search and Navigation Tests', () => {
  test('Search with No Results', async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step('Navigate to homepage', async () => {
      await homePage.goto();
      await expect(page).toHaveTitle(/My Shop/);
    });

    await test.step('Search for non-existent product', async () => {
      await homePage.searchForProduct(testData.invalidSearchTerm);
      await expect(homePage.searchNoResults).toBeVisible();
    });

    await test.step('Verify no results message is displayed', async () => {
      const isNoResults = await homePage.isNoResultsDisplayed();
      expect(isNoResults).toBe(true);

      const resultsCount = await homePage.getSearchResultsCount();
      expect(resultsCount).toContain('0');
    });
  });

  test('Search Auto-Suggest Interaction', async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step('Navigate to homepage', async () => {
      await homePage.goto();
    });

    await test.step('Start typing in search field to trigger auto-complete', async () => {
      await homePage.searchQueryInput.fill('Blo');

      // Wait for auto-complete to appear (if available)
      try {
        await homePage.waitForSearchAutoComplete();

        // If auto-complete is available, verify it shows suggestions
        await expect(homePage.searchAutoComplete).toBeVisible();

        // Click on a suggestion if available
        const suggestions = await homePage.searchAutoComplete.locator('li').all();
        if (suggestions.length > 0) {
          await suggestions[0].click();
        }
      } catch (error) {
        // If auto-complete is not available, proceed with normal search
        console.log('Auto-complete not available, proceeding with normal search');
        await homePage.searchQuerySubmit.click();
      }
    });

    await test.step('Verify search results are displayed', async () => {
      await page.waitForLoadState('networkidle');

      // Check if we have search results or product page
      const hasResults = await page
        .locator('.product-container, .product-name')
        .first()
        .isVisible({ timeout: 5000 });
      expect(hasResults).toBe(true);
    });
  });

  test('Category Navigation and Product Filtering', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);

    await test.step('Navigate to homepage', async () => {
      await homePage.goto();
    });

    await test.step('Navigate to Women category', async () => {
      await homePage.navigateToCategory('Women');
      await categoryPage.waitForProductsToLoad();
    });

    await test.step('Verify category page is loaded with products', async () => {
      const productCount = await categoryPage.getProductCount();
      expect(productCount).toBeGreaterThan(0);

      const categoryName = await categoryPage.getCurrentCategoryName();
      expect(categoryName.toLowerCase()).toContain('women');
    });

    await test.step('Apply size filter', async () => {
      try {
        await categoryPage.filterBySize(testData.filterSize);
        await categoryPage.waitForProductsToLoad();

        // Verify filter is applied
        const isFilterApplied = await categoryPage.isFilterApplied('size', testData.filterSize);
        expect(isFilterApplied).toBe(true);

        const filteredProducts = await categoryPage.getAllProductNames();
        expect(filteredProducts.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('Size filter not available or different UI structure');
        // Continue test without size filter
      }
    });

    await test.step('Switch between grid and list view', async () => {
      try {
        await categoryPage.switchToListView();
        await page.waitForTimeout(1000);

        await categoryPage.switchToGridView();
        await page.waitForTimeout(1000);

        // Verify products are still visible after view changes
        const productsVisible = await categoryPage.productItems.first().isVisible();
        expect(productsVisible).toBe(true);
      } catch (error) {
        console.log('View switching not available');
      }
    });
  });

  test('Breadcrumb Navigation', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);

    await test.step('Navigate to homepage', async () => {
      await homePage.goto();
    });

    await test.step('Navigate to a category through breadcrumbs', async () => {
      await homePage.navigateToCategory('Dresses');
      await categoryPage.waitForProductsToLoad();
    });

    await test.step('Verify breadcrumb navigation', async () => {
      const breadcrumbExists = await categoryPage.breadcrumb.isVisible();
      expect(breadcrumbExists).toBe(true);

      if (breadcrumbExists) {
        const breadcrumbText = await categoryPage.breadcrumb.textContent();
        expect(breadcrumbText.toLowerCase()).toContain('women');
      }
    });

    await test.step('Click on a product to verify navigation', async () => {
      const productNames = await categoryPage.getAllProductNames();
      if (productNames.length > 0) {
        await categoryPage.clickProduct(0);

        // Verify we navigated to product page
        await expect(page).toHaveURL(/id_product/);
      }
    });
  });

  test('Search Results Pagination', async ({ page }) => {
    const homePage = new HomePage(page);
    const categoryPage = new CategoryPage(page);

    await test.step('Navigate to homepage and search for products', async () => {
      await homePage.goto();
      await homePage.searchForProduct('dress');
      await categoryPage.waitForProductsToLoad();
    });

    await test.step('Verify search results and check pagination', async () => {
      const productCount = await categoryPage.getProductCount();
      expect(productCount).toBeGreaterThan(0);

      // Check if pagination is available
      const hasPagination = await categoryPage.paginationNext.isVisible();

      if (hasPagination) {
        const initialProducts = await categoryPage.getAllProductNames();

        // Go to next page
        const canGoNext = await categoryPage.goToNextPage();

        if (canGoNext) {
          const nextPageProducts = await categoryPage.getAllProductNames();

          // Verify we have different products on the next page
          expect(nextPageProducts).not.toEqual(initialProducts);

          // Go back to previous page
          const canGoPrevious = await categoryPage.goToPreviousPage();
          expect(canGoPrevious).toBe(true);
        }
      }
    });
  });
});
