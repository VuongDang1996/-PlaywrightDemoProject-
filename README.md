# Playwright Advanced Test Automation Framework

A production-ready test automation framework for the e-commerce website `http://automationpractice.pl/` using **Playwright and JavaScript**.

## 🚀 Features

- ✅ **Dual Reporting**: Integrated HTML and Allure reporters
- ✅ **CI/CD Integration**: Complete GitHub Actions workflow
- ✅ **Cross-Device Testing**: Cross-browser (Chromium, Firefox, WebKit) and mobile emulation (Pixel 5)
- ✅ **Page Object Model**: Clean implementation of POM pattern
- ✅ **External Test Data**: JSON-based test data management
- ✅ **Code Quality**: ESLint and Prettier integration
- ✅ **Docker Support**: Containerized execution
- ✅ **Comprehensive Test Suite**: 12 detailed test scenarios covering all major functionality

## 📁 Project Structure

```
.
├── .github/
│   └── workflows/
│       └── playwright.yml          # GitHub Actions CI workflow
├── allure-results/                 # Generated Allure data
├── page-objects/                   # Page Object Model classes
│   ├── HomePage.js                 # Homepage interactions
│   ├── LoginPage.js                # Authentication and registration
│   ├── CategoryPage.js             # Product browsing and filtering
│   ├── ProductPage.js              # Product details and variants
│   ├── CartPage.js                 # Shopping cart management
│   ├── CheckoutPage.js             # Checkout process
│   └── ContactUsPage.js            # Contact form interactions
├── test-data/
│   └── user-data.json              # External test data
├── tests/e2e/                      # End-to-end test specifications
│   ├── 01-search-and-nav.spec.js   # Search and navigation tests
│   ├── 02-auth-and-account.spec.js # Authentication tests
│   ├── 03-product-interaction.spec.js # Product interaction tests
│   ├── 04-cart-and-other.spec.js   # Cart and miscellaneous tests
│   └── checkout.spec.js            # Complete checkout flow
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── Dockerfile                      # Docker configuration
├── package.json                    # Dependencies and scripts
└── playwright.config.js            # Playwright configuration
```

## 🔧 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd PlaywrightDemoProject
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## 🧪 Running Tests

### Basic Test Execution

- **Run all tests:**

  ```bash
  npm test
  ```

- **Run tests in headed mode:**

  ```bash
  npm run test:headed
  ```

- **Run tests with UI mode:**
  ```bash
  npm run test:ui
  ```

### Cross-Browser Testing

- **Run on specific browsers:**
  ```bash
  npm run test:chromium
  npm run test:firefox
  npm run test:webkit
  npm run test:mobile
  ```

### Test Categories

- **Search and Navigation:**

  ```bash
  npx playwright test tests/e2e/01-search-and-nav.spec.js
  ```

- **Authentication and Account:**

  ```bash
  npx playwright test tests/e2e/02-auth-and-account.spec.js
  ```

- **Product Interactions:**

  ```bash
  npx playwright test tests/e2e/03-product-interaction.spec.js
  ```

- **Cart and Other Features:**
  ```bash
  npx playwright test tests/e2e/04-cart-and-other.spec.js
  ```

## 📊 Test Reports

### HTML Report

```bash
npx playwright show-report
```

### Allure Report

```bash
npm run allure:report
```

## 📋 Test Scenarios

### 1. Search and Navigation (01-search-and-nav.spec.js)

- ✅ Search with No Results
- ✅ Search Auto-Suggest Interaction
- ✅ Category Navigation and Product Filtering
- ✅ Breadcrumb Navigation
- ✅ Search Results Pagination

### 2. Authentication and Account (02-auth-and-account.spec.js)

- ✅ Full User Registration & Login
- ✅ Invalid Login Attempt
- ✅ My Account Page Verification
- ✅ Password Validation
- ✅ Account Creation with Existing Email

### 3. Product Interaction (03-product-interaction.spec.js)

- ✅ Filter Products by Category and Size
- ✅ Sort Products by Price
- ✅ Update Product Details
- ✅ Product Image Gallery Interaction
- ✅ Product Comparison and Wishlist

### 4. Cart and Other Features (04-cart-and-other.spec.js)

- ✅ Update Item Quantity in Cart
- ✅ Remove Item from Cart
- ✅ Contact Us Form Submission
- ✅ Newsletter Subscription
- ✅ Shopping Cart Voucher/Discount Application
- ✅ Cross-sell Products in Cart
- ✅ Gift Wrapping Options
- ✅ Cart Persistence Across Sessions

### 5. Checkout Flow (checkout.spec.js)

- ✅ Complete Guest Checkout Process
- ✅ Checkout with Product Variants

## 🔧 Code Quality

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run format
npm run format:check
```

## 🐳 Docker Support

### Build and Run

```bash
docker build -t playwright-tests .
docker run --rm playwright-tests
```

## 🔄 CI/CD Integration

The framework includes a complete GitHub Actions workflow that:

- ✅ Runs on push/PR to main/master branches
- ✅ Installs dependencies and Playwright browsers
- ✅ Executes all tests across multiple browsers
- ✅ Generates and uploads Allure reports as artifacts
- ✅ Provides test results in GitHub Actions interface

## 🏗️ Framework Architecture

### Page Object Model (POM)

- **HomePage**: Search, navigation, newsletter subscription
- **LoginPage**: Authentication, registration, account management
- **CategoryPage**: Product filtering, sorting, pagination
- **ProductPage**: Product details, variants, cart operations
- **CartPage**: Cart management, quantity updates, vouchers
- **ContactUsPage**: Contact form interactions
- **CheckoutPage**: Checkout process management

### Test Data Management

- External JSON files for test data
- Faker.js integration for dynamic data generation
- Environment-specific configuration support

### Reporting

- **HTML Reports**: Built-in Playwright HTML reporter with screenshots
- **Allure Reports**: Advanced reporting with detailed analytics and trends

## 🛠️ Configuration

### Cross-Browser Testing

- Desktop Chrome, Firefox, Safari
- Mobile Chrome (Pixel 5 emulation)
- Configurable viewport sizes and device emulation

### Test Execution

- Parallel execution support
- Automatic retries on CI
- Screenshot capture on failures
- Video recording on first retry

## 🤝 Contributing

1. Follow the established Page Object Model pattern
2. Add test data to the `test-data/` directory
3. Use faker.js for dynamic test data generation
4. Ensure code quality with ESLint and Prettier
5. Write descriptive test steps using `test.step()`
6. Include proper error handling and fallbacks
7. Add appropriate waits and assertions

## 🚦 Best Practices Implemented

- **Robust Locators**: Preference for accessible and stable selectors
- **Error Handling**: Graceful handling of edge cases and UI variations
- **Dynamic Waits**: Smart waiting strategies instead of hard delays
- **Modular Design**: Reusable page objects and utility functions
- **Test Isolation**: Independent test scenarios with proper cleanup
- **Cross-Browser Compatibility**: Tests work across different browsers
- **Maintainable Code**: Clean, documented, and well-structured codebase

---

Built with ❤️ using Playwright, JavaScript, and modern testing best practices.
