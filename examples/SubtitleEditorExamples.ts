/**
 * SubtitleEditor Examples
 *
 * Comprehensive examples showing how to use SubtitleEditor for:
 * - Safe subtitle editing
 * - Fragment-based operations (AI-friendly)
 * - MCP (Model Context Protocol) integration
 * - Validation and quality control
 * - Batch operations
 */

import { SubtitleEditor } from '../src/SubtitleEditor.js';
import * as fs from 'fs';

// ============================================================================
// Example 1: Basic Usage - Load and Edit Subtitles
// ============================================================================

console.log('=== Example 1: Basic Usage ===\n');

const srtContent = `1
00:00:01,000 --> 00:00:03,000
Hello, world!

2
00:00:04,000 --> 00:00:06,000
This is a subtitle example.

3
00:00:07,000 --> 00:00:09,000
Let's edit some subtitles!`;

// Create editor from SRT content
const editor = new SubtitleEditor(srtContent, 'srt');

// Get basic info
console.log('Source format:', editor.getSourceFormat());
console.log('Total cues:', editor.getCues().length);
console.log('Total duration:', editor.getTotalDuration(), 'ms');
console.log('Statistics:', editor.getStats());
console.log('\n');

// ============================================================================
// Example 2: Fragment-Based Editing (AI-Friendly)
// ============================================================================

console.log('=== Example 2: Fragment-Based Editing for AI ===\n');

// Get fragment context (useful for AI to understand surrounding context)
const fragment = editor.getFragmentContext(1);
console.log('Fragment context for cue 1:');
console.log('  Current text:', fragment?.cue.text);
console.log('  Previous text:', fragment?.previous?.text || 'N/A');
console.log('  Next text:', fragment?.next?.text || 'N/A');
console.log('  Time from start:', fragment?.timeFromStart, 'ms');
console.log('\n');

// Update a single fragment (safe operation)
const success = editor.updateFragmentText(1, 'This is an EDITED subtitle example.');
console.log('Update successful:', success);
console.log('Updated text:', editor.getCue(1)?.text);
console.log('\n');

// ============================================================================
// Example 3: AI Translation Use Case
// ============================================================================

console.log('=== Example 3: AI Translation Simulation ===\n');

// Simulate AI translating fragments one by one
function simulateAITranslation(editor: SubtitleEditor, targetLanguage: string) {
  console.log(`Translating to ${targetLanguage}...`);

  const cueCount = editor.getCues().length;

  for (let i = 0; i < cueCount; i++) {
    const context = editor.getFragmentContext(i);
    if (!context) continue;

    // Simulate AI translation (in real scenario, this would call an LLM)
    const translatedText = `[${targetLanguage}] ${context.cue.text}`;

    // Update fragment with validation
    editor.updateFragmentText(i, translatedText);

    console.log(`  Translated cue ${i + 1}: "${translatedText}"`);
  }

  console.log(`Translation complete!\n`);
}

simulateAITranslation(editor, 'ES');

// Undo translation
editor.undo();
console.log('Translation undone!\n');

// ============================================================================
// Example 4: Search and Replace
// ============================================================================

console.log('=== Example 4: Search and Replace ===\n');

// Load fresh content
const editor2 = new SubtitleEditor(srtContent, 'srt');

// Search for text
const matches = editor2.search('subtitle', { caseSensitive: false });
console.log('Found "subtitle" in cues:', matches);

// Replace text
const replacedCount = editor2.findAndReplace('subtitle', 'caption', {
  caseSensitive: false,
  includeContent: true,
});
console.log('Replaced', replacedCount, 'occurrences');
console.log('New text:', editor2.getCue(1)?.text);
console.log('\n');

// ============================================================================
// Example 5: Time Operations
// ============================================================================

console.log('=== Example 5: Time Operations ===\n');

const editor3 = new SubtitleEditor(srtContent, 'srt');

console.log('Original first cue timing:');
console.log('  Start:', editor3.getCue(0)?.startTime, 'ms');
console.log('  End:', editor3.getCue(0)?.endTime, 'ms');

// Shift all subtitles by 2 seconds
editor3.shiftTime(2000);
console.log('\nAfter shifting by 2 seconds:');
console.log('  Start:', editor3.getCue(0)?.startTime, 'ms');
console.log('  End:', editor3.getCue(0)?.endTime, 'ms');

