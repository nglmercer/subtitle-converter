/**
 * Universal JSON Format Examples
 *
 * This file demonstrates the power of the Universal JSON intermediate format
 * for subtitle conversions, manipulation, and metadata preservation.
 */

import {
  convert,
  parseToUniversal,
  formatFromUniversal,
  analyze,
  timeStringToMs,
  msToTimeString,
  getUniversalStats,
  universalToJson,
  jsonToUniversal,
  cloneUniversal,
  type UniversalSubtitle,
  type UniversalCue,
} from '../src/index.js';
import * as fs from 'fs';

// ============================================================================
// Example 1: Basic Conversion Using Universal Format (Automatic)
// ============================================================================

console.log('=== Example 1: Basic Conversion ===\n');

const srtContent = `1
00:00:01,000 --> 00:00:03,000
Hello, World!

2
00:00:04,000 --> 00:00:06,000
This is a subtitle example.

3
00:00:07,000 --> 00:00:09,000
Universal JSON makes conversions easy!`;

// Simple conversion - universal format is used internally
const vttContent = convert(srtContent, 'srt', 'vtt');
console.log('Converted to VTT:');
console.log(vttContent);
console.log('\n');

// ============================================================================
// Example 2: Working Directly with Universal Format
// ============================================================================

console.log('=== Example 2: Working with Universal Format ===\n');

// Parse SRT to Universal JSON
const universal = parseToUniversal(srtContent, 'srt');

// Inspect the universal format
console.log('Universal Format Structure:');
console.log('Version:', universal.version);
console.log('Source Format:', universal.sourceFormat);
console.log('Number of Cues:', universal.cues.length);
console.log('Metadata:', JSON.stringify(universal.metadata, null, 2));
console.log('\n');

// Inspect individual cues
console.log('First Cue Details:');
const firstCue = universal.cues[0]!;
console.log('  Index:', firstCue.index);
console.log('  Start Time (ms):', firstCue.startTime);
console.log('  End Time (ms):', firstCue.endTime);
console.log('  Duration (ms):', firstCue.duration);
console.log('  Text:', firstCue.text);
console.log('\n');

// ============================================================================
// Example 3: Manipulating Subtitles Programmatically
// ============================================================================

console.log('=== Example 3: Time Shift (Delay by 2 seconds) ===\n');

// Clone the universal object to avoid modifying the original
const delayedUniversal = cloneUniversal(universal);

// Shift all subtitles by 2 seconds (2000 milliseconds)
delayedUniversal.cues.forEach(cue => {
  cue.startTime += 2000;
  cue.endTime += 2000;
});

// Convert back to SRT
const delayedSrt = formatFromUniversal(delayedUniversal, 'srt');
console.log('Delayed SRT (shifted by 2 seconds):');
console.log(delayedSrt);
console.log('\n');

// ============================================================================
// Example 4: Filtering and Modifying Cues
// ============================================================================

console.log('=== Example 4: Filter and Modify Cues ===\n');

const modifiedUniversal = cloneUniversal(universal);

// Remove short subtitles (less than 1.5 seconds)
modifiedUniversal.cues = modifiedUniversal.cues.filter(cue => {
  return cue.duration >= 1500; // 1.5 seconds in milliseconds
});

// Convert all text to uppercase
modifiedUniversal.cues.forEach(cue => {
  cue.text = cue.text.toUpperCase();
  cue.content = cue.content.toUpperCase();
});

console.log('Modified Subtitles (filtered & uppercase):');
console.log(formatFromUniversal(modifiedUniversal, 'srt'));
console.log('\n');

// ============================================================================
// Example 5: Adding Metadata
// ============================================================================

console.log('=== Example 5: Adding Metadata ===\n');

const universalWithMeta = cloneUniversal(universal);

// Add metadata
universalWithMeta.metadata.title = 'Example Movie - English Subtitles';
universalWithMeta.metadata.language = 'en';
universalWithMeta.metadata.author = 'Subtitle Team';
universalWithMeta.metadata.description = 'Official English subtitles for Example Movie';

