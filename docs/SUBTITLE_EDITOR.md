# SubtitleEditor - Safe Subtitle Manipulation Class

## Overview

`SubtitleEditor` is a high-level class for safe and powerful subtitle manipulation. It provides a unified API for editing subtitles in any format with automatic validation, undo/redo support, and AI-friendly fragment-based operations.

## Key Features

- 🔒 **Safe Operations** - Automatic validation prevents invalid edits
- 🎯 **Fragment-Based Editing** - Edit subtitles piece by piece with context
- 🔄 **Undo/Redo** - Full history support for interactive editing
- 🤖 **AI-Friendly** - Perfect for MCP (Model Context Protocol) integration
- 🎨 **Multi-Format** - Works with SRT, VTT, ASS, JSON seamlessly
- 🔍 **Search & Replace** - Powerful text search with filters
- ⏱️ **Time Operations** - Shift, scale, and fix timing issues
- ✅ **Validation** - Built-in quality checking
- 📊 **Statistics** - Detailed subtitle analytics
- 🎭 **Event System** - React to changes in real-time

## Installation

```typescript
import { SubtitleEditor } from 'subconv-ts';
```

## Quick Start

```typescript
import { SubtitleEditor } from 'subconv-ts';

// Load from any format
const editor = new SubtitleEditor(srtContent, 'srt');

// Edit safely
editor.updateFragmentText(0, 'New text');

// Export to any format
const vttOutput = editor.export('vtt');
const assOutput = editor.export('ass');
```

## API Reference

### Constructor

```typescript
new SubtitleEditor(content: string | UniversalSubtitle, format?: SubtitleFormat | 'auto')
```

Creates a new SubtitleEditor instance.

**Parameters:**
- `content` - Subtitle content as string or UniversalSubtitle object
- `format` - Format hint ('srt', 'vtt', 'ass', 'json', or 'auto')

**Example:**
```typescript
// From string with auto-detection
const editor = new SubtitleEditor(content, 'auto');

// From string with explicit format
const editor = new SubtitleEditor(srtContent, 'srt');

// From Universal JSON
const editor = new SubtitleEditor(universalObj);
```

### Basic Accessors

#### `getUniversal(): UniversalSubtitle`
Get the full Universal JSON representation.

#### `getSourceFormat(): SubtitleFormat`
Get the original source format.

#### `getMetadata(): SubtitleMetadata`
Get subtitle metadata (title, language, etc.).

#### `getCues(): UniversalCue[]`
Get all subtitle cues.

#### `getCue(index: number): UniversalCue | undefined`
Get a specific cue by array index.

#### `getCueById(id: number): UniversalCue | undefined`
Get a cue by its ID number.

#### `getStyles(): StyleDefinition[]`
Get all style definitions.

#### `getStats()`
Get detailed statistics about the subtitles.

#### `getTotalDuration(): number`
Get total duration in milliseconds.

### Fragment-Based Operations (AI-Friendly)

#### `getFragmentContext(index: number): FragmentContext | null`

Get rich context for a subtitle fragment. **Perfect for AI operations.**

**Returns:**
```typescript
{
  cue: UniversalCue,           // Current cue
  index: number,               // Array index
  previous?: UniversalCue,     // Previous cue (context)
  next?: UniversalCue,         // Next cue (context)
  timeFromStart: number,       // Time from beginning
  timeToEnd: number,           // Time to end
  style?: StyleDefinition      // Style information
}
```

**Example:**
```typescript
const context = editor.getFragmentContext(5);
console.log('Current:', context.cue.text);
console.log('Previous:', context.previous?.text);
console.log('Next:', context.next?.text);
```

#### `getFragmentsInRange(startMs: number, endMs: number)`
Get all fragments within a time range.

#### `getFragmentsBySpeaker(speaker: string)`
Get all fragments by a specific speaker/actor.

#### `updateFragment(index: number, updates: Partial<UniversalCue>, validate?: boolean): boolean`

Update a fragment with automatic validation.

**Example:**
```typescript
editor.updateFragment(0, {
  text: 'New text',
  startTime: 1000,
  endTime: 3000
}, true); // true = validate before applying
```

#### `updateFragmentText(index: number, text: string, updateContent?: boolean): boolean`

Convenient method to update just the text.

```typescript
editor.updateFragmentText(0, 'Hello, world!');
```

#### `updateFragmentTiming(index: number, startTime: number, endTime: number): boolean`

Update timing safely (validates that start < end).

```typescript
editor.updateFragmentTiming(0, 1000, 3000);
```

### Cue Operations

