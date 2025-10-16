# Universal JSON Architecture

## Overview

**subconv-ts** uses a **Universal JSON intermediate format** for all subtitle conversions. This architectural decision ensures lossless conversions, metadata preservation, and easy extensibility.

## The Problem

Traditional subtitle conversion libraries often implement direct conversions between every format pair:

```
SRT → VTT
SRT → ASS
VTT → SRT
VTT → ASS
ASS → SRT
ASS → VTT
... and so on
```

This approach has several issues:

1. **N×N Complexity**: Adding a new format requires implementing converters to/from every existing format
2. **Metadata Loss**: Direct conversions often lose format-specific information
3. **Inconsistency**: Different conversion paths may produce different results
4. **Maintenance Burden**: Bug fixes must be replicated across multiple converters

## The Solution: Universal JSON

Instead of direct conversions, we use a **universal intermediate format**:

```
ANY FORMAT → Universal JSON → ANY FORMAT
```

### Benefits

✅ **Linear Complexity**: Adding a new format only requires implementing:
   - Parse from format → Universal JSON
   - Universal JSON → Format serialization

✅ **Lossless Conversions**: Universal JSON preserves:
   - All subtitle cues with millisecond precision
   - Format-specific metadata (styles, headers, regions)
   - Inline formatting tags
   - Layout and positioning information

✅ **Consistent Results**: All conversions follow the same path, ensuring predictable behavior

✅ **Inspection & Manipulation**: Universal JSON can be inspected, modified, and processed programmatically

✅ **Future-Proof**: Easy to add new properties without breaking existing code

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     INPUT FORMATS                            │
├──────────────┬──────────────┬──────────────┬────────────────┤
│     SRT      │     VTT      │     ASS      │     JSON       │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬─────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
    parseSrt()    parseVtt()    parseAss()    parseJson()
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  UNIVERSAL JSON    │
              │  ═══════════════   │
              │  • Metadata        │
              │  • Styles          │
              │  • Cues (ms-based) │
              │  • Formatting      │
              │  • Layout info     │
              └────────────────────┘
                         │
       ┌─────────────────┴──────────────────┐
       │              │              │      │
       ▼              ▼              ▼      ▼
    toSrt()      toVtt()        toAss()  toJson()
       │              │              │      │
┌──────┴───────┬──────┴───────┬──────┴──────┴──────┬─────────┐
│     SRT      │     VTT      │     ASS      │     JSON       │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                     OUTPUT FORMATS                           │
└─────────────────────────────────────────────────────────────┘
```

## Universal JSON Structure

### Complete Schema

```typescript
interface UniversalSubtitle {
  version: string;                    // Format version (e.g., "1.0.0")
  sourceFormat: SubtitleFormat;       // Original format: 'srt' | 'vtt' | 'ass' | 'json'
  metadata: SubtitleMetadata;         // Global metadata
  styles: StyleDefinition[];          // Style definitions
  cues: UniversalCue[];              // Subtitle cues
}
```

### Metadata Preservation

```typescript
interface SubtitleMetadata {
  title?: string;
  language?: string;
  author?: string;
  description?: string;
  formatSpecific?: {
    ass?: {                          // ASS-specific metadata
      scriptType?: string;
      wrapStyle?: string;
      playResX?: number;
      playResY?: number;
      // ... other ASS header fields
    };
    vtt?: {                          // VTT-specific metadata
      regions?: VttRegion[];
      notes?: string[];
    };
    // Extensible for future formats
    [format: string]: any;
  };
}
```

### Universal Cue Structure

Each cue contains:

```typescript
interface UniversalCue {
  index: number;                     // Sequence number
  startTime: number;                 // Start time in milliseconds
  endTime: number;                   // End time in milliseconds
  duration: number;                  // Computed duration in ms
  text: string;                      // Plain text (no formatting)
  content: string;                   // Formatted content with tags
  style?: string;                    // Style reference
  identifier?: string;               // Cue ID (for VTT)
  layout?: CueLayout;                // Position/alignment
  formatting?: InlineFormatting[];   // Inline formatting spans
  formatSpecific?: {                 // Format-specific properties
    ass?: {
      layer?: number;
      effect?: string;
      actor?: string;
      marginL?: number;
      marginR?: number;
      marginV?: number;
    };
    vtt?: {
      region?: string;
      vertical?: string;
      line?: string | number;
      position?: string | number;
      size?: string | number;
    };
    [format: string]: any;
  };
}
```

## Usage Examples

### Basic Conversion

```typescript
import { convert } from 'subconv-ts';

