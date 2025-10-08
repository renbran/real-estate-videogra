#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🔍 Validating production build...\n')

const checks = [
  {
    name: 'Build directory exists',
    check: () => existsSync(join(projectRoot, 'dist')),
    fix: 'Run: npm run build'
  },
  {
    name: 'Index.html exists',
    check: () => existsSync(join(projectRoot, 'dist/index.html')),
    fix: 'Build may have failed, check build logs'
  },
  {
    name: 'Assets directory exists',
    check: () => existsSync(join(projectRoot, 'dist/assets')),
    fix: 'Build may have failed, check asset generation'
  },
  {
    name: 'Package.json has correct name',
    check: () => {
      const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'))
      return pkg.name === 'osus-videography-booking'
    },
    fix: 'Update package.json name field'
  },
  {
    name: 'Package-lock.json exists',
    check: () => existsSync(join(projectRoot, 'package-lock.json')),
    fix: 'Run: npm install to generate package-lock.json'
  },
  {
    name: 'Environment example exists',
    check: () => existsSync(join(projectRoot, '.env.example')),
    fix: 'Missing .env.example file'
  },
  {
    name: 'Deployment config exists',
    check: () => existsSync(join(projectRoot, 'netlify.toml')) || existsSync(join(projectRoot, 'vercel.json')),
    fix: 'Missing deployment configuration'
  }
]

let passed = 0
let failed = 0

checks.forEach((check, index) => {
  const result = check.check()
  const status = result ? '✅' : '❌'
  const number = (index + 1).toString().padStart(2, ' ')
  
  console.log(`${number}. ${status} ${check.name}`)
  
  if (result) {
    passed++
  } else {
    failed++
    console.log(`    💡 Fix: ${check.fix}`)
  }
})

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('\n🎉 Build validation passed! Ready for deployment.')
  process.exit(0)
} else {
  console.log('\n⚠️  Build validation failed. Please fix the issues above.')
  process.exit(1)
}