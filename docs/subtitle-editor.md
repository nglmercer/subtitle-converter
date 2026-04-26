# SubtitleEditor

The `SubtitleEditor` class provides a high-level API for safe subtitle manipulation with undo/redo support, validation, and batch operations.

## Quick Start

```typescript
import { SubtitleEditor } from 'subs-converter';

// Create editor from content
const editor = new SubtitleEditor(srtContent, 'srt');

// Make changes
editor.findAndReplace('Hello', 'Hi');

// Export
const output = editor.export('vtt');
```

## Basic Operations

### Creating an Editor

```typescript
import { SubtitleEditor } from 'subs-converter';

// From string content
const editor = new SubtitleEditor(srtContent, 'srt');

// From Universal JSON
const universal = parseToUniversal(content, 'auto');
const editor2 = new SubtitleEditor(universal);
```

### Accessing Data

```typescript
// Get all cues
const cues = editor.getCues();

// Get specific cue
const cue1 = editor.getCue(0);

// Get by ID
const cue = editor.getCueById(1);

// Get metadata
const metadata = editor.getMetadata();

// Get styles
const styles = editor.getStyles();

// Get statistics
const stats = editor.getStats();
```

### Exporting

```typescript
// Export to specific format
const vtt = editor.export('vtt');
const ass = editor.export('ass');
const json = editor.export('json');

// Export as JSON string
const jsonString = editor.toJSON(true);

// Custom export with options
const custom = editor.export('vtt', { plainTextOnly: false });
```

## Cue Operations

### Adding Cues

```typescript
// Add cue at end
const index = editor.addCue({
  startTime: 10000,
  endTime: 13000,
  duration: 3000,
  text: 'New subtitle',
  content: 'New subtitle',
});

// Insert cue at position
editor.insertCue(2, {
  startTime: 5000,
  endTime: 8000,
  duration: 3000,
  text: 'Inserted subtitle',
});
```

### Updating Cues

```typescript
// Update entire cue
editor.updateFragment(0, {
  text: 'Updated text',
  startTime: 2000,
  endTime: 5000,
});

// Update just text
editor.updateFragmentText(0, 'New text');

// Update timing
editor.updateFragmentTiming(0, 1000, 4000);
```

### Deleting Cues

```typescript
// Delete cue at index
editor.deleteCue(0);
```

### Splitting and Merging

```typescript
// Split cue at time point
editor.splitCue(0, 2000); // Split first cue at 2 seconds

// Merge consecutive cues
editor.mergeCues(0, 2); // Merge cues 0-2 into one
```

## Search and Replace

### Finding Text

```typescript
// Simple search
const indices = editor.search('hello');

// Case-sensitive
const indices = editor.search('Hello', { caseSensitive: true });

// Regex search
const indices = editor.search('hello|hi', { regex: true });

// Search with filters
const indices = editor.search('hello', {
  timeRange: { start: 5000, end: 10000 },
  styles: ['Bold'],
  caseSensitive: false,
});
```

### Find and Replace

```typescript
// Find and replace
const count = editor.findAndReplace('Hello', 'Hi');

// Regex replace
const count = editor.findAndReplace('(hello)', 'Hi', { regex: true });

// Replace with options
const count = editor.findAndReplace('hello', 'hi', {
  caseSensitive: true,
  includeContent: true,
});
```

## Time Operations

### Shifting Time

```typescript
// Shift all cues by 1 second
editor.shiftTime(1000);

// Shift specific range
editor.shiftTime(500, 5, 10); // Shift cues 5-10 by 500ms

// Negative shift
editor.shiftTime(-2000); // Shift back 2 seconds
```

### Scaling Time

```typescript
// Slow down by 10%
editor.scaleTime(1.1);

// Speed up by 10%
editor.scaleTime(0.9);

// Scale specific range
editor.scaleTime(1.5, 0, 5); // First 5 cues at 1.5x speed
```

### Fixing Overlaps