// Export as JSON with metadata
const jsonWithMeta = universalToJson(universalWithMeta, true);
console.log('Universal JSON with Metadata:');
console.log(jsonWithMeta.substring(0, 500) + '...\n');

// ============================================================================
// Example 6: Statistics and Analysis
// ============================================================================

console.log('=== Example 6: Statistics ===\n');

const stats = getUniversalStats(universal);
console.log('Subtitle Statistics:');
console.log('  Total Cues:', stats.totalCues);
console.log('  Total Duration:', stats.totalDuration, 'ms');
console.log('  Average Duration:', stats.averageDuration.toFixed(2), 'ms');
console.log('  Total Characters:', stats.totalCharacters);
console.log('  Average Characters per Cue:', stats.averageCharactersPerCue.toFixed(2));
console.log('  First Cue Start:', msToTimeString(stats.firstCueStart));
console.log('  Last Cue End:', msToTimeString(stats.lastCueEnd));
console.log('\n');

// ============================================================================
// Example 7: Converting Between Multiple Formats
// ============================================================================

console.log('=== Example 7: Multi-Format Conversion ===\n');

// Parse once to universal
const universalOnce = parseToUniversal(srtContent, 'srt');

// Convert to all formats from the same universal object
const outputFormats = {
  srt: formatFromUniversal(universalOnce, 'srt'),
  vtt: formatFromUniversal(universalOnce, 'vtt'),
  ass: formatFromUniversal(universalOnce, 'ass'),
  json: formatFromUniversal(universalOnce, 'json'),
};

console.log('Converted to multiple formats from single parse:');
console.log('  SRT length:', outputFormats.srt.length, 'bytes');
console.log('  VTT length:', outputFormats.vtt.length, 'bytes');
console.log('  ASS length:', outputFormats.ass.length, 'bytes');
console.log('  JSON length:', outputFormats.json.length, 'bytes');
console.log('\n');

// ============================================================================
// Example 8: Creating Subtitles Programmatically
// ============================================================================

console.log('=== Example 8: Creating Subtitles from Scratch ===\n');

// Create a new universal subtitle object from scratch
const customUniversal: UniversalSubtitle = {
  version: '1.0.0',
  sourceFormat: 'json',
  metadata: {
    title: 'Programmatically Created Subtitles',
    language: 'en',
    author: 'AI Generator',
  },
  styles: [],
  cues: [
    {
      index: 1,
      startTime: 0,
      endTime: 2000,
      duration: 2000,
      text: 'Welcome to the video!',
      content: 'Welcome to the video!',
    },
    {
      index: 2,
      startTime: 3000,
      endTime: 5500,
      duration: 2500,
      text: 'This subtitle was created programmatically.',
      content: 'This subtitle was created programmatically.',
    },
    {
      index: 3,
      startTime: 6000,
      endTime: 8000,
      duration: 2000,
      text: 'Using the Universal JSON format!',
      content: 'Using the Universal JSON format!',
    },
  ],
};

console.log('Created Custom Subtitles:');
console.log(formatFromUniversal(customUniversal, 'srt'));
console.log('\n');

// ============================================================================
// Example 9: Round-Trip Conversion (Lossless)
// ============================================================================

console.log('=== Example 9: Round-Trip Conversion ===\n');

// Original -> Universal -> Format -> Universal -> Original
const original = srtContent;
const step1 = parseToUniversal(original, 'srt');
const step2 = formatFromUniversal(step1, 'vtt');
const step3 = parseToUniversal(step2, 'vtt');
const step4 = formatFromUniversal(step3, 'srt');

console.log('Original SRT and Round-Trip SRT match:', original.trim() === step4.trim());
console.log('\n');

// ============================================================================
// Example 10: Time Calculations
// ============================================================================

console.log('=== Example 10: Time Calculations ===\n');

const timeExamples = [
  '00:00:01,500',
  '00:01:30,250',
  '01:23:45,678',
];