#### `addCue(cue: Omit<UniversalCue, 'index'>): number`
Add a new cue, returns the index.

```typescript
const index = editor.addCue({
  startTime: 5000,
  endTime: 7000,
  duration: 2000,
  text: 'New subtitle',
  content: 'New subtitle'
});
```

#### `insertCue(index: number, cue: Omit<UniversalCue, 'index'>): boolean`
Insert a cue at a specific position.

#### `deleteCue(index: number): boolean`
Delete a cue by index.

#### `splitCue(index: number, splitTimeMs: number): boolean`
Split a cue at a time point.

```typescript
// Split cue 0 at 2 seconds
editor.splitCue(0, 2000);
```

#### `mergeCues(startIndex: number, endIndex: number): boolean`
Merge consecutive cues.

```typescript
// Merge cues 1, 2, and 3
editor.mergeCues(1, 3);
```

### Search and Filter

#### `search(query: string, options?: SearchOptions): number[]`

Search for text in subtitles.

**Options:**
```typescript
{
  caseSensitive?: boolean;
  regex?: boolean;
  includeContent?: boolean;  // Search formatted content too
  timeRange?: { start: number; end: number };
  styles?: string[];         // Filter by styles
  layers?: number[];         // Filter by layers (ASS)
}
```

**Examples:**
```typescript
// Simple search
const matches = editor.search('hello');

// Case-sensitive regex
const matches = editor.search('Hello.*world', {
  regex: true,
  caseSensitive: true
});

// Search in time range
const matches = editor.search('subtitle', {
  timeRange: { start: 0, end: 60000 } // First minute
});

// Search specific style
const matches = editor.search('dialogue', {
  styles: ['MainCharacter', 'Narrator']
});
```

#### `findAndReplace(find: string, replace: string, options?: SearchOptions): number`

Find and replace text, returns count of replacements.

```typescript
const count = editor.findAndReplace('color', 'colour', {
  caseSensitive: false
});
console.log(`Replaced ${count} occurrences`);
```

### Time Operations

#### `shiftTime(offsetMs: number, startIndex?: number, endIndex?: number): void`

Shift subtitles by time offset.

```typescript
// Shift all subtitles by 2 seconds
editor.shiftTime(2000);

// Shift only cues 5-10 by -500ms
editor.shiftTime(-500, 5, 10);
```

#### `scaleTime(factor: number, startIndex?: number, endIndex?: number): void`

Scale time (speed up or slow down).

```typescript
// Speed up by 1.5x
editor.scaleTime(1.5);

// Slow down specific range by 0.8x
editor.scaleTime(0.8, 0, 10);
```

#### `fixOverlaps(gapMs?: number): number`

Fix overlapping subtitles, returns count of fixes.

```typescript
// Fix overlaps with 10ms gap
const fixed = editor.fixOverlaps(10);
console.log(`Fixed ${fixed} overlapping cues`);
```

### Validation

#### `validateCue(index: number, options?: ValidationOptions): ValidationResult`

Validate a single cue.

```typescript
const result = editor.validateCue(0, {
  minDuration: 1000,
  maxDuration: 7000,
  maxTextLength: 150
});

if (!result.isValid) {
  console.log('Errors:', result.errors);
}
```

#### `validateAll(options?: ValidationOptions): ValidationResult`

Validate all cues.

**Options:**
```typescript
{
  checkOverlaps?: boolean;
  checkDurations?: boolean;
  checkTextLength?: boolean;
  maxTextLength?: number;
  minDuration?: number;
  maxDuration?: number;
}
```

**Example:**
```typescript
const validation = editor.validateAll({
  checkOverlaps: true,
  minDuration: 500,
  maxDuration: 8000,
  maxTextLength: 200
});

console.log('Valid:', validation.isValid);
console.log('Errors:', validation.errors.length);
console.log('Warnings:', validation.warnings.length);
```

### Metadata and Styles

#### `updateMetadata(metadata: Partial<SubtitleMetadata>): void`

Update subtitle metadata.

```typescript
editor.updateMetadata({
  title: 'My Movie - English',
  language: 'en',
  author: 'Translation Team'
});
```

#### `addStyle(style: StyleDefinition): void`

Add a new style definition.

#### `updateStyle(name: string, updates: Partial<StyleDefinition>): boolean`

Update an existing style.

### Export

#### `export(format: SubtitleFormat, options?: ConversionOptions): string`

Export to a specific format.

```typescript
const srt = editor.export('srt');
const vtt = editor.export('vtt');
const ass = editor.export('ass');
const json = editor.export('json');

// With options
const plainSrt = editor.export('srt', { plainTextOnly: true });
```

