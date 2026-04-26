# Getting Started

A lightweight, dependency-free TypeScript library for converting subtitle files between different formats.

## Installation

```bash
npm install subs-converter
```

```bash
bun add subs-converter
```

```bash
yarn add subs-converter
```

## Quick Start

### Basic Conversion

Convert between any supported formats with a single function call:

```typescript
import { convert } from 'subs-converter';

// Convert SRT to VTT
const srtContent = `1
00:00:01,000 --> 00:00:04,000
Hello, World!

2
00:00:05,000 --> 00:00:08,000
This is a subtitle example.
`;

const vttContent = convert(srtContent, 'srt', 'vtt');
console.log(vttContent);
```

Output:
```vtt
WEBVTT

1
00:00:01.000 --> 00:00:04.000
Hello, World!

2
00:00:05.000 --> 00:00:08.000
This is a subtitle example.
```

### Automatic Format Detection

Use `'auto'` as the source format to automatically detect the input format:

```typescript
import { convert, detectFormat } from 'subs-converter';

// Automatic detection
const content = await fs.readFile('subtitles.srt', 'utf-8');
const detected = detectFormat(content);
console.log(`Detected format: ${detected.format}`); // "srt"

// Auto-detect and convert
const jsonContent = convert(content, 'auto', 'json');
```

### Working with Universal JSON

The library uses a Universal JSON format internally for lossless conversions:

```typescript
import { parseToUniversal, formatFromUniversal } from 'subs-converter';

// Parse any format to Universal JSON
const universal = parseToUniversal(srtContent, 'srt');

// Access cues programmatically
console.log(`Total cues: ${universal.cues.length}`);
console.log(`Title: ${universal.metadata.title}`);
console.log(`First cue: ${universal.cues[0].text}`);

// Modify programmatically
universal.cues[0].text = 'Modified text';

// Export to any format
const vttOutput = formatFromUniversal(universal, 'vtt');
```

## Common Use Cases

### Analyzing Subtitles

```typescript
import { analyze } from 'subs-converter';

const analysis = analyze(vttContent, 'vtt');

console.log({
  totalCues: analysis.totalCues,
  duration: analysis.totalDuration,
  averageDuration: analysis.averageDuration,
  shortestCue: analysis.shortestCue.text,
  longestCue: analysis.longestCue.text,
});
```

### Validating Subtiles

```typescript
import { validate } from 'subs-converter';

const result = validate(srtContent, 'srt');

if (!result.isValid) {
  console.error('Validation errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}
```

### Using SubtitleEditor

```typescript
import { SubtitleEditor } from 'subs-converter';

const editor = new SubtitleEditor(srtContent, 'srt');

// Find and replace
const count = editor.findAndReplace('Hello', 'Hi');
console.log(`Replaced ${count} occurrences`);

// Shift timing
editor.shiftTime(1000); // Shift all cues by 1 second

// Export modified content
const output = editor.export('vtt');
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import {
  convert,
  parseToUniversal,
  formatFromUniversal,
  analyze,
  validate,
  SubtitleEditor,
  type UniversalSubtitle,
  type UniversalCue,
  type SubtitleFormat,
} from 'subs-converter';

// All functions are fully typed
const universal: UniversalSubtitle = parseToUniversal(content, 'srt');
const cue: UniversalCue = universal.cues[0];
//     ^? { index: number, startTime: number, endTime: number, ... }
```

## Browser Usage

The package works in browser environments:

```html
<script type="module">
  import convert from './dist/index.js';

  const result = convert(srtContent, 'srt', 'vtt');
  document.getElementById('output').textContent = result;
</script>
```