console.log('Time String to Milliseconds:');
timeExamples.forEach(time => {
  const ms = timeStringToMs(time);
  console.log(`  ${time} = ${ms} ms`);
});
console.log('\n');

console.log('Milliseconds to Time String:');
const msExamples = [1500, 90250, 5025678];
msExamples.forEach(ms => {
  const srtTime = msToTimeString(ms, 'srt');
  const vttTime = msToTimeString(ms, 'vtt');
  console.log(`  ${ms} ms = ${srtTime} (SRT) / ${vttTime} (VTT)`);
});
console.log('\n');

// ============================================================================
// Example 11: Merging Multiple Subtitle Files
// ============================================================================

console.log('=== Example 11: Merging Subtitle Files ===\n');

const srt1 = `1
00:00:01,000 --> 00:00:03,000
First subtitle file`;

const srt2 = `1
00:00:05,000 --> 00:00:07,000
Second subtitle file`;

// Parse both files
const universal1 = parseToUniversal(srt1, 'srt');
const universal2 = parseToUniversal(srt2, 'srt');

// Merge cues
const mergedUniversal = cloneUniversal(universal1);
mergedUniversal.cues = [
  ...universal1.cues,
  ...universal2.cues,
].sort((a, b) => a.startTime - b.startTime); // Sort by time

// Re-index cues
mergedUniversal.cues.forEach((cue, index) => {
  cue.index = index + 1;
});

console.log('Merged Subtitles:');
console.log(formatFromUniversal(mergedUniversal, 'srt'));
console.log('\n');

// ============================================================================
// Example 12: Detecting Gaps and Overlaps
// ============================================================================

console.log('=== Example 12: Detecting Gaps and Overlaps ===\n');

function detectGapsAndOverlaps(universal: UniversalSubtitle) {
  const gaps: Array<{ after: number; duration: number }> = [];
  const overlaps: Array<{ cue1: number; cue2: number; duration: number }> = [];

  for (let i = 0; i < universal.cues.length - 1; i++) {
    const current = universal.cues[i]!;
    const next = universal.cues[i + 1]!;

    const gap = next.startTime - current.endTime;

    if (gap < 0) {
      // Overlap
      overlaps.push({
        cue1: current.index,
        cue2: next.index,
        duration: Math.abs(gap),
      });
    } else if (gap > 3000) {
      // Gap larger than 3 seconds
      gaps.push({
        after: current.index,
        duration: gap,
      });
    }
  }

  return { gaps, overlaps };
}

const { gaps, overlaps } = detectGapsAndOverlaps(universal);
console.log('Analysis Results:');
console.log('  Large Gaps (>3s):', gaps.length);
gaps.forEach(gap => {
  console.log(`    After cue ${gap.after}: ${gap.duration}ms gap`);
});
console.log('  Overlaps:', overlaps.length);
overlaps.forEach(overlap => {
  console.log(`    Cues ${overlap.cue1} and ${overlap.cue2}: ${overlap.duration}ms overlap`);
});
console.log('\n');

// ============================================================================
// Example 13: Exporting Universal JSON to File
// ============================================================================

console.log('=== Example 13: Exporting to File ===\n');

try {
  // Export as universal JSON
  const jsonOutput = universalToJson(universal, true);
  fs.writeFileSync('output-universal.json', jsonOutput);
  console.log('✓ Exported universal JSON to: output-universal.json');

  // Export to all formats
  fs.writeFileSync('output.srt', formatFromUniversal(universal, 'srt'));
  console.log('✓ Exported SRT to: output.srt');

  fs.writeFileSync('output.vtt', formatFromUniversal(universal, 'vtt'));
  console.log('✓ Exported VTT to: output.vtt');

  fs.writeFileSync('output.ass', formatFromUniversal(universal, 'ass'));
  console.log('✓ Exported ASS to: output.ass');

  console.log('\nAll files exported successfully!');
} catch (error) {
  console.error('Error exporting files:', error);
}

console.log('\n=== Examples Complete ===');
