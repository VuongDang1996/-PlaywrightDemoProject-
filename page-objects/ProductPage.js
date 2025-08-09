export class ProductPage {
  constructor(page) {
    this.page = page;

    // Product information elements
    this.productName = page.locator('#pb-left-column h1, .pb-center-column h1');
    this.productPrice = page.locator('#our_price_display, .pb-center-column .price');
    this.productDescription = page.locator('#short_description_content, .product-description');
    this.productReference = page.locator('#product_reference');
    this.productCondition = page.locator('#product_condition');
    this.productAvailability = page.locator('#availability_statut, .availability span');

    // Product images
    this.mainProductImage = page.locator('#bigpic, .pb-center-column .product-image img');
    this.thumbnailImages = page.locator('#thumbs_list img, .pb-left-column .thumbs img');
    this.imageZoom = page.locator('.zoomImg');

    // Product options and variants
    this.sizeSelect = page.locator('#group_1');
    this.colorOptions = page.locator('#color_to_pick_list a, .attribute_list .color_pick');
    this.quantityInput = page.locator('#quantity_wanted');
    this.quantityUpButton = page.locator(
      '.product_quantity_up, .btn.btn-default[data-field-qty="qty"]',
    );
    this.quantityDownButton = page.locator(
      '.product_quantity_down, .btn.btn-default[data-field-qty="qty"]',
    );

    // Action buttons
    this.addToCartButton = page.locator('#add_to_cart button, .pb-center-column .btn-primary');
    this.addToWishlistButton = page.locator('#wishlist_button, .btn-outline');
    this.compareButton = page.locator('.compare, .btn-outline');
    this.printButton = page.locator('.print');
    this.sendToFriendButton = page.locator('.send-to-friend');

    // Cart confirmation modal
    this.cartModal = page.locator('#layer_cart, .modal-cart');
    this.cartModalProductName = page.locator(
      '#layer_cart_product_title, .modal-cart .product-name',
    );
    this.cartModalPrice = page.locator('#layer_cart_product_price, .modal-cart .product-price');
    this.cartModalQuantity = page.locator(
      '#layer_cart_product_quantity, .modal-cart .product-quantity',
    );
    this.continueShoppingButton = page.locator('.continue, .btn-secondary');
    this.proceedToCheckoutButton = page.locator(
      '.btn-primary:has-text("Proceed"), a[title*="checkout"]',
    );
    this.cartModalCloseButton = page.locator('.cross, .close, .modal-cart .btn-secondary');

    // Product details tabs
    this.descriptionTab = page.locator('#idTab1, .nav-tabs a:has-text("Description")');
    this.dataSheetTab = page.locator('#idTab2, .nav-tabs a:has-text("Data sheet")');
    this.reviewsTab = page.locator('#idTab5, .nav-tabs a:has-text("Reviews")');

    // Tab content
    this.descriptionContent = page.locator('#idTabContent1, .tab-content .description');
    this.dataSheetContent = page.locator('#idTabContent2, .tab-content .data-sheet');
    this.reviewsContent = page.locator('#idTabContent5, .tab-content .reviews');

    // Write review elements
    this.writeReviewButton = page.locator('.btn-outline:has-text("Write")');
    this.reviewTitleInput = page.locator('#comment_title');
    this.reviewCommentTextarea = page.locator('#content');
    this.reviewRatingStars = page.locator('.star_content input');
    this.submitReviewButton = page.locator('#submitNewMessage');

    // Social sharing
    this.facebookShare = page.locator('.facebook-share');
    this.twitterShare = page.locator('.twitter-share');
    this.googlePlusShare = page.locator('.googleplus-share');
    this.pinterestShare = page.locator('.pinterest-share');

    // Related products
    this.relatedProducts = page.locator('#featured-products_block_center .product-container');
    this.upsellProducts = page.locator('#upsell_product_list .product-container');

    // Breadcrumbs and navigation
    this.breadcrumb = page.locator('.breadcrumb');
    this.backToCategory = page.locator('.navigation_page a');

    // Success/Error messages
    this.successMessage = page.locator('.alert-success');
    this.errorMessage = page.locator('.alert-danger');
    this.warningMessage = page.locator('.alert-warning');
  }

  async waitForProductToLoad() {
    await this.productName.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async getProductName() {
    await this.waitForProductToLoad();
    return await this.productName.textContent();
  }

  async getProductPrice() {
    const priceText = await this.productPrice.textContent();
    return parseFloat(priceText.replace('$', '').replace(',', '').trim());
  }

  async getProductDescription() {
    return await this.productDescription.textContent();
  }

  async getProductAvailability() {
    return await this.productAvailability.textContent();
  }

  async selectSize(size) {
    await this.sizeSelect.selectOption({ label: size });
    await this.page.waitForTimeout(500);
  }

  async selectColor(colorName) {
    await this.page
      .locator(`[title="${colorName}"], [data-color="${colorName.toLowerCase()}"]`)
      .click();
    await this.page.waitForTimeout(500);
  }

  async setQuantity(quantity) {
    await this.quantityInput.fill(quantity.toString());
  }

  async increaseQuantity(times = 1) {
    for (let i = 0; i < times; i++) {
      await this.quantityUpButton.click();
      await this.page.waitForTimeout(200);
    }
  }

  async decreaseQuantity(times = 1) {
    for (let i = 0; i < times; i++) {
      await this.quantityDownButton.click();
      await this.page.waitForTimeout(200);
    }
  }

  async getCurrentQuantity() {
    return parseInt(await this.quantityInput.inputValue());
  }

  async addToCart() {
    await this.addToCartButton.click();
    await this.cartModal.waitFor({ state: 'visible', timeout: 5000 });
  }

  async addToWishlist() {
    await this.addToWishlistButton.click();
    await this.page.waitForTimeout(1000);
  }

  async addToCompare() {
    await this.compareButton.click();
    await this.page.waitForTimeout(1000);
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
    await this.cartModal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async closeCartModal() {
    await this.cartModalCloseButton.click();
    await this.cartModal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async clickThumbnail(index = 0) {
    const thumbnails = await this.thumbnailImages.all();
    if (thumbnails[index]) {
      await thumbnails[index].click();
      await this.page.waitForTimeout(500);
    }
  }

  async openDescriptionTab() {
    await this.descriptionTab.click();
    await this.descriptionContent.waitFor({ state: 'visible' });
  }

  async openDataSheetTab() {
    await this.dataSheetTab.click();
    await this.dataSheetContent.waitFor({ state: 'visible' });
  }

  async openReviewsTab() {
    await this.reviewsTab.click();
    await this.reviewsContent.waitFor({ state: 'visible' });
  }

  async writeReview(title, comment, rating = 5) {
    await this.openReviewsTab();
    await this.writeReviewButton.click();

    await this.reviewTitleInput.fill(title);
    await this.reviewCommentTextarea.fill(comment);

    // Select rating (1-5 stars)
    const ratingStars = await this.reviewRatingStars.all();
    if (ratingStars[rating - 1]) {
      await ratingStars[rating - 1].click();
    }

    await this.submitReviewButton.click();
    await this.page.waitForTimeout(2000);
  }

  async shareOnFacebook() {
    await this.facebookShare.click();
  }

  async shareOnTwitter() {
    await this.twitterShare.click();
  }

  async getRelatedProducts() {
    const products = await this.relatedProducts.all();
    const productInfo = [];

    for (const product of products) {
      const name = await product.locator('.product-name').textContent();
      const price = await product.locator('.price').textContent();
      productInfo.push({ name: name.trim(), price: price.trim() });
    }

    return productInfo;
  }

  async clickRelatedProduct(index = 0) {
    const products = await this.relatedProducts.all();
    if (products[index]) {
      await products[index].click();
      await this.waitForProductToLoad();
    }
  }

  async getCartModalInfo() {
    if (await this.cartModal.isVisible()) {
      const name = await this.cartModalProductName.textContent();
      const price = await this.cartModalPrice.textContent();
      const quantity = await this.cartModalQuantity.textContent();

      return {
        productName: name.trim(),
        price: price.trim(),
        quantity: quantity.trim(),
      };
    }
    return null;
  }

  async isProductOutOfStock() {
    const availability = await this.getProductAvailability();
    return availability.toLowerCase().includes('out of stock');
  }

  async getAvailableSizes() {
    const sizeOptions = await this.sizeSelect.locator('option').all();
    const sizes = [];

    for (const option of sizeOptions) {
      const text = await option.textContent();
      if (text.trim() && text.trim() !== '--') {
        sizes.push(text.trim());
      }
    }

    return sizes;
  }

  async getAvailableColors() {
    const colorElements = await this.colorOptions.all();
    const colors = [];

    for (const color of colorElements) {
      const title = await color.getAttribute('title');
      if (title) {
        colors.push(title);
      }
    }

    return colors;
  }

  async printProduct() {
    await this.printButton.click();
  }

  async sendToFriend() {
    await this.sendToFriendButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goBackToCategory() {
    await this.backToCategory.click();
    await this.page.waitForLoadState('networkidle');
  }
}
