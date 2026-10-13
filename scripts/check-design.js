const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run() {
  let failed = false;

  console.log('Checking for hardcoded colors or fonts in app/ and components/ ...');
  // Use grep to find hex colors or font-family in .tsx files
  try {
    const output = execSync('grep -rEni "(#[0-9a-f]{3,6}|font-family:)" app/ components/ --exclude="*.css" || true', { encoding: 'utf-8' });
    if (output.trim()) {
      console.log('Found hardcoded colors or fonts:');
      console.log(output);
      // Wait, StatusBadge uses hardcoded colors mapped to tokens. The prompt says "no hard-coded colors or fonts in components", but my StatusBadge has bg-[#F3F4F6]. 
      // I should modify StatusBadge to use Tailwind utility classes if possible, but the prompt says: "Implement these as CSS variables in app/globals.css, expose them in the Tailwind theme, and write them into DESIGN_TOKENS.md. Never hard-code colors, fonts, or radii in components." 
      // I will fix StatusBadge.tsx first!
      failed = true;
    }
  } catch (e) {}

  console.log('Checking DESIGN_TOKENS.md for variables ...');
  const tokensContent = fs.readFileSync('DESIGN_TOKENS.md', 'utf-8');
  const cssContent = fs.readFileSync('app/globals.css', 'utf-8');

  // Extract variables from globals.css
  const cssVars = cssContent.match(/--[\w-]+:/g)?.map(v => v.slice(0, -1)) || [];
  const requiredVars = cssVars.filter(v => !v.startsWith('--color-') && !v.startsWith('--font-'));

  for (const v of requiredVars) {
    if (!tokensContent.includes(v)) {
      console.error(`Token ${v} missing from DESIGN_TOKENS.md`);
      failed = true;
    }
  }

  if (failed) {
    console.error('check:design failed');
    process.exit(1);
  } else {
    console.log('check:design passed');
  }
}

run();
