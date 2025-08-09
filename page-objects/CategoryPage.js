export class CategoryPage {
  constructor(page) {
    this.page = page;

    // Product grid and list elements
    this.productContainer = page.locator('.product_list');
    this.productItems = page.locator('.product-container');
    this.productNames = page.locator('.product-name');
    this.productPrices = page.locator('.price-percent-reduction');
    this.productImages = page.locator('.product-image-container img');

    // Filter elements
    this.sizeFilters = page.locator('#layered_id_attribute_group_1 input');
    this.colorFilters = page.locator('#layered_id_attribute_group_3 input');
    this.categoryFilters = page.locator('#layered_category input');
    this.priceSlider = page.locator('#layered_price_range');
    this.manufacturerFilters = page.locator('#layered_manufacturer input');
    this.conditionFilters = page.locator('#layered_condition input');

    // Filter labels for easier selection
    this.sizeSLabel = page.locator('label[for="layered_id_attribute_group_1_1"]'); // S
    this.sizeMLabel = page.locator('label[for="layered_id_attribute_group_1_2"]'); // M
    this.sizeLLabel = page.locator('label[for="layered_id_attribute_group_1_3"]'); // L
    this.sizeXLLabel = page.locator('label[for="layered_id_attribute_group_1_4"]'); // XL

    this.colorBeige = page.locator('label[for="layered_id_attribute_group_3_7"]');
    this.colorWhite = page.locator('label[for="layered_id_attribute_group_3_8"]');
    this.colorBlack = page.locator('label[for="layered_id_attribute_group_3_11"]');
    this.colorOrange = page.locator('label[for="layered_id_attribute_group_3_13"]');
    this.colorBlue = page.locator('label[for="layered_id_attribute_group_3_14"]');
    this.colorGreen = page.locator('label[for="layered_id_attribute_group_3_15"]');
    this.colorYellow = page.locator('label[for="layered_id_attribute_group_3_16"]');
    this.colorPink = page.locator('label[for="layered_id_attribute_group_3_24"]');

    // Sorting elements
    this.sortBySelect = page.locator('#selectProductSort');
    this.sortOptions = {
      position: 'Position',
      'name:asc': 'Product Name: A to Z',
      'name:desc': 'Product Name: Z to A',
      'price:asc': 'Price: Lowest first',
      'price:desc': 'Price: Highest first',
      'quantity:desc': 'In stock',
      'reference:asc': 'Reference: Lowest first',
      'reference:desc': 'Reference: Highest first',
    };

    // View options
    this.gridViewButton = page.locator('#grid');
    this.listViewButton = page.locator('#list');

    // Pagination
    this.paginationNext = page.locator('.pagination .pagination_next');
    this.paginationPrevious = page.locator('.pagination .pagination_previous');
    this.paginationNumbers = page.locator(
      '.pagination li:not(.pagination_next):not(.pagination_previous) a',
    );

    // Product count and results
    this.productCount = page.locator('.product-count');
    this.resultsInfo = page.locator('.top-pagination-content');

    // Category breadcrumbs
    this.breadcrumb = page.locator('.breadcrumb');
    this.categoryTitle = page.locator('.category-name, .page-heading');

    // No results message
    this.noResultsMessage = page.locator('.alert-warning');
  }

  async waitForProductsToLoad() {
    await this.productContainer.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async getProductCount() {
    const countText = await this.productCount.first().textContent();
    return parseInt(countText.match(/\d+/)[0]) || 0;
  }

  async getAllProductNames() {
    await this.waitForProductsToLoad();
    return await this.productNames.allTextContents();
  }

  async getAllProductPrices() {
    await this.waitForProductsToLoad();
    const priceElements = await this.page.locator('.price').all();
    const prices = [];
    for (const element of priceElements) {
      const priceText = await element.textContent();
      const price = parseFloat(priceText.replace('$', '').replace(',', ''));
      prices.push(price);
    }
    return prices;
  }

  async filterBySize(size) {
    const sizeMap = {
      S: this.sizeSLabel,
      M: this.sizeMLabel,
      L: this.sizeLLabel,
      XL: this.sizeXLLabel,
    };

    if (sizeMap[size]) {
      await sizeMap[size].click();
      await this.waitForProductsToLoad();
    } else {
      throw new Error(`Size ${size} not found`);
    }
  }

  async filterByColor(color) {
    const colorMap = {
      Beige: this.colorBeige,
      White: this.colorWhite,
      Black: this.colorBlack,
      Orange: this.colorOrange,
      Blue: this.colorBlue,
      Green: this.colorGreen,
      Yellow: this.colorYellow,
      Pink: this.colorPink,
    };

    if (colorMap[color]) {
      await colorMap[color].click();
      await this.waitForProductsToLoad();
    } else {
      throw new Error(`Color ${color} not found`);
    }
  }

  async sortBy(sortOption) {
    await this.sortBySelect.selectOption({ label: sortOption });
    await this.waitForProductsToLoad();
  }

  async switchToGridView() {
    await this.gridViewButton.click();
    await this.page.waitForTimeout(1000);
  }

  async switchToListView() {
    await this.listViewButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickProduct(productIndex = 0) {
    await this.waitForProductsToLoad();
    
    try {
      // Force click on product name link to avoid hover overlays
      const productNames = this.page.locator('.product-name a');
      if (await productNames.count() > productIndex) {
        await productNames.nth(productIndex).click({ force: true });
        await this.page.waitForLoadState('networkidle');
        return;
      }
      
      // If product name not available, try clicking with force on image
      const productImages = this.page.locator('.product-image-container a');
      if (await productImages.count() > productIndex) {
        await productImages.nth(productIndex).click({ force: true });
        await this.page.waitForLoadState('networkidle');
        return;
      }
      
      // Last resort: navigate directly using href
      const productLinks = this.page.locator('.product-container a[href*="id_product"]');
      if (await productLinks.count() > productIndex) {
        const href = await productLinks.nth(productIndex).getAttribute('href');
        if (href) {
          await this.page.goto(href);
          await this.page.waitForLoadState('networkidle');
          return;
        }
      }
      
      throw new Error(`Product at index ${productIndex} not found`);
    } catch (error) {
      console.log(`Error clicking product: ${error.message}`);
      throw error;
    }
  }

  async clickProductByName(productName) {
    await this.page.locator(`.product-name:has-text("${productName}")`).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async addToCart(productIndex = 0) {
    const addToCartButtons = await this.page.locator('.ajax_add_to_cart_button').all();
    if (addToCartButtons[productIndex]) {
      await addToCartButtons[productIndex].click();
      await this.page.waitForTimeout(2000); // Wait for cart animation
    }
  }

  async addToWishlist(productIndex = 0) {
    const wishlistButtons = await this.page.locator('.addToWishlist').all();
    if (wishlistButtons[productIndex]) {
      await wishlistButtons[productIndex].click();
      await this.page.waitForTimeout(1000);
    }
  }

  async addToCompare(productIndex = 0) {
    const compareButtons = await this.page.locator('.add_to_compare').all();
    if (compareButtons[productIndex]) {
      await compareButtons[productIndex].click();
      await this.page.waitForTimeout(1000);
    }
  }

  async goToNextPage() {
    if (await this.paginationNext.isVisible()) {
      await this.paginationNext.click();
      await this.waitForProductsToLoad();
      return true;
    }
    return false;
  }

  async goToPreviousPage() {
    if (await this.paginationPrevious.isVisible()) {
      await this.paginationPrevious.click();
      await this.waitForProductsToLoad();
      return true;
    }
    return false;
  }

  async getCurrentCategoryName() {
    return await this.categoryTitle.first().textContent();
  }

  async clearAllFilters() {
    // This would typically require clicking on filter clear buttons
    // Implementation depends on the specific UI
    await this.page.reload();
    await this.waitForProductsToLoad();
  }

  async isFilterApplied(filterType, filterValue) {
    // Check if a specific filter is currently applied
    const activeFilters = await this.page.locator('.layered_filter .selected').all();
    for (const filter of activeFilters) {
      const text = await filter.textContent();
      if (text.includes(filterValue)) {
        return true;
      }
    }
    return false;
  }

  async getAppliedFilters() {
    const activeFilters = await this.page.locator('.layered_filter .selected').allTextContents();
    return activeFilters;
  }
}
