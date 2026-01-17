#!/usr/bin/env node
/**
 * Logo Generator for Claude Tools Viewer
 *
 * Generates SVG logos and brand assets programmatically.
 * Run with: node scripts/generate-logo.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Claude-adjacent color palette + POP color
const colors = {
  // Primary - warm terracotta/coral (Claude's signature color)
  primary: '#E07A5F',
  primaryDark: '#C4563A',
  primaryLight: '#F2A990',

  // Neutrals
  cream: '#FAF8F5',
  warmGray: '#8B8680',
  charcoal: '#2D2926',

  // Accents
  sand: '#E8DED1',
  rust: '#BD4F2E',

  // POP - electric accent that doesn't belong but WORKS
  pop: '#00E5FF',        // electric cyan
  popAlt: '#FF2D92',     // hot magenta
  popLime: '#BFFF00',    // acid lime
};

/**
 * Generate playful blob logo
 * Concept: Friendly overlapping blobs with a pop of electric color
 */
function generateBlobLogo(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.primaryLight};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Big friendly blob background -->
  <path d="M64 8 C95 8 115 28 118 55 C121 82 105 110 75 118 C45 126 15 105 10 70 C5 35 33 8 64 8Z"
        fill="url(#blobGrad)" />

  <!-- Overlapping cream blob -->
  <ellipse cx="55" cy="58" rx="28" ry="32"
           fill="${colors.cream}"
           transform="rotate(-12 55 58)" />

  <!-- POP accent blob - the unexpected electric hit -->
  <circle cx="85" cy="45" r="18" fill="${colors.pop}" />

  <!-- Little playful dot -->
  <circle cx="42" cy="85" r="8" fill="${colors.popAlt}" />
</svg>`;
}

/**
 * Stacked rounded pills - like building blocks
 */
function generateStackedLogo(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">

  <!-- Background squircle -->
  <rect x="4" y="4" width="120" height="120" rx="32" fill="${colors.primary}" />

  <!-- Stacked rounded pills - playful, offset -->
  <rect x="22" y="28" width="70" height="22" rx="11" fill="${colors.cream}" />
  <rect x="36" y="54" width="70" height="22" rx="11" fill="${colors.cream}" opacity="0.85" />
  <rect x="22" y="80" width="55" height="22" rx="11" fill="${colors.cream}" opacity="0.7" />

  <!-- POP dot that breaks the pattern -->
  <circle cx="98" cy="91" r="14" fill="${colors.pop}" />
</svg>`;
}

/**
 * Playful abstract tool - rounded wrench made of blobs
 */
function generateBlobWrench(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="wrenchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary}" />
      <stop offset="100%" style="stop-color:${colors.primaryDark}" />
    </linearGradient>
  </defs>

  <!-- Soft squircle background -->
  <rect x="4" y="4" width="120" height="120" rx="36" fill="url(#wrenchGrad)" />

  <!-- Blob wrench head - friendly rounded hexagon-ish -->
  <ellipse cx="64" cy="42" rx="26" ry="24" fill="${colors.cream}" />

  <!-- Chunky rounded handle -->
  <rect x="52" y="50" width="24" height="50" rx="12" fill="${colors.cream}" />

  <!-- Wrench jaw blobs -->
  <ellipse cx="48" cy="98" rx="14" ry="10" fill="${colors.cream}" />
  <ellipse cx="80" cy="98" rx="14" ry="10" fill="${colors.cream}" />

  <!-- THE POP - electric accent that makes it memorable -->
  <circle cx="64" cy="42" r="10" fill="${colors.pop}" />

  <!-- Tiny chaos dot -->
  <circle cx="95" cy="25" r="6" fill="${colors.popAlt}" />
</svg>`;
}

/**
 * Abstract playful - dancing shapes
 */
function generateDancingShapes(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">

  <!-- Warm background -->
  <rect x="4" y="4" width="120" height="120" rx="28" fill="${colors.primary}" />

  <!-- Dancing rounded shapes - offset and playful -->
  <rect x="20" y="35" width="40" height="55" rx="20" fill="${colors.cream}" transform="rotate(-8 40 62)" />
  <rect x="55" y="25" width="35" height="65" rx="17" fill="${colors.cream}" opacity="0.9" transform="rotate(6 72 57)" />
  <ellipse cx="90" cy="85" rx="22" ry="18" fill="${colors.cream}" opacity="0.75" />

  <!-- POP elements -->
  <circle cx="35" cy="28" r="12" fill="${colors.pop}" />
  <circle cx="100" cy="38" r="7" fill="${colors.popAlt}" />
</svg>`;
}

