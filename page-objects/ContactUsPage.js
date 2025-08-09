export class ContactUsPage {
  constructor(page) {
    this.page = page;

    // Contact form elements
    this.subjectSelect = page.locator('#id_contact');
    this.emailInput = page.locator('#email');
    this.orderReferenceInput = page.locator('#id_order');
    this.messageTextarea = page.locator('#message');
    this.fileUploadInput = page.locator('#fileUpload');
    this.sendButton = page.locator('#submitMessage');

    // Form validation and messages
    this.successMessage = page.locator('.alert-success');
    this.errorMessage = page.locator('.alert-danger');
    this.warningMessage = page.locator('.alert-warning');
    this.requiredFieldErrors = page.locator('.form-error');

    // Page elements
    this.pageTitle = page.locator('.page-heading');
    this.breadcrumb = page.locator('.breadcrumb');
    this.contactInfo = page.locator('#center_column .contact-info');

    // Contact information sections
    this.customerServiceInfo = page.locator('.customer-service-info');
    this.webmasterInfo = page.locator('.webmaster-info');
    this.storeInfo = page.locator('.store-info');

    // Social media links (if present)
    this.facebookLink = page.locator('a[href*="facebook"]');
    this.twitterLink = page.locator('a[href*="twitter"]');
    this.youtubeLink = page.locator('a[href*="youtube"]');

    // Map or store location (if present)
    this.storeMap = page.locator('#map, .store-map');
    this.storeAddress = page.locator('.store-address');
    this.storePhone = page.locator('.store-phone');
    this.storeEmail = page.locator('.store-email');

    // Form reset button
    this.resetButton = page.locator('button[type="reset"]');

    // Character counter (if present)
    this.characterCounter = page.locator('.character-counter');

    // Required field indicators
    this.requiredFieldMarkers = page.locator('.required');
  }

  async waitForPageToLoad() {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async selectSubject(subjectText) {
    await this.subjectSelect.selectOption({ label: subjectText });
    await this.page.waitForTimeout(500); // Wait for any dynamic changes
  }

  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillOrderReference(orderRef) {
    await this.orderReferenceInput.fill(orderRef);
  }

  async fillMessage(message) {
    await this.messageTextarea.fill(message);
  }

  async uploadFile(filePath) {
    await this.fileUploadInput.setInputFiles(filePath);
  }

  async submitForm() {
    await this.sendButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillContactForm(formData) {
    if (formData.subject) {
      await this.selectSubject(formData.subject);
    }

    if (formData.email) {
      await this.fillEmail(formData.email);
    }

    if (formData.orderReference) {
      await this.fillOrderReference(formData.orderReference);
    }

    if (formData.message) {
      await this.fillMessage(formData.message);
    }

    if (formData.filePath) {
      await this.uploadFile(formData.filePath);
    }
  }

  async submitContactForm(formData) {
    await this.fillContactForm(formData);
    await this.submitForm();
  }

  async getSuccessMessage() {
    if (await this.successMessage.isVisible()) {
      return await this.successMessage.textContent();
    }
    return null;
  }

  async getErrorMessage() {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }

  async getWarningMessage() {
    if (await this.warningMessage.isVisible()) {
      return await this.warningMessage.textContent();
    }
    return null;
  }

  async getFieldErrors() {
    const errorElements = await this.requiredFieldErrors.all();
    const errors = [];

    for (const element of errorElements) {
      const errorText = await element.textContent();
      if (errorText.trim()) {
        errors.push(errorText.trim());
      }
    }

    return errors;
  }

  async resetForm() {
    await this.resetButton.click();
  }

  async clearForm() {
    await this.emailInput.clear();
    await this.orderReferenceInput.clear();
    await this.messageTextarea.clear();

    // Reset subject to default
    await this.subjectSelect.selectOption({ index: 0 });
  }

  async isFormValid() {
    // Check if all required fields are filled
    const email = await this.emailInput.inputValue();
    const message = await this.messageTextarea.inputValue();
    const selectedSubject = await this.subjectSelect.inputValue();

    return (
      email.trim() !== '' &&
      message.trim() !== '' &&
      selectedSubject !== '' &&
      selectedSubject !== '0'
    );
  }

  async getAvailableSubjects() {
    const options = await this.subjectSelect.locator('option').all();
    const subjects = [];

    for (const option of options) {
      const text = await option.textContent();
      const value = await option.getAttribute('value');

      if (value && value !== '0' && text.trim()) {
        subjects.push(text.trim());
      }
    }

    return subjects;
  }

  async getCurrentSubject() {
    const selectedOption = this.subjectSelect.locator('option:checked');
    return selectedOption.textContent();
  }

  async getEmailValue() {
    return await this.emailInput.inputValue();
  }

  async getOrderReferenceValue() {
    return await this.orderReferenceInput.inputValue();
  }

  async getMessageValue() {
    return await this.messageTextarea.inputValue();
  }

  async getCharacterCount() {
    if (await this.characterCounter.isVisible()) {
      const counterText = await this.characterCounter.textContent();
      const match = counterText.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  async getMaxCharacterLimit() {
    const maxLength = await this.messageTextarea.getAttribute('maxlength');
    return maxLength ? parseInt(maxLength) : null;
  }

  async isFileUploadSupported() {
    return await this.fileUploadInput.isVisible();
  }

  async getUploadedFileName() {
    const files = await this.fileUploadInput.inputValue();
    return files || null;
  }

  async removeUploadedFile() {
    await this.fileUploadInput.setInputFiles([]);
  }

  async getContactInformation() {
    const contactInfo = {};

    if (await this.storeAddress.isVisible()) {
      contactInfo.address = await this.storeAddress.textContent();
    }

    if (await this.storePhone.isVisible()) {
      contactInfo.phone = await this.storePhone.textContent();
    }

    if (await this.storeEmail.isVisible()) {
      contactInfo.email = await this.storeEmail.textContent();
    }

    return contactInfo;
  }

  async clickSocialMediaLink(platform) {
    const linkMap = {
      facebook: this.facebookLink,
      twitter: this.twitterLink,
      youtube: this.youtubeLink,
    };

    const link = linkMap[platform.toLowerCase()];
    if (link && (await link.isVisible())) {
      await link.click();
    } else {
      throw new Error(`${platform} link not found or not visible`);
    }
  }

  async isMapVisible() {
    return await this.storeMap.isVisible();
  }

  async getPageTitle() {
    return await this.pageTitle.textContent();
  }

  async getBreadcrumbPath() {
    const breadcrumbItems = await this.breadcrumb.locator('a, span').allTextContents();
    return breadcrumbItems.map(item => item.trim()).filter(item => item !== '');
  }

  async waitForFormSubmission() {
    // Wait for either success or error message to appear
    await Promise.race([
      this.successMessage.waitFor({ state: 'visible', timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  }

  async isSubmissionSuccessful() {
    return await this.successMessage.isVisible();
  }

  async hasSubmissionErrors() {
    return (
      (await this.errorMessage.isVisible()) || (await this.requiredFieldErrors.first().isVisible())
    );
  }

  async validateRequiredFields() {
    const validationResults = {
      email: {
        filled: (await this.emailInput.inputValue()).trim() !== '',
        valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(await this.emailInput.inputValue()),
      },
      subject: {
        selected:
          (await this.subjectSelect.inputValue()) !== '0' &&
          (await this.subjectSelect.inputValue()) !== '',
      },
      message: {
        filled: (await this.messageTextarea.inputValue()).trim() !== '',
      },
    };

    return validationResults;
  }
}
