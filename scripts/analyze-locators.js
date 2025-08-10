const fs = require('fs');
const path = require('path');

/**
 * Locator Analysis Tool
 * Analyzes collected locators and generates reports
 */

class LocatorAnalyzer {
  constructor() {
    this.locatorDir = '.github/CodeGenLocator';
    this.outputDir = 'locator-reports';
  }

  /**
   * Analyze all collected locator files
   */
  analyzeAllSessions() {
    if (!fs.existsSync(this.locatorDir)) {
      console.log('❌ No locator directory found. Run codegen sessions first.');
      return;
    }

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const files = fs.readdirSync(this.locatorDir)
      .filter(file => file.endsWith('-analysis.json'));

    if (files.length === 0) {
      console.log('❌ No analysis files found. Run auto-locator-collector first.');
      return;
    }

    console.log(`🔍 Analyzing ${files.length} session(s)...`);

    const allSessions = files.map(file => {
      const content = fs.readFileSync(path.join(this.locatorDir, file), 'utf8');
      return JSON.parse(content);
    });

    this.generateConsolidatedReport(allSessions);
    this.generatePageObjectMergeReport(allSessions);
    this.generateLocatorQualityReport(allSessions);
    this.generateUsageStatistics(allSessions);
  }

  /**
   * Generate consolidated report of all sessions
   */
  generateConsolidatedReport(sessions) {
    const report = {
      summary: {
        totalSessions: sessions.length,
        totalLocators: sessions.reduce((sum, s) => sum + s.summary.totalLocators, 0),
        totalActions: sessions.reduce((sum, s) => sum + s.summary.totalActions, 0),
        generatedAt: new Date().toISOString()
      },
      sessions: sessions.map(s => ({
        session: s.session,
        url: s.url,
        timestamp: s.timestamp,
        locatorCount: s.summary.totalLocators,
        actionCount: s.summary.totalActions,
        complexity: s.summary.complexity
      })),
      allLocators: this.mergeAllLocators(sessions),
      duplicateAnalysis: this.findDuplicateLocators(sessions),
      recommendations: this.generateGlobalRecommendations(sessions)
    };

    const reportFile = path.join(this.outputDir, 'consolidated-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Also generate human-readable version
    this.generateHumanReadableReport(report);
    
    console.log(`📄 Consolidated report saved to: ${reportFile}`);
  }

  /**
   * Merge all locators from all sessions
   */
  mergeAllLocators(sessions) {
    const allLocators = [];
    const locatorMap = new Map();

    sessions.forEach(session => {
      session.locators.forEach(locator => {
        const key = locator.selector;
        if (locatorMap.has(key)) {
          locatorMap.get(key).sessions.push(session.session);
          locatorMap.get(key).count++;
        } else {
          locatorMap.set(key, {
            ...locator,
            sessions: [session.session],
            count: 1
          });
        }
      });
    });

    return Array.from(locatorMap.values())
      .sort((a, b) => b.count - a.count); // Sort by frequency
  }

  /**
   * Find duplicate locators across sessions
   */
  findDuplicateLocators(sessions) {
    const locatorCounts = new Map();
    
    sessions.forEach(session => {
      session.locators.forEach(locator => {
        const selector = locator.selector;
        locatorCounts.set(selector, (locatorCounts.get(selector) || 0) + 1);
      });
    });

    return Array.from(locatorCounts.entries())
      .filter(([selector, count]) => count > 1)
      .map(([selector, count]) => ({ selector, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Generate global recommendations
   */
  generateGlobalRecommendations(sessions) {
    const recommendations = [];
    
    // Check for most used locators
    const mergedLocators = this.mergeAllLocators(sessions);
    const mostUsed = mergedLocators.filter(l => l.count > 1);
    
    if (mostUsed.length > 0) {
      recommendations.push({
        type: 'reusable-locators',
        priority: 'high',
        message: 'These locators appear in multiple sessions and should be prioritized in page objects',
        data: mostUsed.slice(0, 10)
      });
    }

    // Check for fragile locators
    const fragileLocators = mergedLocators.filter(l => 
      l.selector.includes('nth-child') || 
      l.selector.includes('xpath') ||
      l.type === 'complex'
    );

    if (fragileLocators.length > 0) {
      recommendations.push({
        type: 'fragile-locators',
        priority: 'medium',
        message: 'These locators may be fragile and should be improved',
        data: fragileLocators
      });
    }

    return recommendations;
  }

  /**
   * Generate page object merge report
   */
  generatePageObjectMergeReport(sessions) {
    const pageObjectMap = new Map();

    sessions.forEach(session => {
      Object.entries(session.pageObjects).forEach(([pageType, locators]) => {
        if (!pageObjectMap.has(pageType)) {
          pageObjectMap.set(pageType, []);
        }
        pageObjectMap.get(pageType).push(...locators);
      });
    });

    const mergeReport = {
      generatedAt: new Date().toISOString(),
      pageObjects: {}
    };

    for (const [pageType, locators] of pageObjectMap) {
      // Remove duplicates and merge
      const uniqueLocators = locators.reduce((acc, current) => {
        const existing = acc.find(item => item.selector === current.selector);
        if (!existing) {
          acc.push({ ...current, usage_count: 1 });
        } else {
          existing.usage_count++;
        }
        return acc;
      }, []);

      mergeReport.pageObjects[pageType] = {
        totalLocators: uniqueLocators.length,
        locators: uniqueLocators.sort((a, b) => b.usage_count - a.usage_count)
      };
    }

    const reportFile = path.join(this.outputDir, 'page-object-merge-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(mergeReport, null, 2));
    
    // Generate TypeScript definitions
    this.generateTypeScriptDefinitions(mergeReport);
    
    console.log(`🔧 Page object merge report saved to: ${reportFile}`);
  }

  /**
   * Generate TypeScript definitions for locators
   */
  generateTypeScriptDefinitions(mergeReport) {
    let tsContent = `// 🤖 Auto-generated TypeScript definitions for Playwright locators\n`;
    tsContent += `// Generated on: ${new Date().toISOString()}\n\n`;
    tsContent += `import { Page, Locator } from '@playwright/test';\n\n`;

    for (const [pageType, data] of Object.entries(mergeReport.pageObjects)) {
      tsContent += `export interface I${pageType}Locators {\n`;
      
      data.locators.forEach(locator => {
        const propertyName = locator.suggestedName || 'unknownElement';
        tsContent += `  /** Selector: ${locator.selector} | Usage: ${locator.usage_count}x */\n`;
        tsContent += `  ${propertyName}: Locator;\n`;
      });
      
      tsContent += `}\n\n`;
      
      tsContent += `export class Enhanced${pageType} implements I${pageType}Locators {\n`;
      tsContent += `  constructor(private page: Page) {}\n\n`;
      
      data.locators.forEach(locator => {
        const propertyName = locator.suggestedName || 'unknownElement';
        tsContent += `  get ${propertyName}(): Locator {\n`;
        tsContent += `    return this.page.locator('${locator.selector}');\n`;
        tsContent += `  }\n\n`;
      });
      
      tsContent += `}\n\n`;
    }

    const tsFile = path.join(this.outputDir, 'enhanced-page-objects.ts');
    fs.writeFileSync(tsFile, tsContent);
    console.log(`📝 TypeScript definitions saved to: ${tsFile}`);
  }

  /**
   * Generate human-readable report
   */
  generateHumanReadableReport(report) {
    let markdown = `# 🎯 Playwright Locator Analysis Report\n\n`;
    markdown += `**Generated:** ${report.summary.generatedAt}\n\n`;
    
    markdown += `## 📊 Summary\n\n`;
    markdown += `- **Total Sessions:** ${report.summary.totalSessions}\n`;
    markdown += `- **Total Locators:** ${report.summary.totalLocators}\n`;
    markdown += `- **Total Actions:** ${report.summary.totalActions}\n\n`;
    
    markdown += `## 🔍 Session Details\n\n`;
    markdown += `| Session | URL | Locators | Actions | Complexity |\n`;
    markdown += `|---------|-----|----------|---------|------------|\n`;
    
    report.sessions.forEach(session => {
      markdown += `| ${session.session} | ${session.url} | ${session.locatorCount} | ${session.actionCount} | ${session.complexity} |\n`;
    });
    
    markdown += `\n## 🎯 Most Used Locators\n\n`;
    const topLocators = report.allLocators.slice(0, 10);
    topLocators.forEach((locator, index) => {
      markdown += `${index + 1}. \`${locator.selector}\` (used ${locator.count}x)\n`;
    });
    
    if (report.duplicateAnalysis.length > 0) {
      markdown += `\n## ⚠️ Duplicate Locators\n\n`;
      report.duplicateAnalysis.slice(0, 5).forEach(dup => {
        markdown += `- \`${dup.selector}\` appears ${dup.count} times\n`;
      });
    }
    
    const mdFile = path.join(this.outputDir, 'analysis-report.md');
    fs.writeFileSync(mdFile, markdown);
    console.log(`📋 Human-readable report saved to: ${mdFile}`);
  }

  /**
   * Generate locator quality report
   */
  generateLocatorQualityReport(sessions) {
    // Analyze locator quality based on best practices
    const qualityReport = {
      timestamp: new Date().toISOString(),
      qualityScore: 0,
      analysis: {
        good: [],
        warning: [],
        poor: []
      }
    };

    const allLocators = this.mergeAllLocators(sessions);
    
    allLocators.forEach(locator => {
      const score = this.assessLocatorQuality(locator.selector);
      locator.qualityScore = score;
      
      if (score >= 8) qualityReport.analysis.good.push(locator);
      else if (score >= 5) qualityReport.analysis.warning.push(locator);
      else qualityReport.analysis.poor.push(locator);
    });

    qualityReport.qualityScore = Math.round(
      allLocators.reduce((sum, l) => sum + l.qualityScore, 0) / allLocators.length
    );

    const reportFile = path.join(this.outputDir, 'locator-quality-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(qualityReport, null, 2));
    console.log(`⭐ Locator quality report saved to: ${reportFile}`);
  }

  /**
   * Assess locator quality (1-10 scale)
   */
  assessLocatorQuality(selector) {
    let score = 5; // Base score
    
    // Good practices (add points)
    if (selector.startsWith('#')) score += 3; // ID selectors are stable
    if (selector.includes('[data-testid')) score += 3; // Test IDs are excellent
    if (selector.includes('[aria-label')) score += 2; // Accessibility selectors
    if (selector.includes('text=')) score += 1; // Text selectors are readable
    
    // Bad practices (subtract points)
    if (selector.includes('nth-child')) score -= 3; // Position-dependent
    if (selector.includes('xpath')) score -= 2; // Generally fragile
    if (selector.split(' ').length > 4) score -= 2; // Too complex
    if (/\d+/.test(selector)) score -= 1; // Contains numbers (might be dynamic)
    
    return Math.max(1, Math.min(10, score));
  }

  /**
   * Generate usage statistics
   */
  generateUsageStatistics(sessions) {
    const stats = {
      timestamp: new Date().toISOString(),
      locatorTypes: {},
      actionTypes: {},
      pageObjectDistribution: {},
      timeAnalysis: {}
    };

    sessions.forEach(session => {
      // Analyze locator types
      session.locators.forEach(locator => {
        stats.locatorTypes[locator.type] = (stats.locatorTypes[locator.type] || 0) + 1;
      });

      // Analyze action types
      session.actions.forEach(action => {
        stats.actionTypes[action.action] = (stats.actionTypes[action.action] || 0) + 1;
      });

      // Analyze page object distribution
      Object.keys(session.pageObjects).forEach(pageType => {
        stats.pageObjectDistribution[pageType] = (stats.pageObjectDistribution[pageType] || 0) + 1;
      });
    });

    const statsFile = path.join(this.outputDir, 'usage-statistics.json');
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    console.log(`📈 Usage statistics saved to: ${statsFile}`);
  }
}

// CLI interface
if (require.main === module) {
  const analyzer = new LocatorAnalyzer();
  
  console.log('📊 Locator Analysis Tool');
  console.log('========================\n');
  
  analyzer.analyzeAllSessions();
}

module.exports = { LocatorAnalyzer };