// Undo shift
editor3.undo();

// Scale time (speed up by 1.5x)
editor3.scaleTime(1.5);
console.log('\nAfter scaling by 1.5x:');
console.log('  Start:', editor3.getCue(0)?.startTime, 'ms');
console.log('  End:', editor3.getCue(0)?.endTime, 'ms');
console.log('\n');

// ============================================================================
// Example 6: Validation
// ============================================================================

console.log('=== Example 6: Validation ===\n');

const editor4 = new SubtitleEditor(srtContent, 'srt');

// Validate all cues
const validation = editor4.validateAll({
  checkOverlaps: true,
  checkDurations: true,
  minDuration: 1000,
  maxDuration: 8000,
  checkTextLength: true,
  maxTextLength: 100,
});

console.log('Validation result:', validation.isValid);
console.log('Errors:', validation.errors.length);
console.log('Warnings:', validation.warnings.length);

if (validation.warnings.length > 0) {
  console.log('\nWarnings:');
  validation.warnings.forEach(w => console.log('  -', w.message));
}
console.log('\n');

// ============================================================================
// Example 7: Cue Operations (Add, Delete, Split, Merge)
// ============================================================================

console.log('=== Example 7: Cue Operations ===\n');

const editor5 = new SubtitleEditor(srtContent, 'srt');

console.log('Initial cue count:', editor5.getCues().length);

// Add a new cue
editor5.addCue({
  startTime: 10000,
  endTime: 12000,
  duration: 2000,
  text: 'This is a NEW cue!',
  content: 'This is a NEW cue!',
});
console.log('After adding: ', editor5.getCues().length, 'cues');

// Split a cue
editor5.splitCue(1, 5000); // Split at 5 seconds
console.log('After splitting:', editor5.getCues().length, 'cues');

// Merge cues
editor5.mergeCues(1, 2);
console.log('After merging:', editor5.getCues().length, 'cues');

// Delete a cue
editor5.deleteCue(3);
console.log('After deleting:', editor5.getCues().length, 'cues');

console.log('\n');

// ============================================================================
// Example 8: Event Listening
// ============================================================================

console.log('=== Example 8: Event Listening ===\n');

const editor6 = new SubtitleEditor(srtContent, 'srt');

// Subscribe to changes
const unsubscribe = editor6.onChange((event) => {
  console.log(`[EVENT] ${event.type} at ${new Date(event.timestamp).toISOString()}`);
  console.log('  Data:', JSON.stringify(event.data, null, 2));
});

// Make some changes
editor6.updateFragmentText(0, 'Modified text');
editor6.shiftTime(1000);

// Unsubscribe
unsubscribe();
console.log('Unsubscribed from events\n');

// ============================================================================
// Example 9: Batch Operations
// ============================================================================

console.log('=== Example 9: Batch Operations ===\n');

const editor7 = new SubtitleEditor(srtContent, 'srt');

// Execute multiple operations as a single transaction
editor7.batch(() => {
  // All these operations will be saved as one history entry
  editor7.updateFragmentText(0, 'Batch update 1');
  editor7.updateFragmentText(1, 'Batch update 2');
  editor7.shiftTime(500);
});

console.log('Batch operation completed');
console.log('Can undo:', editor7.canUndo());
editor7.undo(); // Undoes ALL batch operations at once
console.log('Batch operation undone\n');

// ============================================================================
// Example 10: MCP (Model Context Protocol) Integration Pattern
// ============================================================================

console.log('=== Example 10: MCP Integration Pattern ===\n');

/**
 * MCP Tool: Translate subtitle fragment
 */
async function mcpTranslateFragment(
  editor: SubtitleEditor,
  fragmentIndex: number,
  targetLanguage: string,
  aiTranslateFunction: (text: string, context: any) => Promise<string>
) {
  // Get rich context for AI
  const context = editor.getFragmentContext(fragmentIndex);
  if (!context) {
    return { success: false, error: 'Fragment not found' };
  }

  // Prepare context for AI
  const aiContext = {
    currentText: context.cue.text,
    previousText: context.previous?.text,
    nextText: context.next?.text,
    speaker: context.cue.formatSpecific?.ass?.actor,
    style: context.style?.name,
    timeFromStart: context.timeFromStart,
    duration: context.cue.duration,
  };

  // Call AI (simulated)
  const translated = await aiTranslateFunction(context.cue.text, aiContext);

  // Update fragment with validation
  const success = editor.updateFragmentText(fragmentIndex, translated);

  return {
    success,
    original: context.cue.text,
    translated,
    context: aiContext,
  };
}