#### `toJSON(pretty?: boolean): string`

Export to JSON string.

### History (Undo/Redo)

#### `canUndo(): boolean`
Check if undo is available.

#### `canRedo(): boolean`
Check if redo is available.

#### `undo(): boolean`
Undo last change.

#### `redo(): boolean`
Redo last undone change.

#### `clearHistory(): void`
Clear history (free memory).

**Example:**
```typescript
// Make changes
editor.updateFragmentText(0, 'Change 1');
editor.updateFragmentText(0, 'Change 2');

// Undo
if (editor.canUndo()) {
  editor.undo(); // Back to "Change 1"
  editor.undo(); // Back to original
}

// Redo
if (editor.canRedo()) {
  editor.redo(); // Forward to "Change 1"
}
```

### Event System

#### `onChange(listener: (event: ChangeEvent) => void): () => void`

Subscribe to changes, returns unsubscribe function.

```typescript
const unsubscribe = editor.onChange((event) => {
  console.log('Change type:', event.type);
  console.log('Timestamp:', event.timestamp);
  console.log('Data:', event.data);
});

// Later...
unsubscribe();
```

**Event types:**
- `cue-added` - New cue added
- `cue-updated` - Cue modified
- `cue-deleted` - Cue removed
- `metadata-updated` - Metadata changed
- `style-added` - Style added
- `style-updated` - Style modified
- `style-deleted` - Style removed
- `batch-update` - Multiple operations

### Batch Operations

#### `batch(operations: () => void): void`

Execute multiple operations as a single transaction.

```typescript
editor.batch(() => {
  editor.updateFragmentText(0, 'Text 1');
  editor.updateFragmentText(1, 'Text 2');
  editor.shiftTime(1000);
  // All saved as one undo entry
});
```

## Use Cases

### 1. AI-Powered Translation

```typescript
async function translateSubtitles(
  editor: SubtitleEditor,
  targetLang: string,
  aiTranslate: (text: string, context: any) => Promise<string>
) {
  const totalCues = editor.getCues().length;

  for (let i = 0; i < totalCues; i++) {
    // Get rich context for AI
    const context = editor.getFragmentContext(i);
    if (!context) continue;

    // Prepare context
    const aiContext = {
      currentText: context.cue.text,
      previousText: context.previous?.text,
      nextText: context.next?.text,
      speaker: context.cue.formatSpecific?.ass?.actor,
      timestamp: context.timeFromStart
    };

    // Translate with AI
    const translated = await aiTranslate(context.cue.text, aiContext);

    // Update safely
    editor.updateFragmentText(i, translated);
  }

  return editor.export(editor.getSourceFormat());
}
```

### 2. Quality Control Pipeline

```typescript
function qualityCheck(editor: SubtitleEditor) {
  // Validate all
  const validation = editor.validateAll({
    checkOverlaps: true,
    minDuration: 1000,
    maxDuration: 7000,
    maxTextLength: 150
  });

  // Fix issues
  if (!validation.isValid) {
    // Fix overlaps
    const fixed = editor.fixOverlaps(10);
    console.log(`Fixed ${fixed} overlaps`);

    // Report remaining errors
    validation.errors.forEach(error => {
      console.error(`Cue ${error.cueIndex}: ${error.message}`);
    });
  }

  return validation;
}
```

### 3. Interactive Editor UI

```typescript
class SubtitleEditorUI {
  private editor: SubtitleEditor;
  private unsubscribe: () => void;

  constructor(content: string) {
    this.editor = new SubtitleEditor(content, 'auto');

    // Listen to changes for UI updates
    this.unsubscribe = this.editor.onChange((event) => {
      this.updateUI(event);
    });
  }

  updateUI(event: ChangeEvent) {
    switch (event.type) {
      case 'cue-updated':
        this.refreshCueView(event.data.index);
        break;
      case 'batch-update':
        this.refreshAllViews();
        break;
    }
  }

  onUserEdit(index: number, newText: string) {
    this.editor.updateFragmentText(index, newText);
  }

  onUndo() {
    if (this.editor.canUndo()) {
      this.editor.undo();
    }
  }

  onRedo() {
    if (this.editor.canRedo()) {
      this.editor.redo();
    }
  }

  destroy() {
    this.unsubscribe();
  }
}
```

### 4. MCP (Model Context Protocol) Integration

