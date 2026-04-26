# Universal JSON Architecture

The library uses a **Universal JSON intermediate format** for all subtitle conversions. This document explains the architecture, its benefits, and how to use it programmatically.

## Why Universal JSON?

Traditional subtitle converters require N×N conversion implementations (SRT→VTT, SRT→ASS, VTT→SRT, VTT→ASS, etc.). With 5 formats, that's 20 conversions to maintain.

The Universal JSON approach simplifies this to **N + N conversions** (5 input + 5 output = 10 total), with all format-specific logic isolated.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   INPUT FORMATS                    OUTPUT FORMATS            │
│                                                             │
│   ┌─────────┐                     ┌─────────┐              │
│   │   SRT   │──┐               ┌──│   SRT   │              │
│   └─────────┘  │               │  └─────────┘              │
│   ┌─────────┐  │    ┌───────┐ │  ┌─────────┐              │
│   │   VTT   │──┼───▶│       │◀──│   VTT   │              │
│   └─────────┘  │    │ JSON  │   │  └─────────┘              │
│   ┌─────────┐  │    │ Univ │   │  ┌─────────┐              │
│   │   ASS   │──┤    │      │   ├──│   ASS   │              │
│   └─────────┘  │    └───────┘   │  └─────────┘              │
│   ┌─────────┐  │               │  ┌─────────┐              │
│   │   JSON  │──┘               └──│   JSON  │              │
│   └─────────┘                     └─────────┘              │
│                                                             │
│   PARSE                           FORMAT                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Format Structure

```typescript
interface UniversalSubtitle {
  version: string;           // Format version
  sourceFormat: SubtitleFormat;
  metadata: SubtitleMetadata;
  styles: StyleDefinition[];
  cues: UniversalCue[];
}
```

### Example

```json
{
  "version": "1.0.0",
  "sourceFormat": "srt",
  "metadata": {
    "title": "My Subtitles",
    "language": "en"
  },
  "styles": [
    {
      "name": "Default",
      "fontName": "Arial",
      "fontSize": 24,
      "primaryColor": "#FFFFFF"
    }
  ],
  "cues": [
    {
      "index": 1,
      "startTime": 1000,
      "endTime": 4000,
      "duration": 3000,
      "text": "Hello, World!",
      "content": "Hello, World!",
      "style": "Default"
    }
  ]
}
```

## Key Benefits

### 1. Lossless Conversions

All metadata, styles, and format-specific information is preserved:

```typescript
const srtContent = readFile('movie.srt');
const universal = parseToUniversal(srtContent, 'srt');

// Parse ASS and all formatting is preserved
const assContent = formatFromUniversal(universal, 'ass');
```

### 2. Programmatic Access

Access and modify subtitles with full type safety:

```typescript
const universal = parseToUniversal(content, 'auto');

// Find all cues containing "hello"
const found = universal.cues.filter(c => 
  c.text.toLowerCase().includes('hello')
);

// Modify cue text
found[0].text = 'Hello, modified world!';

// Modify timing
found[0].startTime += 1000; // Shift by 1 second
```

### 3. Easy Extensibility

Adding a new format requires only:
1. Implement `parseToUniversal()` 
2. Implement `formatFromUniversal()`

No changes needed to existing format converters.

### 4. Analysis & Validation

The universal format enables powerful analysis:

```typescript
const universal = parseToUniversal(content, 'srt');

// Statistics
const totalDuration = universal.cues.reduce(
  (sum, c) => sum + c.duration, 0
);

// Find timing issues
const overlaps = universal.cues.filter(
  (c, i) => i > 0 && c.startTime < universal.cues[i-1].endTime
);
```

## Working with Universal JSON

### Parse Any Format

```typescript
import { parseToUniversal } from 'subs-converter';

// Auto-detect format
const universal = parseToUniversal(content, 'auto');

// Explicit format
const universal = parseToUniversal(srtContent, 'srt');
```

### Access Data

```typescript
// Iterate cues
for (const cue of universal.cues) {
  console.log(`${cue.index}: ${cue.text}`);
  console.log(`  Time: ${cue.startTime} - ${cue.endTime}`);
  console.log(`  Duration: ${cue.duration}ms`);
}

// Access metadata
console.log(universal.metadata.title);
console.log(universal.metadata.formatSpecific?.ass?.playResX);
```

### Modify Data

```typescript
// Update a cue
universal.cues[0].text = 'New text';
universal.cues[0].startTime = 5000;

// Add a style
universal.styles.push({
  name: 'Bold Red',
  fontName: 'Arial',
  fontSize: 28,
  primaryColor: '#FF0000',
  bold: true,
});

// Apply style to cue
universal.cues[0].style = 'Bold Red';
```

### Export to Any Format

```typescript
import { formatFromUniversal } from 'subs-converter';

// Export to VTT
const vtt = formatFromUniversal(universal, 'vtt');

// Export to ASS
const ass = formatFromUniversal(universal, 'ass');

// Export to JSON
const json = formatFromUniversal(universal, 'json');
```

## Millisecond Precision

All timing in Universal JSON uses milliseconds:

```typescript
const cue = universal.cues[0];

// Start: 1 second = 1000ms
cue.startTime;    // 1000

// End: 4 seconds = 4000ms  
cue.endTime;      // 4000

// Duration: 3000ms
cue.duration;    // 3000 (computed)
```

Use utility functions to convert between formats:

```typescript
import { timeStringToMs, msToTimeString } from 'subs-converter';

// String to milliseconds
timeStringToMs('00:00:01.000');  // 1000
timeStringToMs('00:00:01,000');  // 1000

// Milliseconds to string
msToTimeString(1000, 'srt');  // "00:00:01,000"
msToTimeString(1000, 'vtt'); // "00:00:01.000"
```

## Metadata Preservation

The Universal JSON format preserves format-specific metadata:

### ASS/SSA Metadata

```typescript
const universal = parseToUniversal(assContent, 'ass');

universal.metadata.formatSpecific?.ass;
// {
//   scriptType: "v4.00+",
//   playResX: 1920,
//   playResY: 1080,
//   ...
// }
```

### VTT Metadata

```typescript
const universal = parseToUniversal(vttContent, 'vtt');

universal.metadata.formatSpecific?.vtt;
// {
//   regions: [...],
//   notes: [...],
//   ...
// }
```

## Style Definitions

Styles are preserved and converted:

```typescript
// ASS style
{
  "name": "Default",
  "fontName": "Arial",
  "fontSize": 48,
  "primaryColor": "&H00FFFFFF",
  "bold": true,
  "italic": false,
  "alignment": 2
}

// VTT style (regions are stored differently)
// Styles in Universal JSON are format-agnostic
// Conversion handles format-specific mapping
```

## Cloning

Always clone before modifying to avoid mutating the original:

```typescript
import { cloneUniversal } from 'subs-converter';

// Create a copy
const modified = cloneUniversal(universal);

// Safe to modify
modified.cues[0].text = 'Modified';
```

## Round-Trip Conversions

Universal JSON ensures lossless round-trips:

```typescript
// Original SRT
const srt = readFile('movie.srt');

// Parse
const universal = parseToUniversal(srt, 'srt');

// Modify
universal.metadata.title = 'Modified';

// Export to same format
const srt2 = formatFromUniversal(universal, 'srt');

// Parse again
const universal2 = parseToUniversal(srt2, 'srt');

// Verify
console.log(universal.cues.length);     // Should match
console.log(universal2.cues.length);
```