/**
 * MCP Tool: Quality check subtitle
 */
function mcpQualityCheck(editor: SubtitleEditor, fragmentIndex: number) {
  const validation = editor.validateCue(fragmentIndex, {
    checkDurations: true,
    minDuration: 1000,
    maxDuration: 7000,
    checkTextLength: true,
    maxTextLength: 150,
  });

  const context = editor.getFragmentContext(fragmentIndex);

  return {
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    cue: {
      text: context?.cue.text,
      duration: context?.cue.duration,
      textLength: context?.cue.text.length || 0,
    },
  };
}

/**
 * MCP Tool: Search and get contexts
 */
function mcpSearchWithContext(
  editor: SubtitleEditor,
  query: string,
  options?: any
) {
  const indices = editor.search(query, options);

  return indices.map(index => {
    const context = editor.getFragmentContext(index);
    return {
      index,
      match: context?.cue.text,
      previous: context?.previous?.text,
      next: context?.next?.text,
      timePosition: context?.timeFromStart,
    };
  });
}

// Simulate MCP operations
console.log('MCP Tool: Quality Check on cue 1');
const qualityResult = mcpQualityCheck(editor, 1);
console.log('Quality check result:', qualityResult);
console.log('\n');

console.log('MCP Tool: Search with context');
const searchResults = mcpSearchWithContext(editor, 'subtitle');
console.log('Search results with context:', searchResults);
console.log('\n');

// ============================================================================
// Example 11: Multi-Format Workflow
// ============================================================================

console.log('=== Example 11: Multi-Format Workflow ===\n');

// Load ASS file with rich metadata
const assContent = `[Script Info]
Title: Example Movie
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,Alice,0,0,0,,Hello!
Dialogue: 0,0:00:04.00,0:00:06.00,Default,Bob,0,0,0,,Hi there!`;

const assEditor = new SubtitleEditor(assContent, 'ass');

console.log('Loaded ASS file');
console.log('Metadata:', assEditor.getMetadata());
console.log('Styles:', assEditor.getStyles().length);

// Edit while preserving metadata
assEditor.updateFragmentText(0, 'Hello, Bob!');

// Export to different formats
const exportedSRT = assEditor.export('srt');
const exportedVTT = assEditor.export('vtt');
const exportedASS = assEditor.export('ass'); // Preserves all metadata!

console.log('\nExported to SRT:', exportedSRT.slice(0, 100) + '...');
console.log('Exported to VTT:', exportedVTT.slice(0, 100) + '...');
console.log('Exported to ASS:', exportedASS.slice(0, 150) + '...');
console.log('\n');

// ============================================================================
// Example 12: Real-World AI Subtitle Translation Pipeline
// ============================================================================

console.log('=== Example 12: AI Translation Pipeline ===\n');

