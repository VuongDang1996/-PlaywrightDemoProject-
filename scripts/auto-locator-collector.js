const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Automatic Locator Collector for Playwright Codegen
 * This tool captures Codegen output and organizes locators by page/functionality
 */

class AutoLocatorCollector {
  constructor() {
    this.outputDir = '.github/CodeGenLocator';
    this.locatorDatabase = new Map();
    this.sessionData = {
      timestamp: new Date().toISOString(),
      url: '',
      locators: [],
      actions: [],
      fullScript: ''
    };
  }

  /**
   * Start Codegen with automatic output capture
   */
  async startCodegenWithCapture(url = 'http://automationpractice.pl/', sessionName = 'default') {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const outputFile = path.join(this.outputDir, `${sessionName}-${Date.now()}.js`);
    
    console.log('🎬 Starting Codegen with automatic capture...');
    console.log(`📁 Output will be saved to: ${outputFile}`);
    console.log(`🌐 Target URL: ${url}\n`);

    const codegen = spawn('npx', [
      'playwright',
      'codegen',
      url,
      '--target=javascript',
      '--output=' + outputFile
    ], { 
      stdio: 'inherit',
      shell: true  // Add shell: true for Windows compatibility
    });

    return new Promise((resolve) => {
      codegen.on('close', (code) => {
        console.log(`\n✅ Codegen session completed. Processing output...`);
        this.processGeneratedFile(outputFile, sessionName, url);
        resolve(code);
      });
    });
  }

  /**
   * Process the generated Codegen file and extract structured data
   */
  processGeneratedFile(filePath, sessionName, url) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const analysis = this.analyzeCodegenOutput(content);
      
      // Save structured analysis
      this.saveStructuredAnalysis(analysis, sessionName, url);
      
      // Update master locator database
      this.updateLocatorDatabase(analysis, sessionName);
      
      // Generate page object suggestions
      this.generatePageObjectSuggestions(analysis, sessionName);
      