/**
 * Friendly face/character hint
 */
function generateFriendlyMark(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">

  <!-- Soft blob background -->
  <path d="M64 6 C100 6 122 30 122 64 C122 98 100 122 64 122 C28 122 6 98 6 64 C6 30 28 6 64 6Z"
        fill="${colors.primary}" />

  <!-- Main blob body -->
  <ellipse cx="64" cy="68" rx="42" ry="38" fill="${colors.cream}" />

  <!-- Eyes - friendly, slightly offset for character -->
  <ellipse cx="50" cy="62" rx="8" ry="10" fill="${colors.charcoal}" />
  <ellipse cx="78" cy="60" rx="8" ry="10" fill="${colors.charcoal}" />

  <!-- Eye highlights -->
  <circle cx="52" cy="59" r="3" fill="white" />
  <circle cx="80" cy="57" r="3" fill="white" />

  <!-- Happy subtle smile curve -->
  <path d="M48 78 Q64 88 80 78" stroke="${colors.charcoal}" stroke-width="3" stroke-linecap="round" fill="none" />

  <!-- POP accessory - like a little antenna or sparkle -->
  <circle cx="92" cy="32" r="10" fill="${colors.pop}" />
  <circle cx="28" cy="40" r="6" fill="${colors.popAlt}" />
</svg>`;
}

/**
 * PEAK logo - mountain with playful rounded style
 */
function generatePeakLogo(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="peakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary}" />
      <stop offset="100%" style="stop-color:${colors.primaryDark}" />
    </linearGradient>
  </defs>

  <!-- Soft squircle background -->
  <rect x="4" y="4" width="120" height="120" rx="32" fill="url(#peakGrad)" />

  <!-- Main mountain peak - rounded, friendly -->
  <path d="M64 24
           Q72 24 80 45
           L100 95
           Q102 102 95 102
           L33 102
           Q26 102 28 95
           L48 45
           Q56 24 64 24Z"
        fill="${colors.cream}" />

  <!-- Snow cap - rounded blob at top -->
  <ellipse cx="64" cy="38" rx="14" ry="10" fill="white" />

  <!-- Second smaller peak behind - adds depth -->
  <path d="M90 55
           Q95 55 100 70
           L110 95
           Q112 102 105 102
           L85 102
           Q80 102 82 95
           L85 70
           Q88 55 90 55Z"
        fill="${colors.cream}" opacity="0.5" />

  <!-- POP accent - sun or floating element -->
  <circle cx="98" cy="32" r="12" fill="${colors.pop}" />

  <!-- Little accent blob -->
  <circle cx="28" cy="85" r="8" fill="${colors.popAlt}" />
</svg>`;
}

/**
 * PEAK logo v2 - more abstract/geometric but still soft
 */