async function aiSubtitleTranslationPipeline(
  inputFile: string,
  outputFile: string,
  targetLanguage: string,
  aiTranslate: (text: string, context: any) => Promise<string>
) {
  // Step 1: Load subtitles
  console.log('Step 1: Loading subtitles...');
  const content = fs.readFileSync(inputFile, 'utf-8');
  const editor = new SubtitleEditor(content, 'auto');
  console.log(`Loaded ${editor.getCues().length} cues`);

  // Step 2: Validate before processing
  console.log('\nStep 2: Validating...');
  const validation = editor.validateAll();
  if (!validation.isValid) {
    console.log('Found errors:', validation.errors.length);
    console.log('Fixing overlaps...');
    editor.fixOverlaps(10); // 10ms gap
  }

  // Step 3: Translate fragments with context
  console.log('\nStep 3: Translating...');
  const totalCues = editor.getCues().length;

  for (let i = 0; i < totalCues; i++) {
    const context = editor.getFragmentContext(i);
    if (!context) continue;

    // Prepare rich context for AI
    const aiContext = {
      previous: context.previous?.text,
      next: context.next?.text,
      speaker: context.cue.formatSpecific?.ass?.actor,
      timestamp: context.cue.startTime,
    };

    // Translate with AI
    const translated = await aiTranslate(context.cue.text, aiContext);

    // Update fragment
    editor.updateFragmentText(i, translated);

    console.log(`  [${i + 1}/${totalCues}] Translated`);
  }

  // Step 4: Quality check after translation
  console.log('\nStep 4: Quality checking...');
  const finalValidation = editor.validateAll({
    checkTextLength: true,
    maxTextLength: 200,
    checkDurations: true,
    minDuration: 800,
  });

  console.log('Valid:', finalValidation.isValid);
  console.log('Warnings:', finalValidation.warnings.length);

  // Step 5: Export
  console.log('\nStep 5: Exporting...');
  const output = editor.export(editor.getSourceFormat());
  fs.writeFileSync(outputFile, output);
  console.log(`Saved to ${outputFile}`);

  return {
    totalCues,
    warnings: finalValidation.warnings.length,
    errors: finalValidation.errors.length,
  };
}

// Simulate the pipeline
console.log('Simulating AI translation pipeline:');
(async () => {
  try {
    // Mock AI translate function
    const mockAITranslate = async (text: string, context: any) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 10));
      return `[ES] ${text}`;
    };

    // Note: In real usage, you'd provide actual file paths
    // const result = await aiSubtitleTranslationPipeline(
    //   'input.srt',
    //   'output_es.srt',
    //   'Spanish',
    //   mockAITranslate
    // );

    console.log('Pipeline simulation complete!');
  } catch (error) {
    console.error('Pipeline error:', error);
  }
})();

console.log('\n');

// ============================================================================
// Example 13: Undo/Redo for Interactive Editing
// ============================================================================

console.log('=== Example 13: Undo/Redo ===\n');

const editor13 = new SubtitleEditor(srtContent, 'srt');

console.log('Initial text:', editor13.getCue(0)?.text);

// Make changes
editor13.updateFragmentText(0, 'First change');
console.log('After first change:', editor13.getCue(0)?.text);

editor13.updateFragmentText(0, 'Second change');
console.log('After second change:', editor13.getCue(0)?.text);

// Undo
editor13.undo();
console.log('After undo:', editor13.getCue(0)?.text);

editor13.undo();
console.log('After second undo:', editor13.getCue(0)?.text);

// Redo
editor13.redo();
console.log('After redo:', editor13.getCue(0)?.text);

console.log('\nCan undo:', editor13.canUndo());
console.log('Can redo:', editor13.canRedo());
console.log('\n');

// ============================================================================
// Example 14: Advanced Search with Filters
// ============================================================================

console.log('=== Example 14: Advanced Search ===\n');

const editor14 = new SubtitleEditor(assContent, 'ass');

// Search with time range filter
const resultsInRange = editor14.search('Hello', {
  timeRange: {
    start: 0,
    end: 5000, // First 5 seconds
  },
});
console.log('Results in first 5 seconds:', resultsInRange);

// Search with regex
const regexResults = editor14.search('H[aei]llo', {
  regex: true,
  caseSensitive: false,
});
console.log('Regex search results:', regexResults);

console.log('\n');

// ============================================================================
// Example 15: Export Summary
// ============================================================================

console.log('=== Example 15: Complete Workflow Summary ===\n');

console.log('SubtitleEditor provides:');
console.log('✅ Safe fragment-based editing');
console.log('✅ Automatic validation');
console.log('✅ Undo/redo support');
console.log('✅ Event system for reactive UIs');
console.log('✅ Batch operations');
console.log('✅ Rich context for AI operations');
console.log('✅ Multi-format support');
console.log('✅ Search and replace');
console.log('✅ Time operations (shift, scale)');
console.log('✅ Quality checking');
console.log('✅ MCP-compatible API');
console.log('\nPerfect for:');
console.log('  - AI-powered subtitle translation');
console.log('  - Interactive subtitle editors');
console.log('  - Automated subtitle workflows');
console.log('  - Quality control systems');
console.log('  - Batch processing pipelines');

console.log('\n=== All Examples Complete ===');
