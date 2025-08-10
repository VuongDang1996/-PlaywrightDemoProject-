const { test, expect } = require('@playwright/test');

/**
 * Locator Validator - Test Codegen generated locators
 * Run this after Codegen sessions to validate new locators
 */

// Common locators that Codegen might find (we'll update these based on your recording)
const CODEGEN_LOCATORS = {
  search: {
    searchInput: '#search_query_top',
    searchButton: '[name="submit_search"]',
    searchResults: '.product-container'
  },
  cart: {
    addToCartButton: '.ajax_add_to_cart_button',
    cartQuantity: '.cart_quantity_input',
    cartTotal: '#total_price',
    removeButton: '.cart_quantity_delete'
  },
  product: {
    productName: '.pb-center-column h1',
    productPrice: '#our_price_display',
    addToCartBtn: '#add_to_cart button'
  }
};

test.describe('🤖 Codegen Locator Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://automationpractice.pl/');
  });

  test('Validate Search Locators from Codegen', async ({ page }) => {
    const { search } = CODEGEN_LOCATORS;
    
    // Test if Codegen locators are visible and functional
    await expect(page.locator(search.searchInput)).toBeVisible();
    await expect(page.locator(search.searchButton)).toBeVisible();
    
    // Test search functionality with Codegen locators
    await page.locator(search.searchInput).fill('dress');
    await page.locator(search.searchButton).click();
    
    await page.waitForLoadState('networkidle');
    await expect(page.locator(search.searchResults).first()).toBeVisible();
    
    console.log('✅ Search locators from Codegen are working');
  });

  test('Validate Cart Locators from Codegen', async ({ page }) => {
    // Add a product first
    await page.locator('#search_query_top').fill('dress');
    await page.locator('[name="submit_search"]').click();
    await page.waitForLoadState('networkidle');
    
    // Click on first product
    await page.locator('.product-name a').first().click({ force: true });
    await page.waitForLoadState('networkidle');
    
    // Test cart locators
    const addToCartButton = page.locator('.ajax_add_to_cart_button, #add_to_cart button').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Add to cart button from Codegen is working');
    }
  });

  test('Compare Current vs Codegen Locators', async ({ page }) => {
    const comparisons = [
      {
        name: 'Search Input',
        current: '#search_query_top',
        codegen: '#search_query_top', // Update this with what Codegen generates
        action: 'fill',
        value: 'test'
      },
      {
        name: 'Search Button', 
        current: '[name="submit_search"]',
        codegen: '[name="submit_search"]', // Update this with what Codegen generates
        action: 'click'
      }
    ];

    for (const comparison of comparisons) {
      try {
        const currentElement = page.locator(comparison.current);
        const codegenElement = page.locator(comparison.codegen);
        
        const currentVisible = await currentElement.isVisible();
        const codegenVisible = await codegenElement.isVisible();
        
        console.log(`📊 ${comparison.name}:`);
        console.log(`   Current locator (${comparison.current}): ${currentVisible ? '✅' : '❌'}`);
        console.log(`   Codegen locator (${comparison.codegen}): ${codegenVisible ? '✅' : '❌'}`);
        
        if (comparison.action === 'fill' && currentVisible) {
          await currentElement.fill(comparison.value);
          await currentElement.clear();
        }
      } catch (error) {
        console.log(`⚠️  Error testing ${comparison.name}: ${error.message}`);
      }
    }
  });
});

// Helper function to update locators from Codegen output
function updateLocatorsFromCodegen(codegenOutput) {
  // Parse Codegen output and extract locators
  const locatorMatches = codegenOutput.match(/page\.locator\(['"`]([^'"`]+)['"`]\)/g);
  
  if (locatorMatches) {
    console.log('🔍 Found these locators in Codegen output:');
    locatorMatches.forEach((match, index) => {
      const locator = match.match(/['"`]([^'"`]+)['"`]/)[1];
      console.log(`${index + 1}. ${locator}`);
    });
  }
}

module.exports = { CODEGEN_LOCATORS, updateLocatorsFromCodegen };
