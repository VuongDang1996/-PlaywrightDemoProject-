export class CartPage {
  constructor(page) {
    this.page = page;

    // Cart table elements
    this.cartTable = page.locator('#cart_summary');
    this.cartItems = page.locator('.cart_item');
    this.productNames = page.locator('.cart_description h5 a');
    this.productImages = page.locator('.cart_product img');
    this.productPrices = page.locator('.cart_unit .price');
    this.productQuantities = page.locator('.cart_quantity_input');
    this.productTotals = page.locator('.cart_total .price');

    // Quantity controls
    this.quantityInputs = page.locator('input[name*="quantity"]');
    this.quantityIncreaseButtons = page.locator('.cart_quantity_up');
    this.quantityDecreaseButtons = page.locator('.cart_quantity_down');
    this.quantityUpdateButtons = page.locator('.cart_quantity_button .btn');

    // Delete/Remove buttons
    this.deleteButtons = page.locator('.cart_quantity_delete');
    this.removeLinks = page.locator('a[title="Delete"]');

    // Cart summary elements
    this.subtotalAmount = page.locator('#total_product');
    this.shippingAmount = page.locator('#total_shipping');
    this.taxAmount = page.locator('#total_tax');
    this.totalAmount = page.locator('#total_price');
    this.totalAmountContainer = page.locator('#total_price_container');

    // Voucher/Discount elements
    this.voucherInput = page.locator('#discount_name');
    this.addVoucherButton = page.locator('[name="submitDiscount"]');
    this.voucherError = page.locator('.alert-danger');
    this.voucherSuccess = page.locator('.alert-success');
    this.appliedVouchers = page.locator('.cart_discount');
    this.removeVoucherButtons = page.locator('.price_discount_delete');

    // Checkout buttons
    this.proceedToCheckoutButton = page.locator(
      '.cart_navigation .button-medium:has-text("Proceed")',
    );
    this.continueShoppingButton = page.locator('.cart_navigation .button-exclusive-medium');

    // Empty cart elements
    this.emptyCartMessage = page.locator('.alert-warning');
    this.emptyCartIcon = page.locator('.icon-warning-sign');

    // Cart header/navigation
    this.cartTitle = page.locator('#cart_title, .page-heading');
    this.breadcrumb = page.locator('.breadcrumb');

    // Product details in cart
    this.productAttributes = page.locator('.cart_description small');
    this.productReferences = page.locator('.cart_ref');
    this.productAvailability = page.locator('.cart_avail');

    // Shipping estimation
    this.shippingEstimation = page.locator('#carrier_area');
    this.countrySelect = page.locator('#id_country');
    this.stateSelect = page.locator('#id_state');
    this.zipCodeInput = page.locator('#postcode');
    this.updateCarrierButton = page.locator('[name="processCarrier"]');

    // Gift wrapping
    this.giftWrappingCheckbox = page.locator('#gift');
    this.giftMessageTextarea = page.locator('#gift_message');

    // Cross-sell products
    this.crossSellProducts = page.locator('#crossselling .product-container');
    this.crossSellAddToCartButtons = page.locator('#crossselling .ajax_add_to_cart_button');

    // Messages and notifications
    this.successMessages = page.locator('.alert-success');
    this.errorMessages = page.locator('.alert-danger');
    this.warningMessages = page.locator('.alert-warning');
    this.infoMessages = page.locator('.alert-info');
  }

  async waitForCartToLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Additional wait for dynamic content
  }

  async getCartItemCount() {
    await this.waitForCartToLoad();
    return await this.cartItems.count();
  }

  async isCartEmpty() {
    return await this.emptyCartMessage.isVisible();
  }

  async getAllProductNames() {
    if (await this.isCartEmpty()) {
      return [];
    }
    return await this.productNames.allTextContents();
  }

  async getAllProductPrices() {
    if (await this.isCartEmpty()) {
      return [];
    }
    const priceTexts = await this.productPrices.allTextContents();
    return priceTexts.map(price => parseFloat(price.replace('$', '').replace(',', '').trim()));
  }

  async getAllProductQuantities() {
    if (await this.isCartEmpty()) {
      return [];
    }
    const quantities = [];
    const quantityElements = await this.quantityInputs.all();

    for (const element of quantityElements) {
      const value = await element.inputValue();
      quantities.push(parseInt(value));
    }

    return quantities;
  }

  async getProductQuantity(productIndex = 0) {
    const quantityElements = await this.quantityInputs.all();
    if (quantityElements[productIndex]) {
      const value = await quantityElements[productIndex].inputValue();
      return parseInt(value);
    }
    return 0;
  }

  async updateProductQuantity(productIndex = 0, newQuantity) {
    const quantityElements = await this.quantityInputs.all();
    if (quantityElements[productIndex]) {
      await quantityElements[productIndex].clear();
      await quantityElements[productIndex].fill(newQuantity.toString());

      // Click update button or trigger change
      const updateButtons = await this.quantityUpdateButtons.all();
      if (updateButtons[productIndex]) {
        await updateButtons[productIndex].click();
      } else {
        // If no update button, trigger change event
        await quantityElements[productIndex].press('Tab');
      }

      await this.waitForCartToLoad();
    }
  }

  async increaseProductQuantity(productIndex = 0) {
    const increaseButtons = await this.quantityIncreaseButtons.all();
    if (increaseButtons[productIndex]) {
      await increaseButtons[productIndex].click();
      await this.waitForCartToLoad();
    }
  }

  async decreaseProductQuantity(productIndex = 0) {
    const decreaseButtons = await this.quantityDecreaseButtons.all();
    if (decreaseButtons[productIndex]) {
      await decreaseButtons[productIndex].click();
      await this.waitForCartToLoad();
    }
  }

  async removeProduct(productIndex = 0) {
    const deleteButtons = await this.deleteButtons.all();
    if (deleteButtons[productIndex]) {
      await deleteButtons[productIndex].click();
      await this.waitForCartToLoad();
    }
  }

  async removeProductByName(productName) {
    const productNames = await this.getAllProductNames();
    const index = productNames.findIndex(name => name.includes(productName));

    if (index !== -1) {
      await this.removeProduct(index);
    } else {
      throw new Error(`Product ${productName} not found in cart`);
    }
  }

  async getSubtotal() {
    const subtotalText = await this.subtotalAmount.textContent();
    return parseFloat(subtotalText.replace('$', '').replace(',', '').trim());
  }

  async getShippingCost() {
    const shippingText = await this.shippingAmount.textContent();
    return parseFloat(shippingText.replace('$', '').replace(',', '').trim());
  }

  async getTax() {
    const taxText = await this.taxAmount.textContent();
    return parseFloat(taxText.replace('$', '').replace(',', '').trim());
  }

  async getTotal() {
    const totalText = await this.totalAmount.textContent();
    return parseFloat(totalText.replace('$', '').replace(',', '').trim());
  }

  async applyVoucher(voucherCode) {
    await this.voucherInput.fill(voucherCode);
    await this.addVoucherButton.click();
    await this.waitForCartToLoad();
  }

  async getVoucherErrorMessage() {
    if (await this.voucherError.isVisible()) {
      return await this.voucherError.textContent();
    }
    return null;
  }

  async getVoucherSuccessMessage() {
    if (await this.voucherSuccess.isVisible()) {
      return await this.voucherSuccess.textContent();
    }
    return null;
  }

  async removeVoucher(voucherIndex = 0) {
    const removeButtons = await this.removeVoucherButtons.all();
    if (removeButtons[voucherIndex]) {
      await removeButtons[voucherIndex].click();
      await this.waitForCartToLoad();
    }
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async updateShippingInfo(country, state = '', zipCode = '') {
    if (country) {
      await this.countrySelect.selectOption({ label: country });
      await this.page.waitForTimeout(1000);
    }

    if (state && (await this.stateSelect.isVisible())) {
      await this.stateSelect.selectOption({ label: state });
    }

    if (zipCode) {
      await this.zipCodeInput.fill(zipCode);
    }

    await this.updateCarrierButton.click();
    await this.waitForCartToLoad();
  }

  async enableGiftWrapping(message = '') {
    await this.giftWrappingCheckbox.check();

    if (message) {
      await this.giftMessageTextarea.fill(message);
    }

    await this.waitForCartToLoad();
  }

  async disableGiftWrapping() {
    await this.giftWrappingCheckbox.uncheck();
    await this.waitForCartToLoad();
  }

  async getCrossSellProducts() {
    const products = await this.crossSellProducts.all();
    const productInfo = [];

    for (const product of products) {
      const name = await product.locator('.product-name').textContent();
      const price = await product.locator('.price').textContent();
      productInfo.push({ name: name.trim(), price: price.trim() });
    }

    return productInfo;
  }

  async addCrossSellProduct(productIndex = 0) {
    const addButtons = await this.crossSellAddToCartButtons.all();
    if (addButtons[productIndex]) {
      await addButtons[productIndex].click();
      await this.waitForCartToLoad();
    }
  }

  async getProductDetails(productIndex = 0) {
    const cartItems = await this.cartItems.all();
    if (cartItems[productIndex]) {
      const name = await cartItems[productIndex].locator('.product-name').textContent();
      const price = await cartItems[productIndex].locator('.price').textContent();
      const quantity = await cartItems[productIndex].locator('.cart_quantity_input').inputValue();
      const total = await cartItems[productIndex].locator('.cart_total .price').textContent();

      return {
        name: name.trim(),
        price: parseFloat(price.replace('$', '').replace(',', '').trim()),
        quantity: parseInt(quantity),
        total: parseFloat(total.replace('$', '').replace(',', '').trim()),
      };
    }
    return null;
  }

  async clearCart() {
    while (!(await this.isCartEmpty())) {
      await this.removeProduct(0);
      await this.page.waitForTimeout(1000);
    }
  }

  async validateCartCalculations() {
    if (await this.isCartEmpty()) {
      return true;
    }

    const productDetails = [];
    const itemCount = await this.getCartItemCount();

    for (let i = 0; i < itemCount; i++) {
      const details = await this.getProductDetails(i);
      if (details) {
        productDetails.push(details);
      }
    }

    // Calculate expected subtotal
    const expectedSubtotal = productDetails.reduce((sum, product) => {
      return sum + product.price * product.quantity;
    }, 0);

    const actualSubtotal = await this.getSubtotal();

    // Allow for small floating point differences
    return Math.abs(expectedSubtotal - actualSubtotal) < 0.01;
  }

  async getCartSummary() {
    return {
      subtotal: await this.getSubtotal(),
      shipping: await this.getShippingCost(),
      tax: await this.getTax(),
      total: await this.getTotal(),
      itemCount: await this.getCartItemCount(),
      isEmpty: await this.isCartEmpty(),
    };
  }
}