```typescript
// MCP Tool: Get subtitle fragment with context
function mcpGetFragment(editor: SubtitleEditor, index: number) {
  const context = editor.getFragmentContext(index);
  
  return {
    fragment: {
      index: context?.index,
      text: context?.cue.text,
      startTime: context?.cue.startTime,
      endTime: context?.cue.endTime,
      duration: context?.cue.duration
    },
    context: {
      previous: context?.previous?.text,
      next: context?.next?.text,
      speaker: context?.cue.formatSpecific?.ass?.actor,
      style: context?.style?.name
    },
    position: {
      timeFromStart: context?.timeFromStart,
      timeToEnd: context?.timeToEnd
    }
  };
}

// MCP Tool: Update fragment
function mcpUpdateFragment(
  editor: SubtitleEditor,
  index: number,
  text: string
) {
  const success = editor.updateFragmentText(index, text);
  
  return {
    success,
    validation: editor.validateCue(index)
  };
}

// MCP Tool: Search subtitles
function mcpSearch(
  editor: SubtitleEditor,
  query: string,
  options?: any
) {
  const indices = editor.search(query, options);
  
  return indices.map(index => ({
    index,
    ...mcpGetFragment(editor, index)
  }));
}
```

### 5. Batch Processing

```typescript
function batchProcess(files: string[]) {
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const editor = new SubtitleEditor(content, 'auto');

    // Batch operations
    editor.batch(() => {
      // Shift by 2 seconds
      editor.shiftTime(2000);

      // Fix overlaps
      editor.fixOverlaps(10);

      // Replace text
      editor.findAndReplace('color', 'colour');
    });

    // Validate
    const validation = editor.validateAll();
    if (validation.isValid) {
      // Save
      const output = editor.export(editor.getSourceFormat());
      fs.writeFileSync(file, output);
    }
  });
}
```

## Best Practices

### 1. Always Use Validation
```typescript
// ✅ GOOD: Validate before critical operations
const valid = editor.updateFragment(0, updates, true);
if (!valid) {
  console.error('Invalid update');
}
```

### 2. Use Batch for Multiple Operations
```typescript
// ✅ GOOD: Single undo entry
editor.batch(() => {
  editor.shiftTime(1000);
  editor.findAndReplace('old', 'new');
});

// ❌ BAD: Multiple undo entries
editor.shiftTime(1000);
editor.findAndReplace('old', 'new');
```

### 3. Get Context for AI Operations
```typescript
// ✅ GOOD: Rich context for better AI results
const context = editor.getFragmentContext(i);
const translated = await ai.translate(context.cue.text, {
  previous: context.previous?.text,
  next: context.next?.text,
  speaker: context.cue.formatSpecific?.ass?.actor
});

// ❌ BAD: No context
const cue = editor.getCue(i);
const translated = await ai.translate(cue.text);
```

### 4. Clean Up Event Listeners
```typescript
// ✅ GOOD: Unsubscribe when done
const unsubscribe = editor.onChange(handleChange);
// Later...
unsubscribe();

// ❌ BAD: Memory leak
editor.onChange(handleChange);
```

### 5. Validate After Batch Operations
```typescript
// ✅ GOOD: Check quality after changes
editor.batch(() => {
  // ... operations
});
const validation = editor.validateAll();

// ❌ BAD: No validation
editor.batch(() => {
  // ... operations
});
// Might have created invalid subtitles
```

## Performance Tips

1. **Use batch operations** for multiple changes
2. **Clear history** periodically if not needed: `editor.clearHistory()`
3. **Disable validation** for bulk operations, validate once at end
4. **Use fragment context** instead of full cue access repeatedly

## Comparison with Direct API

| Operation | Direct API | SubtitleEditor |
|-----------|-----------|----------------|
| Parse & Edit | Manual parse/serialize | Automatic |
| Validation | Manual validation | Built-in |
| Undo/Redo | Implement yourself | Built-in |
| Context for AI | Manual gathering | `getFragmentContext()` |
| Events | Implement yourself | Built-in |
| Safety | Manual checks | Automatic |

## Summary

`SubtitleEditor` provides a **safe, powerful, and AI-friendly** way to work with subtitles:

- ✅ **Safe**: Automatic validation prevents errors
- ✅ **Powerful**: Rich API for all operations
- ✅ **AI-Ready**: Fragment-based with rich context
- ✅ **Interactive**: Undo/redo and event system
- ✅ **Universal**: Works with all formats

Perfect for:
- 🤖 AI-powered subtitle translation
- 🎨 Interactive subtitle editors
- 🔄 Automated workflows
- ✅ Quality control systems
- 📊 Subtitle analysis tools