function generatePeakLogoAlt(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="peakGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.primaryDark}" />
      <stop offset="100%" style="stop-color:${colors.primary}" />
    </linearGradient>
  </defs>

  <!-- Soft squircle background -->
  <rect x="4" y="4" width="120" height="120" rx="32" fill="url(#peakGrad2)" />

  <!-- Layered mountains - back to front -->
  <!-- Far mountain -->
  <path d="M20 100 Q50 50 80 100 Z" fill="${colors.cream}" opacity="0.4" />

  <!-- Middle mountain -->
  <path d="M35 100 Q65 35 95 100 Z" fill="${colors.cream}" opacity="0.7" />

  <!-- Front mountain - main peak -->
  <path d="M15 100 Q55 25 95 100 Q55 95 15 100Z" fill="${colors.cream}" />

  <!-- Rounded snow cap -->
  <ellipse cx="55" cy="45" rx="12" ry="8" fill="white" />

  <!-- POP sun -->
  <circle cx="100" cy="28" r="14" fill="${colors.pop}" />

  <!-- Accent -->
  <circle cx="22" cy="35" r="7" fill="${colors.popAlt}" />
</svg>`;
}

/**
 * PEAK logo v3 - single bold peak, very minimal
 */
function generatePeakLogoMinimal(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">

  <!-- Soft squircle background -->
  <rect x="4" y="4" width="120" height="120" rx="32" fill="${colors.primary}" />

  <!-- Single bold mountain - chunky rounded triangle -->
  <path d="M64 22
           C68 22 72 30 85 60
           Q100 95 95 100
           L33 100
           Q28 95 43 60
           C56 30 60 22 64 22Z"
        fill="${colors.cream}" />

  <!-- Snow cap blob -->
  <ellipse cx="64" cy="40" rx="16" ry="12" fill="white" />

  <!-- POP element top right -->
  <circle cx="100" cy="28" r="12" fill="${colors.pop}" />

  <!-- Small chaos dot -->
  <circle cx="26" cy="95" r="9" fill="${colors.popAlt}" />
</svg>`;
}

/**
 * PEAK logo v4 - cute stylized peak with face hint
 */
function generatePeakLogoFriendly(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">

  <!-- Soft squircle background -->
  <rect x="4" y="4" width="120" height="120" rx="32" fill="${colors.primary}" />

  <!-- Chunky mountain body -->
  <path d="M64 20
           C75 20 90 55 98 85
           Q102 102 90 102
           L38 102
           Q26 102 30 85
           C38 55 53 20 64 20Z"
        fill="${colors.cream}" />

  <!-- Snow cap as a little hat -->
  <ellipse cx="64" cy="32" rx="18" ry="11" fill="white" />
  <ellipse cx="64" cy="28" rx="10" ry="6" fill="${colors.pop}" />

  <!-- Cute dot eyes -->
  <circle cx="52" cy="58" r="5" fill="${colors.charcoal}" />
  <circle cx="76" cy="58" r="5" fill="${colors.charcoal}" />

  <!-- Eye sparkles -->
  <circle cx="54" cy="56" r="2" fill="white" />
  <circle cx="78" cy="56" r="2" fill="white" />

  <!-- Little smile -->
  <path d="M56 72 Q64 80 72 72" stroke="${colors.charcoal}" stroke-width="3" stroke-linecap="round" fill="none" />

  <!-- Accent blob -->
  <circle cx="100" cy="90" r="10" fill="${colors.popAlt}" />
</svg>`;
}

/**
 * Alternative: More abstract/geometric logo
 * Layered shapes suggesting depth and tools
 */
function generateGeometricLogo(size = 128) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.rust};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Rounded square background -->
  <rect x="8" y="8" width="112" height="112" rx="24" fill="url(#grad1)" />

  <!-- Abstract tool shapes - three overlapping rounded rectangles -->
  <!-- Suggests configurability, components, building blocks -->
  <g transform="translate(64, 64)">
    <!-- Back layer -->
    <rect x="-32" y="-20" width="28" height="52" rx="6"
          fill="${colors.cream}" opacity="0.7"
          transform="rotate(-15)"/>

    <!-- Middle layer -->
    <rect x="-8" y="-24" width="28" height="52" rx="6"
          fill="${colors.cream}" opacity="0.85"
          transform="rotate(0)"/>

    <!-- Front layer -->
    <rect x="8" y="-20" width="28" height="52" rx="6"
          fill="${colors.cream}"
          transform="rotate(15)"/>
  </g>
</svg>`;
}

