#!/usr/bin/env node

/**
 * GitHub Project Daily Snapshot
 *
 * Fetches GitHub repositories and generates a JSON file containing
 * projects with GitHub Pages enabled.
 *
 * Environment Variables:
 *   GITHUB_USERNAME - GitHub username to fetch repos for (default: Chriszhang6)
 *   GITHUB_TOKEN    - Personal Access Token for API authentication (optional)
 *   OUTPUT_FILE     - Path to output JSON file (default: ./projects.json)
 *   FILTER_FORKS    - Skip forked repositories (default: true)
 *   FILTER_ARCHIVED - Skip archived repositories (default: true)
 *   MIN_STARS       - Minimum star count (default: 0)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration from environment variables with defaults
const config = {
  username: process.env.GITHUB_USERNAME || 'Chriszhang6',
  token: process.env.GITHUB_TOKEN || '',
  outputFile: process.env.OUTPUT_FILE || path.join(process.cwd(), 'projects.json'),
  filterForks: process.env.FILTER_FORKS !== 'false',
  filterArchived: process.env.FILTER_ARCHIVED !== 'false',
  minStars: parseInt(process.env.MIN_STARS || '0', 10)
};

// GitHub API endpoint for user repositories
const REPOS_API = `https://api.github.com/users/${config.username}/repos?per_page=100&type=owner&sort=updated`;

/**
 * Make an HTTPS request with proper headers
 */
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Project-Daily-Snapshot',
        'Accept': 'application/vnd.github.v3+json',
        ...headers
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Check if a repository has GitHub Pages enabled using the API
 */
async function hasGitHubPagesAPI(repoName) {
  if (!config.token) return false;

  try {
    const headers = { 'Authorization': `Bearer ${config.token}` };
    await httpsGet(
      `https://api.github.com/repos/${config.username}/${repoName}/pages`,
      headers
    );
    return true;
  } catch (error) {
    // 404 means no Pages configured
    return false;
  }
}

/**
 * Test if GitHub Pages URL exists by making a HEAD request
 */
async function testPagesURL(repoName) {
  return new Promise((resolve) => {
    const pagesUrl = `https://${config.username}.github.io/${repoName}/`;

    const options = {
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Project-Daily-Snapshot'
      }
    };

    const req = https.get(pagesUrl, options, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Check if a repository is likely to have GitHub Pages based on naming patterns
 * This is a fallback method when API and URL tests fail
 */
function likelyHasPages(repo) {
  const pagesPatterns = [
    /\.github\.io$/,           // Main pages repo
    /-homepage$/,              // Common suffix
    /-portfolio$/,             // Portfolio sites
    /-website$/,               // Website repos
    /-site$/,                  // Site repos
    /-demo$/,                  // Demo sites
    /-docs$/,                  // Documentation sites
  ];

  return pagesPatterns.some(pattern => pattern.test(repo.name));
}

/**
 * Format repository data for the output JSON file
 */
function formatProjectData(repo) {
  // Determine the Pages URL
  let pagesUrl;
  if (repo.name.includes(`${config.username}.github.io`)) {
    pagesUrl = `https://${config.username}.github.io/`;
  } else {
    pagesUrl = `https://${config.username}.github.io/${repo.name}/`;
  }

  return {
    name: repo.name,
    description: repo.description || 'A GitHub project',
    url: pagesUrl,
    github: repo.html_url,
    language: repo.language || 'Various',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    createdAt: repo.created_at,
    topics: repo.topics || [],
    homepage: repo.homepage || null
  };
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔄 GitHub Project Daily Snapshot');
  console.log(`👤 Username: ${config.username}`);
  console.log(`📁 Output: ${config.outputFile}`);

  const headers = config.token ? { 'Authorization': `Bearer ${config.token}` } : {};

  try {
    // Fetch all repositories
    console.log('🔍 Fetching repositories...');
    const repos = await httpsGet(REPOS_API, headers);
    console.log(`✅ Found ${repos.length} repositories`);

    // Log all repo names for debugging
    console.log(`📋 All repositories:`, repos.map(r => r.name).join(', '));

    // Filter and process repositories
    const projects = [];

    for (const repo of repos) {
      // Apply filters
      if (config.filterForks && repo.fork) {
        console.log(`  ⊝ Skipping ${repo.name} (fork)`);
        continue;
      }
      if (config.filterArchived && repo.archived) {
        console.log(`  ⊝ Skipping ${repo.name} (archived)`);
        continue;
      }
      if (repo.stargazers_count < config.minStars) {
        console.log(`  ⊝ Skipping ${repo.name} (stars: ${repo.stargazers_count} < ${config.minStars})`);
        continue;
      }

      console.log(`  🔍 Checking ${repo.name}...`);

      // Check if repo has GitHub Pages
      let hasPages = false;
      let detectionMethod = '';

      // Method 1: Try GitHub Pages API (requires token)
      if (config.token) {
        try {
          hasPages = await hasGitHubPagesAPI(repo.name);
          detectionMethod = hasPages ? 'API' : 'API (not found)';
        } catch (e) {
          detectionMethod = `API error: ${e.message}`;
        }
        console.log(`    API check: ${detectionMethod}`);
      }

      // Method 2: Test URL directly
      if (!hasPages) {
        try {
          hasPages = await testPagesURL(repo.name);
          detectionMethod = hasPages ? 'URL test' : 'URL test (not found)';
        } catch (e) {
          detectionMethod = `URL test error: ${e.message}`;
        }
        console.log(`    URL test: ${detectionMethod}`);
      }

      // Method 3: Check naming patterns (last resort)
      if (!hasPages && likelyHasPages(repo)) {
        hasPages = true;
        detectionMethod = 'Pattern match';
        console.log(`    Pattern match: ✓`);
      }

      if (hasPages) {
        const project = formatProjectData(repo);
        projects.push(project);
        console.log(`  ✅ ${repo.name} - ADDED (${detectionMethod})`);
      } else {
        console.log(`  ⊘ ${repo.name} - Skipped (no Pages)`);
      }
    }

    // Sort by stars (descending) and then by updated date
    projects.sort((a, b) => {
      if (b.stars !== a.stars) {
        return b.stars - a.stars;
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    // Write to output file
    const outputPath = path.resolve(config.outputFile);
    const outputDir = path.dirname(outputPath);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(projects, null, 2), 'utf8');

    console.log(`\n✨ Successfully updated ${projects.length} projects`);
    console.log(`📁 Output: ${outputPath}`);

    // Log summary
    if (projects.length > 0) {
      console.log('\n📊 Project Summary:');
      projects.forEach(p => {
        console.log(`  - ${p.name} (${p.language}, ⭐ ${p.stars})`);
        console.log(`    ${p.url}`);
      });
    } else {
      console.log('\n⚠️  No projects found with GitHub Pages enabled.');
      console.log('💡 Tip: Make sure your repositories have GitHub Pages enabled.');
      console.log('💡 Tip: Add a PAT_TOKEN secret for better API access.');
    }

    console.log(`\n🕐 Last updated: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
