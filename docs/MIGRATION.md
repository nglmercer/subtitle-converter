# Migration Guide: v1.x to v2.0

This guide helps you migrate from **subconv-ts v1.x** to **v2.0** which introduces the Universal JSON architecture.

## What's New in v2.0

- 🎯 **Universal JSON Architecture**: All conversions use a lossless intermediate format
- 💾 **Metadata Preservation**: Styles, formatting, and format-specific properties are preserved
- 🎨 **Programmatic Manipulation**: Modify subtitles with millisecond precision
- 🔄 **Round-Trip Conversions**: Lossless conversions maintain all original information
- 📊 **Enhanced Statistics**: More detailed subtitle analysis

## Is Migration Required?

**No!** v2.0 is **100% backward compatible** with v1.x code.

All existing v1.x APIs continue to work exactly as before. The new Universal JSON architecture is used internally without breaking any existing functionality.

## Backward Compatibility

### All v1.x Functions Still Work

```typescript
// ✅ All v1.x code continues to work in v2.0
import { convert, analyze, validate } from 'subconv-ts';

const vttContent = convert(srtContent, 'srt', 'vtt');
const analysis = analyze(srtContent, 'srt');
const validation = validate(srtContent, 'srt');

// Format-specific functions also work
import { parseSrt, toSrt, parseVtt, toVtt } from 'subconv-ts';
const cues = parseSrt(srtContent);
const vtt = toVtt(cues);
```

### What Changed Under the Hood

In v1.x, conversions worked like this:
```
SRT → VTT (direct conversion)
SRT → ASS (direct conversion)
VTT → SRT (direct conversion)
... etc
```

In v2.0, conversions automatically use Universal JSON:
```
SRT → Universal JSON → VTT
SRT → Universal JSON → ASS
VTT → Universal JSON → SRT
... etc
```

**The result is the same**, but now you can also access and manipulate the Universal JSON format directly!

## New Features You Can Use

### 1. Working with Universal Format

**v1.x**: Limited to basic conversion
```typescript
// v1.x - basic conversion only
const vttContent = convert(srtContent, 'srt', 'vtt');
```

**v2.0**: Access the intermediate format
```typescript
// v2.0 - access Universal JSON
import { parseToUniversal, formatFromUniversal } from 'subconv-ts';

const universal = parseToUniversal(srtContent, 'srt');
console.log(universal.cues);      // Array of cues
console.log(universal.metadata);  // Metadata object
console.log(universal.styles);    // Style definitions

// Convert to any format from the same universal object
const vttContent = formatFromUniversal(universal, 'vtt');
const assContent = formatFromUniversal(universal, 'ass');
```

### 2. Programmatic Subtitle Manipulation

**v1.x**: Required parsing and re-serializing
```typescript
// v1.x - manual manipulation
const cues = parseSrt(srtContent);
const shifted = cues.map(cue => {
  // Manual time string manipulation (error-prone!)
  const [h, m, s, ms] = parseTimeString(cue.startTime);
  // ... complex time calculations
  return { ...cue, startTime: newTime, endTime: newEndTime };
});
const output = toSrt(shifted);
```

**v2.0**: Work with milliseconds directly
```typescript
// v2.0 - easy manipulation with milliseconds
import { parseToUniversal, formatFromUniversal } from 'subconv-ts';

const universal = parseToUniversal(srtContent, 'srt');

// Shift by 2 seconds - simple and safe!
universal.cues.forEach(cue => {
  cue.startTime += 2000;  // milliseconds
  cue.endTime += 2000;
});

const output = formatFromUniversal(universal, 'srt');
```

### 3. Metadata Preservation

**v1.x**: Metadata was lost during conversion
```typescript
// v1.x - ASS metadata lost when converting to JSON
const jsonContent = convert(assContent, 'ass', 'json');
// Metadata like styles, script info, etc. are gone ❌
```

**v2.0**: Metadata is preserved
```typescript
// v2.0 - metadata preserved in Universal JSON
const universal = parseToUniversal(assContent, 'ass');

// Access preserved ASS metadata
console.log(universal.metadata.formatSpecific?.ass);
// { scriptType: 'v4.00+', playResX: 1920, playResY: 1080, ... }

// Styles are preserved
console.log(universal.styles);
// [{ name: 'Default', fontName: 'Arial', fontSize: 20, ... }]

// Convert and metadata stays in Universal JSON
const jsonContent = formatFromUniversal(universal, 'json');
// Metadata is preserved! ✅
```

### 4. Time Utilities

**v2.0**: New utility functions for time conversion
```typescript
import { timeStringToMs, msToTimeString } from 'subconv-ts';

// Convert time strings to milliseconds
const ms = timeStringToMs('00:01:23,456');  // 83456

// Convert milliseconds to time strings
const srtTime = msToTimeString(83456, 'srt');  // "00:01:23,456"
const vttTime = msToTimeString(83456, 'vtt');  // "00:01:23.456"
```

### 5. Advanced Statistics

**v2.0**: Get more detailed statistics
```typescript
import { parseToUniversal, getUniversalStats } from 'subconv-ts';

const universal = parseToUniversal(content, 'srt');
const stats = getUniversalStats(universal);

console.log(stats);
// {
//   totalCues: 100,
//   totalDuration: 180000,
//   averageDuration: 1800,
//   firstCueStart: 1000,
//   lastCueEnd: 181000,
//   totalCharacters: 5420,
//   averageCharactersPerCue: 54.2
// }
```

### 6. Clone and Merge Operations