/**
 * Minimal icon variant - for small sizes like favicon
 */
function generateMinimalIcon(size = 32) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="${colors.primary}" />
  <path d="M16 7 L22 10.5 L22 17.5 L16 21 L10 17.5 L10 10.5 Z"
        fill="${colors.cream}" />
  <rect x="13" y="19" width="6" height="6" rx="1" fill="${colors.cream}" />
</svg>`;
}

/**
 * Text logo with icon
 */
function generateTextLogo(variant = 'full') {
  const width = variant === 'full' ? 320 : 200;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="48" viewBox="0 0 ${width} 48" fill="none">
  <!-- Icon -->
  <rect x="4" y="4" width="40" height="40" rx="10" fill="${colors.primary}" />
  <path d="M24 12 L32 16.5 L32 25.5 L24 30 L16 25.5 L16 16.5 Z"
        fill="${colors.cream}" />
  <rect x="20" y="28" width="8" height="8" rx="1.5" fill="${colors.cream}" />

  <!-- Text -->
  <text x="56" y="22"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="18"
        font-weight="600"
        fill="${colors.charcoal}">Claude Tools</text>
  ${variant === 'full' ? `
  <text x="56" y="38"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="12"
        font-weight="400"
        fill="${colors.warmGray}">Viewer & Editor</text>` : ''}
</svg>`;
}

/**
 * README header banner with custom name
 */
function generateReadmeBannerWithName(productName, tagline, width = 1280, height = 320) {
  // Adjust font size based on name length
  const fontSize = productName.length <= 5 ? 96 : productName.length <= 8 ? 80 : 64;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.primaryDark};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Warm gradient background -->
  <rect width="${width}" height="${height}" fill="url(#bannerGrad)" />

  <!-- Playful floating blobs -->
  <circle cx="1150" cy="80" r="120" fill="${colors.primaryLight}" opacity="0.3" />
  <circle cx="1050" cy="260" r="80" fill="${colors.cream}" opacity="0.15" />
  <circle cx="50" cy="280" r="60" fill="${colors.cream}" opacity="0.1" />

  <!-- POP accent blobs -->
  <circle cx="1200" cy="180" r="40" fill="${colors.pop}" opacity="0.8" />
  <circle cx="80" cy="60" r="25" fill="${colors.popAlt}" opacity="0.7" />
  <circle cx="1100" cy="40" r="15" fill="${colors.popAlt}" />

  <!-- Logo mark - blob style -->
  <g transform="translate(100, 85)">
    <rect x="0" y="0" width="150" height="150" rx="45" fill="${colors.cream}" opacity="0.95" />
    <ellipse cx="65" cy="65" rx="35" ry="40" fill="${colors.primary}" transform="rotate(-8 65 65)" />
    <circle cx="105" cy="45" r="22" fill="${colors.pop}" />
    <circle cx="45" cy="110" r="12" fill="${colors.popAlt}" />
  </g>

  <!-- Product name - BIG and bold -->
  <text x="290" y="170"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="${fontSize}"
        font-weight="900"
        fill="${colors.cream}">${productName}</text>

  <!-- Tagline -->
  <text x="290" y="220"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="26"
        font-weight="500"
        fill="${colors.cream}"
        opacity="0.85">${tagline}</text>
</svg>`;
}

// Output directory
const outputDir = path.join(__dirname, '..', 'brand-assets');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Name options to try
const nameOptions = [
  { name: 'Peek', tagline: 'See the full context' },
  { name: 'Peek', tagline: 'Your tools in context' },
  { name: 'Peek', tagline: 'Context, visualized' },
  { name: 'Peek', tagline: 'Peek into the context' },
];

/**
 * Clean mountain - not playful, just a proper mountain range
 */
function generateCleanMountain(size = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary}" />
      <stop offset="100%" style="stop-color:${colors.primaryDark}" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#bgGrad)" />

  <!-- Back mountain - lower left -->
  <path d="M8 100 L35 55 L62 100 Z" fill="${colors.cream}" opacity="0.5" />

  <!-- Back mountain - lower right -->
  <path d="M70 100 L95 60 L120 100 Z" fill="${colors.cream}" opacity="0.5" />

  <!-- Main peak - tallest, center -->
  <path d="M25 100 L64 28 L103 100 Z" fill="${colors.cream}" />

  <!-- Snow cap on main peak -->
  <path d="M52 52 L64 28 L76 52 Z" fill="white" />

  <!-- POP accent -->
  <circle cx="100" cy="28" r="10" fill="${colors.pop}" />
</svg>`;
}