// Simple conversion (uses universal intermediate automatically)
const vttContent = convert(srtContent, 'srt', 'vtt');
```

### Working with Universal Format

```typescript
import { parseToUniversal, formatFromUniversal } from 'subconv-ts';

// Parse any format to universal
const universal = parseToUniversal(srtContent, 'srt');

// Inspect the universal format
console.log('Total cues:', universal.cues.length);
console.log('Metadata:', universal.metadata);
console.log('Styles:', universal.styles);

// Modify cues programmatically
universal.cues.forEach(cue => {
  // Shift all subtitles by 2 seconds
  cue.startTime += 2000;
  cue.endTime += 2000;
});

// Convert to any format
const vttContent = formatFromUniversal(universal, 'vtt');
const assContent = formatFromUniversal(universal, 'ass');
```

### Preserving Metadata

```typescript
// Parse ASS with rich metadata and styles
const universal = parseToUniversal(assContent, 'ass');

// Metadata is preserved
console.log(universal.metadata.formatSpecific?.ass);
// { scriptType: 'v4.00+', playResX: 1920, playResY: 1080, ... }

// Styles are preserved
console.log(universal.styles);
// [{ name: 'Default', fontName: 'Arial', fontSize: 20, ... }]

// Convert to another format with metadata intact
const jsonOutput = formatFromUniversal(universal, 'json');
// Metadata and styles are preserved in the JSON output
```

### Round-Trip Conversion

```typescript
// Original ASS → Universal → ASS should be lossless
const originalASS = fs.readFileSync('subtitle.ass', 'utf-8');
const universal = parseToUniversal(originalASS, 'ass');
const convertedASS = formatFromUniversal(universal, 'ass');

// All metadata, styles, and cues are preserved
```

### Conversion Options

```typescript
import { formatFromUniversal } from 'subconv-ts';

// Plain text only (strip all formatting)
const plainSRT = formatFromUniversal(universal, 'srt', {
  plainTextOnly: true
});