**v2.0**: New utilities for working with multiple subtitle files
```typescript
import { parseToUniversal, formatFromUniversal, cloneUniversal } from 'subconv-ts';

// Clone to avoid modifying original
const original = parseToUniversal(content, 'srt');
const copy = cloneUniversal(original);

// Merge multiple subtitle files
const sub1 = parseToUniversal(content1, 'srt');
const sub2 = parseToUniversal(content2, 'srt');

const merged = cloneUniversal(sub1);
merged.cues = [...sub1.cues, ...sub2.cues]
  .sort((a, b) => a.startTime - b.startTime);

// Re-index
merged.cues.forEach((cue, i) => cue.index = i + 1);
```

## Migration Examples

### Example 1: Time Shifting

**Before (v1.x)**:
```typescript
import { parseSrt, toSrt } from 'subconv-ts';

// Complex time string manipulation
const cues = parseSrt(content);
const shifted = cues.map(cue => {
  // Manually parse and adjust time strings - error prone!
  const newStartTime = adjustTimeString(cue.startTime, 2000);
  const newEndTime = adjustTimeString(cue.endTime, 2000);
  return { ...cue, startTime: newStartTime, endTime: newEndTime };
});
const output = toSrt(shifted);
```

**After (v2.0)**:
```typescript
import { parseToUniversal, formatFromUniversal } from 'subconv-ts';

// Simple millisecond-based manipulation
const universal = parseToUniversal(content, 'srt');
universal.cues.forEach(cue => {
  cue.startTime += 2000;
  cue.endTime += 2000;
});
const output = formatFromUniversal(universal, 'srt');
```

### Example 2: Multi-Format Export

**Before (v1.x)**:
```typescript
import { convert } from 'subconv-ts';

// Parse content multiple times
const vtt = convert(content, 'srt', 'vtt');
const ass = convert(content, 'srt', 'ass');
const json = convert(content, 'srt', 'json');
```

**After (v2.0)**:
```typescript
import { parseToUniversal, formatFromUniversal } from 'subconv-ts';

// Parse once, export to all formats
const universal = parseToUniversal(content, 'srt');
const vtt = formatFromUniversal(universal, 'vtt');
const ass = formatFromUniversal(universal, 'ass');
const json = formatFromUniversal(universal, 'json');
```

### Example 3: Filtering Subtitles

**Before (v1.x)**:
```typescript
import { parseSrt, toSrt } from 'subconv-ts';

// Manual duration calculation
const cues = parseSrt(content);
const filtered = cues.filter(cue => {
  const start = parseTime(cue.startTime);
  const end = parseTime(cue.endTime);
  const duration = end - start;
  return duration >= 1000; // Keep only cues >= 1 second
});
const output = toSrt(filtered);
```

**After (v2.0)**:
```typescript
import { parseToUniversal, formatFromUniversal } from 'subconv-ts';

// Duration is pre-calculated
const universal = parseToUniversal(content, 'srt');
universal.cues = universal.cues.filter(cue => cue.duration >= 1000);
const output = formatFromUniversal(universal, 'srt');
```

## New Type Definitions

v2.0 introduces comprehensive TypeScript types for the Universal format:

```typescript
import type {
  UniversalSubtitle,
  UniversalCue,
  SubtitleMetadata,
  StyleDefinition,
  ConversionOptions,
  CueLayout,
  InlineFormatting,
} from 'subconv-ts';
```

All v1.x types are still available:
```typescript
import type {
  SubtitleCue,
  SubtitleAnalysis,
  ValidationResult,
  SubtitleFormat,
} from 'subconv-ts';
```

## Conversion Options (New in v2.0)

The `convert()` function now accepts optional configuration:

```typescript
import { convert } from 'subconv-ts';

// Plain text only (strip formatting)
const plainSrt = convert(assContent, 'ass', 'srt', {
  plainTextOnly: true
});

// Preserve styles (if target format supports it)
const richAss = convert(content, 'srt', 'ass', {
  preserveStyles: true,
  preserveFormatting: true
});
```

## Performance

v2.0 performance is equal to or better than v1.x:

- **Same for single conversions**: The Universal JSON intermediate adds negligible overhead
- **Better for multiple conversions**: Parse once, convert to multiple formats
- **Better for manipulation**: Work with milliseconds instead of time string parsing

## Testing Your Migration

Run your existing test suite after upgrading:

```bash
npm install subconv-ts@^2.0.0
npm test
```

All v1.x code should work without changes. If you encounter any issues, please report them on GitHub.

## Recommended Migration Path

### Phase 1: Drop-in Replacement (No Code Changes)
1. Update package.json to `subconv-ts@^2.0.0`
2. Run tests - everything should work
3. Deploy with confidence

### Phase 2: Adopt New Features (Optional)
1. Identify code that manipulates subtitles
2. Refactor to use Universal JSON format
3. Take advantage of new utilities and type safety

### Phase 3: Leverage Metadata (Optional)
1. Use metadata preservation for advanced conversions
2. Preserve styles when converting between rich formats
3. Add metadata to your subtitle pipelines

## Getting Help

- 📖 [Architecture Documentation](ARCHITECTURE.md)
- 💡 [Examples Directory](examples/)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

## Summary

✅ **No breaking changes** - all v1.x code works in v2.0  
✅ **New capabilities** - Universal JSON, metadata, utilities  
✅ **Better performance** - for multi-format and manipulation use cases  
✅ **Future-proof** - easy to add new formats and features  

Upgrade today and enjoy the benefits of the Universal JSON architecture!