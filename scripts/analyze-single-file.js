const fs = require('fs');
const path = require('path');

/**
 * Single File Analyzer for Codegen Output
 * Analyzes a single generated Codegen file and creates detailed reports
 */

class SingleFileAnalyzer {
  constructor() {
    this.outputDir = '.github/CodeGenLocator';
  }

  analyzeFile(filePath, sessionName) {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }

    console.log(`🔍 Analyzing file: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = this.extractLocators(content);
    
    this.generateDetailedReport(analysis, sessionName, filePath);
    this.generatePageObjectSuggestions(analysis, sessionName);
    this.generateLocatorList(analysis, sessionName);
    
    console.log(`\n✅ Analysis complete! Check ${this.outputDir} for results.`);
  }

  extractLocators(content) {
    const analysis = {
      locators: [],
      actions: [],
      imports: [],
      metadata: {
        totalLines: content.split('\n').length,
        timestamp: new Date().toISOString()
      }
    };

    // Extract imports
    const importRegex = /import.*from.*['"](.*)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      analysis.imports.push(match[1]);
    }

    // Extract locators with more context
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Find page.locator() calls
      const locatorMatch = line.match(/page\.locator\(['"`]([^'"`]+)['"`]\)/);
      if (locatorMatch) {
        const selector = locatorMatch[1];
        
        // Look for chained methods (click, fill, etc.)
        const chainedMethods = this.extractChainedMethods(line);
        
        analysis.locators.push({
          selector,
          lineNumber: index + 1,
          fullLine: line.trim(),
          type: this.classifySelector(selector),
          suggestedName: this.generateVariableName(selector),
          chainedMethods,
          context: this.getLineContext(lines, index)
        });
      }

      // Extract actions separately
      const actionMatch = line.match(/\.(click|fill|selectOption|check|uncheck|hover|focus)\s*\(/);
      if (actionMatch) {
        analysis.actions.push({
          action: actionMatch[1],
          lineNumber: index + 1,
          fullLine: line.trim()
        });
      }
    });

    return analysis;
  }