// Legacy JSON format for backward compatibility
const legacyJSON = formatFromUniversal(universal, 'json', {
  formatSpecific: { useLegacyJson: true }
});
```

## Adding New Formats

To add support for a new subtitle format (e.g., TTML), you only need to implement two functions:

### 1. Parser: Format → Universal

```typescript
// src/formats/ttml.ts
export function ttmlToUniversal(ttmlContent: string): UniversalSubtitle {
  // 1. Parse TTML content
  const parsedTTML = parseTTMLStructure(ttmlContent);
  
  // 2. Extract metadata
  const metadata: SubtitleMetadata = {
    title: parsedTTML.head?.title,
    language: parsedTTML.head?.lang,
    formatSpecific: {
      ttml: {
        timeBase: parsedTTML.head?.timeBase,
        frameRate: parsedTTML.head?.frameRate,
        // ... other TTML-specific metadata
      }
    }
  };
  
  // 3. Convert styles
  const styles: StyleDefinition[] = convertTTMLStylesToUniversal(
    parsedTTML.head?.styling
  );
  
  // 4. Convert cues
  const cues: UniversalCue[] = parsedTTML.body.divs.map((div, index) => ({
    index: index + 1,
    startTime: parseTTMLTime(div.begin),
    endTime: parseTTMLTime(div.end),
    duration: parseTTMLTime(div.end) - parseTTMLTime(div.begin),
    text: stripTTMLFormatting(div.text),
    content: div.text,
    style: div.style,
    formatSpecific: {
      ttml: {
        region: div.region,
        // ... other TTML-specific properties
      }
    }
  }));
  
  return {
    version: '1.0.0',
    sourceFormat: 'ttml',
    metadata,
    styles,
    cues
  };
}
```

### 2. Serializer: Universal → Format

```typescript
export function universalToTTML(universal: UniversalSubtitle): string {
  // 1. Build TTML header with metadata
  const header = buildTTMLHeader(universal.metadata);
  
  // 2. Convert styles to TTML styling
  const styling = convertUniversalStylesToTTML(universal.styles);
  
  // 3. Convert cues to TTML paragraphs
  const body = universal.cues.map(cue => {
    const begin = formatTTMLTime(cue.startTime);
    const end = formatTTMLTime(cue.endTime);
    const text = cue.content;
    
    return `<p begin="${begin}" end="${end}">${text}</p>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<tt xmlns="http://www.w3.org/ns/ttml">
  ${header}
  ${styling}
  <body>
    <div>
      ${body}
    </div>
  </body>
</tt>`;
}
```

### 3. Register in Main Index

```typescript
// src/index.ts
import { ttmlToUniversal, universalToTTML } from './formats/ttml.js';

// Add to parseToUniversal switch
case 'ttml':
  return ttmlToUniversal(content);

// Add to formatFromUniversal switch
case 'ttml':
  return universalToTTML(universal, options);
```

That's it! No need to implement conversions to/from every other format.

## Time Representation

### Why Milliseconds?

Universal JSON uses **milliseconds** for all time values:

- **Precision**: Milliseconds provide sufficient precision for all subtitle formats
- **Simplicity**: Integer math, no floating-point errors
- **Compatibility**: Easy to convert to/from any format's time representation

### Time Conversions

```typescript
// SRT: HH:MM:SS,mmm
"00:01:23,456" → 83456 ms

// VTT: HH:MM:SS.mmm
"00:01:23.456" → 83456 ms

// ASS: H:MM:SS.cc (centiseconds)
"0:01:23.45" → 83450 ms

// Universal: milliseconds
83456
```

## Format-Specific Properties

The `formatSpecific` field allows each format to preserve unique properties:

### ASS Properties

```typescript
{
  formatSpecific: {
    ass: {
      layer: 0,
      effect: "Scroll up",
      actor: "Character Name",
      marginL: 20,
      marginR: 20,
      marginV: 30
    }
  }
}
```

### VTT Properties

```typescript
{
  formatSpecific: {
    vtt: {
      region: "subtitle-region",
      vertical: "rl",
      line: "85%",
      position: "50%",
      size: "80%",
      align: "middle"
    }
  }
}
```

This ensures **round-trip conversions** preserve all original information.

## Best Practices

### 1. Always Use Universal for Processing

```typescript
// ✅ GOOD: Use universal format for manipulation
const universal = parseToUniversal(content, 'srt');
universal.cues.forEach(cue => {
  cue.startTime += 2000; // Shift by 2 seconds
});
const output = formatFromUniversal(universal, 'vtt');

// ❌ BAD: Parse/serialize multiple times
let cues = parseSrt(content);
cues = cues.map(cue => ({
  ...cue,
  startTime: adjustTime(cue.startTime, 2000)
}));
const output = toVtt(cues);
```

### 2. Preserve Metadata When Possible

```typescript
// Convert SRT to VTT, adding language metadata
const universal = parseToUniversal(srtContent, 'srt');
universal.metadata.language = 'en';
universal.metadata.title = 'Episode 1 - English Subtitles';
const vttOutput = formatFromUniversal(universal, 'vtt');
```

### 3. Use Conversion Options

```typescript
// For simple plain text subtitles
const plainText = formatFromUniversal(universal, 'srt', {
  plainTextOnly: true
});

// For rich formatting preservation
const richText = formatFromUniversal(universal, 'ass', {
  preserveFormatting: true,
  preserveStyles: true
});
```

## Testing Strategy

When adding new formats, test the following:

1. **Parse Test**: Format → Universal
2. **Serialize Test**: Universal → Format
3. **Round-Trip Test**: Format → Universal → Format (should be identical)
4. **Cross-Format Test**: Format A → Universal → Format B
5. **Metadata Preservation**: Ensure format-specific metadata survives round-trip
6. **Edge Cases**: Empty files, single cue, overlapping cues, etc.

## Future Enhancements

The Universal JSON format is designed to be extensible:

- **Animation Tags**: Add support for animated text effects
- **Multi-Language**: Support for multiple language tracks in one file
- **Advanced Positioning**: 3D positioning, rotation, scaling
- **Custom Properties**: Application-specific metadata
- **Compression**: Optional binary format for large files

All enhancements can be added without breaking existing code.

## Summary

The Universal JSON architecture provides:

- ✅ **Simplicity**: One intermediate format for all conversions
- ✅ **Losslessness**: Preserve all metadata and formatting
- ✅ **Extensibility**: Easy to add new formats
- ✅ **Maintainability**: Single source of truth
- ✅ **Inspectability**: Programmatic access to all subtitle data
- ✅ **Future-Proof**: Easy to extend without breaking changes

This architecture makes **subconv-ts** a robust, maintainable, and feature-rich subtitle conversion library.