#!/usr/bin/env node

/**
 * E2E Test Runner Script for Patas do Bem Admin Interface
 * 
 * This script helps automate the execution of E2E tests with proper setup
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  frontend: {
    dir: process.cwd(),
    startCommand: 'npm run dev',
    url: 'http://localhost:5173'
  },
  backend: {
    dir: path.join(process.cwd(), '..', 'patas-do-bem-backend'),
    startCommand: 'python src/main.py',
    url: 'http://127.0.0.1:5000'
  },
  tests: {
    timeout: 120000, // 2 minutes
    retries: 2,
    browser: 'chrome'
  }
}

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkPort(url) {
  try {
    execSync(`curl -s ${url} > /dev/null`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

async function waitForService(name, url, maxAttempts = 30) {
  log(`⏳ Waiting for ${name} to be available at ${url}...`, 'yellow')
  
  for (let i = 0; i < maxAttempts; i++) {
    if (checkPort(url)) {
      log(`✅ ${name} is ready!`, 'green')
      return true
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    process.stdout.write('.')
  }
  
  log(`\n❌ ${name} failed to start within timeout`, 'red')
  return false
}

function startService(name, dir, command) {
  log(`🚀 Starting ${name}...`, 'blue')
  
  const child = spawn(command.split(' ')[0], command.split(' ').slice(1), {
    cwd: dir,
    stdio: 'pipe',
    detached: process.platform !== 'win32'
  })
  
  child.stdout.on('data', (data) => {
    if (data.toString().includes('ready') || data.toString().includes('Running')) {
      log(`📡 ${name} output: ${data.toString().trim()}`, 'blue')
    }
  })
  
  child.stderr.on('data', (data) => {
    const error = data.toString().trim()
    if (!error.includes('WARNING') && !error.includes('INFO')) {
      log(`⚠️  ${name} error: ${error}`, 'yellow')
    }
  })
  
  child.on('error', (error) => {
    log(`❌ Failed to start ${name}: ${error.message}`, 'red')
  })
  
  return child
}

function runTests(spec = null, options = {}) {
  log('🧪 Running E2E tests...', 'blue')
  
  const cypressCmd = ['npx', 'cypress', 'run']
  
  // Add specific spec if provided
  if (spec) {
    cypressCmd.push('--spec', `cypress/e2e/${spec}`)
  }
  
  // Add browser
  if (options.browser) {
    cypressCmd.push('--browser', options.browser)
  }
  
  // Add headless mode for CI
  if (options.headless) {
    cypressCmd.push('--headless')
  }
  
  // Add environment variables
  const env = {
    ...process.env,
    CYPRESS_baseUrl: CONFIG.frontend.url,
    CYPRESS_API_BASE_URL: CONFIG.backend.url
  }
  
  try {
    execSync(cypressCmd.join(' '), {
      stdio: 'inherit',
      env,
      cwd: CONFIG.frontend.dir
    })
    log('✅ All tests passed!', 'green')
    return true
  } catch (error) {
    log(`❌ Tests failed with exit code: ${error.status}`, 'red')
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)
  const options = {}
  let spec = null
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--spec':
        spec = args[++i]
        break
      case '--browser':
        options.browser = args[++i]
        break
      case '--headless':
        options.headless = true
        break
      case '--help':
        console.log(`
E2E Test Runner for Patas do Bem

Usage: node run-e2e-tests.js [options]

Options:
  --spec <file>      Run specific test file (e.g., admin-login.cy.js)
  --browser <name>   Browser to use (chrome, firefox, edge)
  --headless         Run in headless mode
  --help             Show this help message

Examples:
  node run-e2e-tests.js                           # Run all tests
  node run-e2e-tests.js --spec admin-login.cy.js  # Run specific test
  node run-e2e-tests.js --browser firefox         # Use Firefox
  node run-e2e-tests.js --headless                # Headless mode
        `)
        process.exit(0)
    }
  }
  
  log('🎯 Patas do Bem E2E Test Runner', 'blue')
  log('================================', 'blue')
  
  // Check if services are already running
  const frontendRunning = checkPort(CONFIG.frontend.url)
  const backendRunning = checkPort(CONFIG.backend.url)
  
  let frontendProcess, backendProcess
  
  // Start services if not running
  if (!backendRunning) {
    if (!fs.existsSync(CONFIG.backend.dir)) {
      log(`❌ Backend directory not found: ${CONFIG.backend.dir}`, 'red')
      process.exit(1)
    }
    
    backendProcess = startService('Backend', CONFIG.backend.dir, CONFIG.backend.startCommand)
    
    if (!(await waitForService('Backend', CONFIG.backend.url))) {
      process.exit(1)
    }
  } else {
    log('✅ Backend already running', 'green')
  }
  
  if (!frontendRunning) {
    frontendProcess = startService('Frontend', CONFIG.frontend.dir, CONFIG.frontend.startCommand)
    
    if (!(await waitForService('Frontend', CONFIG.frontend.url))) {
      process.exit(1)
    }
  } else {
    log('✅ Frontend already running', 'green')
  }
  
  // Run tests
  const testsPassed = runTests(spec, options)
  
  // Cleanup
  if (frontendProcess) {
    log('🛑 Stopping frontend...', 'yellow')
    frontendProcess.kill('SIGTERM')
  }
  
  if (backendProcess) {
    log('🛑 Stopping backend...', 'yellow')
    backendProcess.kill('SIGTERM')
  }
  
  // Exit with appropriate code
  process.exit(testsPassed ? 0 : 1)
}

// Handle process termination
process.on('SIGINT', () => {
  log('\\n🛑 Test runner interrupted', 'yellow')
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled error: ${error.message}`, 'red')
  process.exit(1)
})

// Run the main function
if (require.main === module) {
  main().catch(error => {
    log(`❌ Script failed: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { main, runTests, startService, waitForService }