      console.log(`\n📊 Analysis complete! Check ${this.outputDir} for results.`);
      
    } catch (error) {
      console.error('❌ Error processing generated file:', error.message);
    }
  }

  /**
   * Analyze Codegen output and extract all useful information
   */
  analyzeCodegenOutput(codegenContent) {
    const analysis = {
      locators: [],
      actions: [],
      pageObjects: new Map(),
      interactions: [],
      metadata: {
        timestamp: new Date().toISOString(),
        totalLines: codegenContent.split('\n').length,
        complexity: 'simple'
      }
    };

    // Extract all locators with context
    const locatorRegex = /page\.locator\(['"`]([^'"`]+)['"`]\)/g;
    let match;
    while ((match = locatorRegex.exec(codegenContent)) !== null) {
      const locator = match[1];
      const lineNumber = codegenContent.substring(0, match.index).split('\n').length;
      
      analysis.locators.push({
        selector: locator,
        lineNumber,
        type: this.classifyLocator(locator),
        suggestedName: this.generateLocatorName(locator),
        context: this.getLocatorContext(codegenContent, match.index)
      });
    }

    // Extract actions (click, fill, etc.)
    const actionRegex = /\.(click|fill|selectOption|check|uncheck)\([^)]*\)/g;
    while ((match = actionRegex.exec(codegenContent)) !== null) {
      const action = match[1];
      const lineNumber = codegenContent.substring(0, match.index).split('\n').length;
      
      analysis.actions.push({
        action,
        lineNumber,
        fullCommand: match[0],
        context: this.getLocatorContext(codegenContent, match.index)
      });
    }

    // Group by potential page objects
    analysis.locators.forEach(loc => {
      const pageType = this.inferPageType(loc.selector, loc.context);
      if (!analysis.pageObjects.has(pageType)) {
        analysis.pageObjects.set(pageType, []);
      }
      analysis.pageObjects.get(pageType).push(loc);
    });

    return analysis;
  }

  /**
   * Classify locator type (ID, class, text, etc.)
   */
  classifyLocator(selector) {
    if (selector.startsWith('#')) return 'id';
    if (selector.startsWith('.')) return 'class';
    if (selector.includes('text=')) return 'text';
    if (selector.includes('[') && selector.includes(']')) return 'attribute';
    if (selector.includes('>>')) return 'complex';
    return 'css';
  }

  /**
   * Generate meaningful name for locator
   */
  generateLocatorName(selector) {
    let name = selector
      .replace(/[#\.]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    
    // Add semantic meaning based on selector
    if (selector.includes('search')) name = 'search_' + name;
    if (selector.includes('cart')) name = 'cart_' + name;
    if (selector.includes('login')) name = 'login_' + name;
    if (selector.includes('button')) name = name + '_button';
    if (selector.includes('input')) name = name + '_input';
    
    return name;
  }

  /**
   * Get context around locator
   */
  getLocatorContext(content, position) {
    const lines = content.split('\n');
    const lineIndex = content.substring(0, position).split('\n').length - 1;
    
    const contextStart = Math.max(0, lineIndex - 2);
    const contextEnd = Math.min(lines.length, lineIndex + 3);
    
    return lines.slice(contextStart, contextEnd).join('\n');
  }

  /**
   * Infer which page object this locator belongs to
   */
  inferPageType(selector, context) {
    const contextLower = context.toLowerCase();
    const selectorLower = selector.toLowerCase();
    
    if (selectorLower.includes('search') || contextLower.includes('search')) return 'HomePage';
    if (selectorLower.includes('cart') || contextLower.includes('cart')) return 'CartPage';
    if (selectorLower.includes('login') || contextLower.includes('signin')) return 'LoginPage';
    if (selectorLower.includes('product') || contextLower.includes('add to cart')) return 'ProductPage';
    if (selectorLower.includes('contact') || contextLower.includes('message')) return 'ContactPage';
    if (selectorLower.includes('checkout') || contextLower.includes('order')) return 'CheckoutPage';
    
    return 'GeneralPage';
  }

  /**
   * Save structured analysis to JSON file
   */
  saveStructuredAnalysis(analysis, sessionName, url) {
    const fileName = `${sessionName}-analysis-${Date.now()}.json`;
    const filePath = path.join(this.outputDir, fileName);
    
    const outputData = {
      session: sessionName,
      url,
      timestamp: new Date().toISOString(),
      summary: {
        totalLocators: analysis.locators.length,
        totalActions: analysis.actions.length,
        pageObjectsDetected: Array.from(analysis.pageObjects.keys()),
        complexity: analysis.locators.length > 20 ? 'complex' : 'simple'
      },
      locators: analysis.locators,
      actions: analysis.actions,
      pageObjects: Object.fromEntries(analysis.pageObjects),
      recommendations: this.generateRecommendations(analysis)
    };
    
    fs.writeFileSync(filePath, JSON.stringify(outputData, null, 2));
    console.log(`📄 Structured analysis saved to: ${fileName}`);
  }

  /**
   * Generate recommendations for improving page objects
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Check for duplicate-like locators
    const selectors = analysis.locators.map(l => l.selector);
    const duplicates = selectors.filter((item, index) => selectors.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      recommendations.push({
        type: 'duplicates',
        message: 'Found duplicate locators that could be consolidated',
        details: duplicates
      });
    }
    
    // Check for fragile locators
    const fragileSelectors = analysis.locators.filter(l => 
      l.selector.includes('nth-child') || 
      l.selector.includes('xpath') ||
      l.type === 'complex'
    );
    
    if (fragileSelectors.length > 0) {
      recommendations.push({
        type: 'fragile',
        message: 'Found potentially fragile locators',
        details: fragileSelectors.map(l => l.selector)
      });
    }
    
    return recommendations;
  }

  /**
   * Update master locator database
   */
  updateLocatorDatabase(analysis, sessionName) {
    const dbFile = path.join(this.outputDir, 'locator-database.json');
    let database = {};
    
    if (fs.existsSync(dbFile)) {
      database = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    }
    
    database[sessionName] = {
      timestamp: new Date().toISOString(),
      locatorCount: analysis.locators.length,
      locators: analysis.locators
    };
    
    fs.writeFileSync(dbFile, JSON.stringify(database, null, 2));
    console.log(`🗄️  Master locator database updated`);
  }

  /**
   * Generate page object improvement suggestions
   */
  generatePageObjectSuggestions(analysis, sessionName) {
    const suggestionsFile = path.join(this.outputDir, `${sessionName}-pageobject-suggestions.js`);
    let suggestions = `// 🤖 Page Object Suggestions from Codegen Session: ${sessionName}\n`;
    suggestions += `// Generated on: ${new Date().toISOString()}\n\n`;
    
    for (const [pageType, locators] of analysis.pageObjects) {
      suggestions += `// ========== ${pageType} ==========\n`;
      suggestions += `class Enhanced${pageType} {\n`;
      suggestions += `  constructor(page) {\n`;
      suggestions += `    this.page = page;\n\n`;
      
      locators.forEach(loc => {
        suggestions += `    // From Codegen: ${loc.context.split('\n')[0]}\n`;
        suggestions += `    this.${loc.suggestedName} = page.locator('${loc.selector}');\n\n`;
      });
      
      suggestions += `  }\n\n`;
      
      // Generate method suggestions
      const uniqueActions = [...new Set(analysis.actions.map(a => a.action))];
      uniqueActions.forEach(action => {
        suggestions += `  async perform${action.charAt(0).toUpperCase() + action.slice(1)}Action() {\n`;
        suggestions += `    // TODO: Implement ${action} action using the locators above\n`;
        suggestions += `  }\n\n`;
      });
      
      suggestions += `}\n\n`;
    }
    
    fs.writeFileSync(suggestionsFile, suggestions);
    console.log(`💡 Page object suggestions saved to: ${path.basename(suggestionsFile)}`);
  }
}

// CLI interface
if (require.main === module) {
  const collector = new AutoLocatorCollector();
  const args = process.argv.slice(2);
  
  const url = args[0] || 'http://automationpractice.pl/';
  const sessionName = args[1] || `session_${Date.now()}`;
  
  console.log('🚀 Auto Locator Collector for Playwright Codegen');
  console.log('================================================\n');
  
  collector.startCodegenWithCapture(url, sessionName);
}

module.exports = { AutoLocatorCollector };
