const { chromium } = require('@playwright/test');

/**
 * Codegen Helper Script for Playwright Framework Integration
 * This script helps extract and validate locators from Codegen sessions
 */

class CodegenHelper {
  constructor() {
    this.recordedActions = [];
    this.extractedLocators = new Map();
  }

  /**
   * Start a focused Codegen session for specific page object
   */
  async startCodegenSession(pageType = 'homepage') {
    const urls = {
      homepage: 'http://automationpractice.pl/',
      cart: 'http://automationpractice.pl/index.php?controller=order',
      login: 'http://automationpractice.pl/index.php?controller=authentication',
      women: 'http://automationpractice.pl/index.php?id_category=3&controller=category',
      contact: 'http://automationpractice.pl/index.php?controller=contact'
    };

    const targetUrl = urls[pageType] || urls.homepage;
    
    console.log(`🎬 Starting Codegen session for: ${pageType}`);
    console.log(`🌐 Target URL: ${targetUrl}`);
    console.log(`📝 Record your interactions and copy the generated code`);
    console.log(`🔧 Use the output to enhance Page Objects\n`);

    const { spawn } = require('child_process');
    
    const codegen = spawn('npx', [
      'playwright', 
      'codegen', 
      targetUrl,
      '--target=javascript',
      '--viewport-size=1280,720'
    ], { stdio: 'inherit' });
    
    return new Promise((resolve) => {
      codegen.on('close', (code) => {
        console.log(`✅ Codegen session ended`);
        resolve(code);
      });
    });
  }

  /**
   * Analyze generated code and extract useful locators
   */
  analyzeGeneratedCode(codeString) {
    const locatorRegex = /page\.locator\(['"`]([^'"`]+)['"`]\)/g;
    const clickRegex = /\.click\(\)/g;
    const fillRegex = /\.fill\(['"`]([^'"`]+)['"`]\)/g;
    
    const locators = [];
    let match;
    
    while ((match = locatorRegex.exec(codeString)) !== null) {
      locators.push(match[1]);
    }
    
    return {
      locators: [...new Set(locators)], // Remove duplicates
      hasClicks: clickRegex.test(codeString),
      hasFills: fillRegex.test(codeString),
      codeLength: codeString.length
    };
  }

  /**
   * Generate improved Page Object methods from Codegen output
   */
  generatePageObjectMethods(analysis, pageObjectName) {
    let output = `\n// 🤖 Generated methods for ${pageObjectName} (from Codegen)\n`;
    
    analysis.locators.forEach((locator, index) => {
      const methodName = this.generateMethodName(locator);
      output += `
  // Generated locator: ${locator}
  get ${methodName}() {
    return this.page.locator('${locator}');
  }`;
    });
    
    return output;
  }

  generateMethodName(locator) {
    // Convert CSS selector to camelCase method name
    return locator
      .replace(/[#\.]/g, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^./, l => l.toLowerCase()) + 'Element';
  }
}

// Usage examples
const helper = new CodegenHelper();

// Export for use in other scripts
module.exports = { CodegenHelper };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const pageType = args[0] || 'homepage';
  
  console.log('🚀 Playwright Codegen Helper');
  console.log('=============================\n');
  
  helper.startCodegenSession(pageType);
}
