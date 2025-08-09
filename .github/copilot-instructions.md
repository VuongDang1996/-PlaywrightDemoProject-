# Playwright Advanced Test Automation Framework Instructions

This workspace contains a production-ready test automation framework for e-commerce testing using Playwright and JavaScript.

## Project Overview

- **Target Website**: http://automationpractice.pl/
- **Core Libraries**: @playwright/test, allure-playwright, @faker-js/faker
- **Testing Pattern**: Page Object Model (POM)
- **Reporting**: Dual reporting with HTML and Allure
- **CI/CD**: GitHub Actions integration
- **Quality**: ESLint and Prettier enforcement

## Key Features

1. **Cross-browser testing**: Chromium, Firefox, WebKit
2. **Mobile testing**: Pixel 5 emulation
3. **External test data**: JSON-based data management
4. **Docker support**: Containerized test execution
5. **Advanced reporting**: HTML and Allure reports

## Development Guidelines

- Follow Page Object Model pattern for all page interactions
- Use external JSON files for test data
- Implement test steps for better reporting
- Use faker.js for dynamic test data generation
- Maintain code quality with ESLint and Prettier

## Test Structure

- `page-objects/`: Contains page object classes
- `test-data/`: JSON files with test data
- `tests/e2e/`: End-to-end test specifications
- `allure-results/`: Generated Allure test data

## Available Scripts

- `npm test`: Run all tests
- `npm run test:headed`: Run tests in headed mode
- `npm run test:ui`: Run tests with UI mode
- `npm run allure:report`: Generate and open Allure report
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