  extractChainedMethods(line) {
    const methods = [];
    const chainRegex = /\.(click|fill|selectOption|check|uncheck|hover|focus|waitFor|isVisible)\s*\([^)]*\)/g;
    let match;
    while ((match = chainRegex.exec(line)) !== null) {
      methods.push(match[1]);
    }
    return methods;
  }

  classifySelector(selector) {
    if (selector.startsWith('#')) return 'id';
    if (selector.startsWith('.')) return 'class';
    if (selector.includes('text=')) return 'text';
    if (selector.includes('[data-testid')) return 'testid';
    if (selector.includes('[') && selector.includes(']')) return 'attribute';
    if (selector.includes('>>')) return 'complex';
    if (selector.includes('nth-child')) return 'positional';
    return 'css';
  }

  generateVariableName(selector) {
    let name = selector
      .replace(/^[#\.]/, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();

    // Add semantic prefixes
    if (selector.includes('search')) name = 'search_' + name;
    if (selector.includes('cart')) name = 'cart_' + name;
    if (selector.includes('login') || selector.includes('signin')) name = 'login_' + name;
    if (selector.includes('button')) name = name + '_btn';
    if (selector.includes('input')) name = name + '_input';
    if (selector.includes('form')) name = name + '_form';

    return name || 'unknown_element';
  }

  getLineContext(lines, index) {
    const start = Math.max(0, index - 1);
    const end = Math.min(lines.length, index + 2);
    return lines.slice(start, end).map((line, i) => 
      `${start + i + 1}: ${line}`
    ).join('\n');
  }

  generateDetailedReport(analysis, sessionName, originalFile) {
    const report = {
      sessionName,
      originalFile: path.basename(originalFile),
      timestamp: new Date().toISOString(),
      summary: {
        totalLocators: analysis.locators.length,
        totalActions: analysis.actions.length,
        totalLines: analysis.metadata.totalLines,
        locatorTypes: this.getLocatorTypeDistribution(analysis.locators)
      },
      locators: analysis.locators,
      actions: analysis.actions,
      recommendations: this.generateRecommendations(analysis),
      pageObjectSuggestions: this.suggestPageObjects(analysis)
    };

    const reportFile = path.join(this.outputDir, `${sessionName}-detailed-analysis.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📊 Detailed report: ${path.basename(reportFile)}`);

    // Generate markdown report
    this.generateMarkdownReport(report, sessionName);
  }

  getLocatorTypeDistribution(locators) {
    const distribution = {};
    locators.forEach(loc => {
      distribution[loc.type] = (distribution[loc.type] || 0) + 1;
    });
    return distribution;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Check for fragile locators
    const fragileLocators = analysis.locators.filter(l => 
      l.type === 'positional' || l.type === 'complex'
    );
    
    if (fragileLocators.length > 0) {
      recommendations.push({
        type: 'fragile-locators',
        severity: 'warning',
        message: `Found ${fragileLocators.length} potentially fragile locator(s)`,
        locators: fragileLocators.map(l => l.selector)
      });
    }

    // Check for missing test IDs
    const hasTestIds = analysis.locators.some(l => l.type === 'testid');
    if (!hasTestIds) {
      recommendations.push({
        type: 'missing-testids',
        severity: 'info',
        message: 'Consider adding data-testid attributes for more stable testing',
        suggestion: 'Add data-testid attributes to key elements'
      });
    }

    // Check for good practices
    const goodLocators = analysis.locators.filter(l => 
      l.type === 'id' || l.type === 'testid'
    );
    
    if (goodLocators.length > 0) {
      recommendations.push({
        type: 'good-practices',
        severity: 'success',
        message: `Found ${goodLocators.length} stable locator(s) using IDs or test IDs`,
        locators: goodLocators.map(l => l.selector)
      });
    }

    return recommendations;
  }

  suggestPageObjects(analysis) {
    const suggestions = new Map();

    analysis.locators.forEach(locator => {
      const pageType = this.inferPageType(locator.selector, locator.fullLine);
      if (!suggestions.has(pageType)) {
        suggestions.set(pageType, []);
      }
      suggestions.get(pageType).push(locator);
    });

    return Object.fromEntries(suggestions);
  }

  inferPageType(selector, context) {
    const combined = (selector + ' ' + context).toLowerCase();
    
    if (combined.includes('search')) return 'HomePage';
    if (combined.includes('cart') || combined.includes('quantity')) return 'CartPage';
    if (combined.includes('login') || combined.includes('signin') || combined.includes('email') && combined.includes('password')) return 'LoginPage';
    if (combined.includes('product') || combined.includes('add to cart')) return 'ProductPage';
    if (combined.includes('contact') || combined.includes('message')) return 'ContactPage';
    if (combined.includes('checkout') || combined.includes('order')) return 'CheckoutPage';
    if (combined.includes('category') || combined.includes('filter')) return 'CategoryPage';
    
    return 'GeneralPage';
  }

  generatePageObjectSuggestions(analysis, sessionName) {
    const suggestions = this.suggestPageObjects(analysis);
    let content = `// 🤖 Page Object Suggestions from Codegen\n`;
    content += `// Session: ${sessionName}\n`;
    content += `// Generated: ${new Date().toISOString()}\n\n`;

    for (const [pageType, locators] of Object.entries(suggestions)) {
      content += `// ========== ${pageType} ==========\n`;
      content += `export class Enhanced${pageType} {\n`;
      content += `  constructor(page) {\n`;
      content += `    this.page = page;\n\n`;

      // Group locators by type for better organization
      const groupedLocators = {};
      locators.forEach(loc => {
        if (!groupedLocators[loc.type]) groupedLocators[loc.type] = [];
        groupedLocators[loc.type].push(loc);
      });

      for (const [type, typeLocators] of Object.entries(groupedLocators)) {
        content += `    // ${type.toUpperCase()} locators\n`;
        typeLocators.forEach(loc => {
          content += `    this.${loc.suggestedName} = page.locator('${loc.selector}'); // Line ${loc.lineNumber}\n`;
        });
        content += `\n`;
      }

      content += `  }\n\n`;

      // Generate method suggestions based on actions
      const actions = [...new Set(locators.flatMap(l => l.chainedMethods))];
      actions.forEach(action => {
        content += `  async ${action}Element(elementName) {\n`;
        content += `    // Implement ${action} action\n`;
        content += `    await this[elementName].${action}();\n`;
        content += `  }\n\n`;
      });

      content += `}\n\n`;
    }

    const suggestionsFile = path.join(this.outputDir, `${sessionName}-page-object-suggestions.js`);
    fs.writeFileSync(suggestionsFile, content);
    console.log(`💡 Page object suggestions: ${path.basename(suggestionsFile)}`);
  }

  generateLocatorList(analysis, sessionName) {
    let content = `# 🎯 Locator List - ${sessionName}\n\n`;
    content += `Generated: ${new Date().toISOString()}\n\n`;

    // Group by type
    const grouped = {};
    analysis.locators.forEach(loc => {
      if (!grouped[loc.type]) grouped[loc.type] = [];
      grouped[loc.type].push(loc);
    });

    for (const [type, locators] of Object.entries(grouped)) {
      content += `## ${type.toUpperCase()} Locators (${locators.length})\n\n`;
      
      locators.forEach((loc, index) => {
        content += `### ${index + 1}. ${loc.suggestedName}\n`;
        content += `- **Selector:** \`${loc.selector}\`\n`;
        content += `- **Line:** ${loc.lineNumber}\n`;
        content += `- **Actions:** ${loc.chainedMethods.join(', ') || 'None'}\n`;
        content += `- **Code:** \`${loc.fullLine}\`\n\n`;
      });
    }

    const listFile = path.join(this.outputDir, `${sessionName}-locator-list.md`);
    fs.writeFileSync(listFile, content);
    console.log(`📋 Locator list: ${path.basename(listFile)}`);
  }

  generateMarkdownReport(report, sessionName) {
    let content = `# 📊 Codegen Analysis Report: ${sessionName}\n\n`;
    content += `**Generated:** ${report.timestamp}\n`;
    content += `**Original File:** ${report.originalFile}\n\n`;

    content += `## 📈 Summary\n\n`;
    content += `- **Total Locators:** ${report.summary.totalLocators}\n`;
    content += `- **Total Actions:** ${report.summary.totalActions}\n`;
    content += `- **Total Lines:** ${report.summary.totalLines}\n\n`;

    content += `### Locator Type Distribution\n\n`;
    for (const [type, count] of Object.entries(report.summary.locatorTypes)) {
      content += `- **${type}:** ${count}\n`;
    }

    if (report.recommendations.length > 0) {
      content += `\n## ⚠️ Recommendations\n\n`;
      report.recommendations.forEach(rec => {
        const emoji = rec.severity === 'warning' ? '⚠️' : rec.severity === 'success' ? '✅' : 'ℹ️';
        content += `### ${emoji} ${rec.type}\n`;
        content += `${rec.message}\n\n`;
      });
    }

    content += `\n## 🏗️ Suggested Page Objects\n\n`;
    for (const [pageType, locators] of Object.entries(report.pageObjectSuggestions)) {
      content += `### ${pageType} (${locators.length} locators)\n`;
      locators.slice(0, 5).forEach(loc => {
        content += `- \`${loc.selector}\`\n`;
      });
      if (locators.length > 5) {
        content += `- ... and ${locators.length - 5} more\n`;
      }
      content += `\n`;
    }

    const mdFile = path.join(this.outputDir, `${sessionName}-report.md`);
    fs.writeFileSync(mdFile, content);
    console.log(`📄 Markdown report: ${path.basename(mdFile)}`);
  }
}

// CLI interface
if (require.main === module) {
  const analyzer = new SingleFileAnalyzer();
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node analyze-single-file.js <file-path> <session-name>');
    process.exit(1);
  }
  
  const filePath = args[0];
  const sessionName = args[1];
  
  analyzer.analyzeFile(filePath, sessionName);
}

module.exports = { SingleFileAnalyzer };
