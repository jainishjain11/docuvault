/**
 * DocuVault - Lambda Packaging Script
 * Packages each of the 8 Lambda functions into standalone zip archives
 * inside backend/dist/ ready for upload to S3 or AWS Lambda.
 * Bundles shared modules and production node_modules dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LAMBDAS = [
  'createUploadUrl',
  'processDocument',
  'listDocuments',
  'getDocument',
  'deleteDocument',
  'searchDocuments',
  'adminStats',
  'sendExpiryNotifications',
];

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SHARED = path.join(ROOT, 'shared');
const NODE_MODULES = path.join(ROOT, 'node_modules');

// Production packages required by Lambdas and shared utilities
const PROD_PACKAGES = [
  '@aws-sdk',
  '@smithy',
  '@aws',
  'tslib',
  'bowser',
  'mnemonist',
  'obliterator',
];

// Ensure dist directory exists
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

console.log('Preparing production dependencies for packaging...');
const stagingNodeModules = path.join(DIST, '.staging_node_modules');
if (fs.existsSync(stagingNodeModules)) {
  fs.rmSync(stagingNodeModules, { recursive: true, force: true });
}
fs.mkdirSync(stagingNodeModules, { recursive: true });

for (const pkg of PROD_PACKAGES) {
  const srcPkg = path.join(NODE_MODULES, pkg);
  const destPkg = path.join(stagingNodeModules, pkg);
  if (fs.existsSync(srcPkg)) {
    fs.cpSync(srcPkg, destPkg, { recursive: true });
  } else {
    console.warn(`[warn] Package ${pkg} not found in node_modules`);
  }
}

console.log('Packaging DocuVault Lambda functions with dependencies...');

for (const name of LAMBDAS) {
  const funcDist = path.join(DIST, name);
  const funcShared = path.join(funcDist, 'shared');
  const funcNodeModules = path.join(funcDist, 'node_modules');
  const zipFile = path.join(DIST, `${name}.zip`);

  // Clean staging folder & old zip
  if (fs.existsSync(funcDist)) fs.rmSync(funcDist, { recursive: true, force: true });
  if (fs.existsSync(zipFile)) fs.rmSync(zipFile, { force: true });

  fs.mkdirSync(funcDist, { recursive: true });
  fs.mkdirSync(funcShared, { recursive: true });

  // Copy lambda index.js
  const srcIndex = path.join(ROOT, 'lambda', name, 'index.js');
  fs.copyFileSync(srcIndex, path.join(funcDist, 'index.js'));

  // Copy shared files
  for (const file of fs.readdirSync(SHARED)) {
    fs.copyFileSync(path.join(SHARED, file), path.join(funcShared, file));
  }

  // Copy staged production dependencies
  fs.cpSync(stagingNodeModules, funcNodeModules, { recursive: true });

  // Copy package.json metadata (omit devDependencies for clean metadata)
  const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const lambdaPkg = {
    name: `docuvault-${name.toLowerCase()}`,
    version: pkgJson.version,
    main: 'index.js',
    dependencies: pkgJson.dependencies,
  };
  fs.writeFileSync(path.join(funcDist, 'package.json'), JSON.stringify(lambdaPkg, null, 2));

  // Create zip using tar (fast native on Windows 10/11) with fallback to PowerShell Compress-Archive
  const entries = fs.readdirSync(funcDist);
  let packaged = false;
  try {
    const tarCmd = `tar -a -c -f "${zipFile}" -C "${funcDist}" ${entries.join(' ')}`;
    execSync(tarCmd, { stdio: 'pipe' });
    packaged = true;
  } catch {
    const psCmd = `powershell -Command "Compress-Archive -Path '${funcDist}\\*' -DestinationPath '${zipFile}' -Force"`;
    execSync(psCmd, { stdio: 'inherit' });
    packaged = true;
  }

  // Clean up staging directory for this function to save disk space
  fs.rmSync(funcDist, { recursive: true, force: true });

  const stat = fs.statSync(zipFile);
  console.log(`✓ Packaged ${name}.zip (${Math.round(stat.size / 1024)} KB)`);
}

// Clean staging directory
if (fs.existsSync(stagingNodeModules)) {
  fs.rmSync(stagingNodeModules, { recursive: true, force: true });
}

console.log('\nAll 8 Lambda functions successfully packaged in backend/dist/');