/**
 * Two peaks - one dominant
 */
function generateTwoPeaks(size = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary}" />
      <stop offset="100%" style="stop-color:${colors.primaryDark}" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#bgGrad2)" />

  <!-- Secondary peak - shorter, right -->
  <path d="M60 100 L88 50 L116 100 Z" fill="${colors.cream}" opacity="0.6" />

  <!-- Main peak - taller, left-center -->
  <path d="M12 100 L52 25 L92 100 Z" fill="${colors.cream}" />

  <!-- Snow cap -->
  <path d="M40 50 L52 25 L64 50 Z" fill="white" />

  <!-- POP -->
  <circle cx="105" cy="30" r="9" fill="${colors.pop}" />
</svg>`;
}

/**
 * Three peaks - classic mountain range, middle tallest
 */
function generateThreePeaks(size = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary}" />
      <stop offset="100%" style="stop-color:${colors.primaryDark}" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#bgGrad3)" />

  <!-- Left peak - medium -->
  <path d="M5 100 L28 48 L51 100 Z" fill="${colors.cream}" opacity="0.55" />

  <!-- Right peak - medium -->
  <path d="M77 100 L100 52 L123 100 Z" fill="${colors.cream}" opacity="0.55" />

  <!-- Center peak - tallest -->
  <path d="M30 100 L64 22 L98 100 Z" fill="${colors.cream}" />

  <!-- Snow cap center -->
  <path d="M51 50 L64 22 L77 50 Z" fill="white" />

  <!-- POP sun -->
  <circle cx="108" cy="28" r="10" fill="${colors.pop}" />
</svg>`;
}

/**
 * Sharp minimal - very clean
 */
function generateSharpMinimal(size = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">

  <!-- Background -->
  <rect x="4" y="4" width="120" height="120" rx="28" fill="${colors.primary}" />

  <!-- Single clean mountain with shoulder -->
  <path d="M15 100 L45 55 L64 24 L83 55 L113 100 Z" fill="${colors.cream}" />

  <!-- Snow cap -->
  <path d="M54 42 L64 24 L74 42 Z" fill="white" />

  <!-- POP -->
  <circle cx="102" cy="30" r="9" fill="${colors.pop}" />
</svg>`;
}

// Generate all assets - CLEAN MOUNTAIN variants
const assets = [
  { name: 'mountain-clean-256.svg', content: generateCleanMountain(256) },
  { name: 'mountain-two-peaks-256.svg', content: generateTwoPeaks(256) },
  { name: 'mountain-three-peaks-256.svg', content: generateThreePeaks(256) },
  { name: 'mountain-sharp-256.svg', content: generateSharpMinimal(256) },

  // Banners
  ...nameOptions.map((opt, i) => ({
    name: `banner-peek-${i + 1}.svg`,
    content: generateReadmeBannerWithName(opt.name, opt.tagline)
  })),
];

console.log('🎨 Generating Claude Tools Viewer brand assets...\n');

assets.forEach(({ name, content }) => {
  const filepath = path.join(outputDir, name);
  fs.writeFileSync(filepath, content);
  console.log(`  ✓ ${name}`);
});

console.log(`\n✨ Generated ${assets.length} assets in ${outputDir}/`);
console.log('\nNext steps:');
console.log('  1. Review the SVGs in your browser or design tool');
console.log('  2. Pick your preferred variant');
console.log('  3. Run the PNG export script to generate app icons');