```typescript
// Fix overlapping cues (no gap)
const fixed = editor.fixOverlaps();

// Fix with gap between cues
const fixed = editor.fixOverlaps(100); // 100ms gap
```

## Validation

### Validating Single Cue

```typescript
const result = editor.validateCue(0);

// Custom validation options
const result = editor.validateCue(0, {
  minDuration: 1000,
  maxDuration: 8000,
  maxTextLength: 150,
});
```

### Validating All Cues

```typescript
const result = editor.validateAll();

// With options
const result = editor.validateAll({
  checkOverlaps: true,
  checkDurations: true,
  minDuration: 500,
  maxDuration: 10000,
});

if (!result.isValid) {
  console.log('Errors:', result.errors);
}
console.log('Warnings:', result.warnings);
```

## Metadata and Styles

### Updating Metadata

```typescript
editor.updateMetadata({
  title: 'New Title',
  language: 'en',
  author: 'John Doe',
});
```

### Managing Styles

```typescript
// Add style
editor.addStyle({
  name: 'Bold',
  fontName: 'Arial',
  fontSize: 32,
  bold: true,
});

// Update existing style
editor.updateStyle('Bold', {
  primaryColor: '#FF0000',
});
```

## Fragment Context

The `FragmentContext` provides surrounding context for AI operations:

```typescript
// Get context for a cue
const context = editor.getFragmentContext(5);

if (context) {
  // Current cue
  context.cue;      // UniversalCue
  context.index;    // 5

  // Previous cue (if any)
  context.previous?.text;

  // Next cue (if any)  
  context.next?.text;

  // Time position
  context.timeFromStart;  // Time from video start (ms)
  context.timeToEnd;     // Time to video end (ms)

  // Style (if any)
  context.style;
}
```

### Get Fragments in Range

```typescript
// Get all cues in time range
const fragments = editor.getFragmentsInRange(5000, 10000);

fragments.forEach(({ cue, index }) => {
  console.log(`${index}: ${cue.text}`);
});
```

### Get Fragments by Speaker

```typescript
// For ASS files with speaker/actor info
const fragments = editor.getFragmentsBySpeaker('John');

fragments.forEach(({ cue, index }) => {
  console.log(`${index}: ${cue.text}`);
});
```

## Undo/Redo

### Checking Availability

```typescript
if (editor.canUndo()) {
  editor.undo();
}

if (editor.canRedo()) {
  editor.redo();
}
```

### Undo/Redo Operations

```typescript
// Undo last change
editor.undo();

// Redo last undone change
editor.redo();

// Clear history
editor.clearHistory();
```

## Event System

### Listening to Changes

```typescript
const unsubscribe = editor.onChange((event) => {
  console.log('Change:', event.type);
  console.log('Data:', event.data);
});

// Unsubscribe
unsubscribe();
```

**Event Types:**
- `cue-added`
- `cue-updated`
- `cue-deleted`
- `metadata-updated`
- `style-added`
- `style-updated`
- `style-deleted`
- `batch-update`

## Batch Operations

Execute multiple operations in a transaction:

```typescript
editor.batch(() => {
  editor.findAndReplace('Hello', 'Hi');
  editor.shiftTime(1000);
  editor.deleteCue(5);
});

// All changes applied together, or all rolled back on error
```

## Example: Complete Workflow

```typescript
import { SubtitleEditor } from 'subs-converter';

const editor = new SubtitleEditor(srtContent, 'srt');

// Find and fix issues
const validation = editor.validateAll({
  checkOverlaps: true,
  minDuration: 500,
});

if (validation.errors.length > 0) {
  // Fix overlapping
  editor.fixOverlaps(100);
}

// Search and replace common issues
let count = editor.findAndReplace('Helo', 'Hello');
count += editor.findAndReplace('teh', 'the');

// Shift timing if needed
editor.shiftTime(1000);

// Export fixed subtitles
const fixed = editor.export('vtt');

// Or save as JSON
const json = editor.toJSON(true);
```