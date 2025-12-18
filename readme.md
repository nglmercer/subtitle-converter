# Subconv-ts

A lightweight, dependency-free TypeScript library for converting subtitle files between different formats. Built with modern TypeScript and tested with Bun.

## Features

- 🔄 **Format Conversion**: Convert between SRT, VTT, ASS, JSON, and CSV formats
- 🎯 **Universal JSON Architecture**: All conversions use a lossless intermediate format
- 🔍 **Format Detection**: Automatic format detection with confidence scoring
- 📊 **Subtitle Analysis**: Get detailed statistics about subtitle files
- ✅ **Validation**: Validate subtitle structure and integrity
- 💾 **Metadata Preservation**: Preserve styles, formatting, and format-specific properties
- 🎨 **Programmatic Manipulation**: Modify subtitles with millisecond precision
- 🔄 **Round-Trip Conversions**: Lossless conversions maintain all original information
- 🎯 **TypeScript First**: Full TypeScript support with comprehensive type definitions
- 📦 **Zero Dependencies**: No external dependencies for maximum compatibility
- 🧪 **Well Tested**: Comprehensive test suite using Bun
- ⚡ **Lightweight**: Minimal footprint, maximum performance

## Universal JSON Architecture

**subconv-ts** uses a **Universal JSON intermediate format** for all subtitle conversions. This means:

- **One conversion path**: ANY FORMAT → Universal JSON → ANY FORMAT
- **Lossless conversions**: All metadata, styles, and formatting are preserved
- **Easy extensibility**: Adding new formats only requires implementing to/from Universal JSON
- **Programmatic access**: Inspect and manipulate subtitles with full type safety

### How It Works

```
┌─────────────────────────────────────────────┐
│  SRT, VTT, ASS, JSON  → Universal JSON      │
│                                              │
│  Universal JSON stores:                     │
│  • Cues with millisecond precision          │
│  • Metadata (title, language, author)       │
│  • Styles and formatting                    │
│  • Format-specific properties               │
│                                              │
│  Universal JSON → SRT, VTT, ASS, JSON       │
└─────────────────────────────────────────────┘
```

📖 **[Read the full architecture documentation](ARCHITECTURE.md)**

## Supported Formats

| Format               | Extension | Read | Write |
| -------------------- | --------- | ---- | ----- |
| SubRip               | `.srt`    | ✅   | ✅    |
| WebVTT               | `.vtt`    | ✅   | ✅    |
| Advanced SubStation  | `.ass`    | ✅   | ✅    |
| JSON                 | `.json`   | ✅   | ✅    |
| CSV (Timed Brackets) | `.csv`    | ✅   | ✅    |

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

```typescript
import { convert } from "subs-converter";

// Convert SRT to VTT (uses Universal JSON internally)
const vttContent = convert(srtContent, "srt", "vtt");

// Convert with automatic format detection
const result = convert(subtitleContent, "auto", "json");

// With conversion options
const plainText = convert(content, "ass", "srt", {
  plainTextOnly: true, // Strip all formatting
});
```

### Working with Universal Format

```typescript
import { parseToUniversal, formatFromUniversal } from "subs-converter";

// Parse any format to Universal JSON
const universal = parseToUniversal(srtContent, "srt");

// Inspect the universal format
console.log("Total cues:", universal.cues.length);
console.log("Metadata:", universal.metadata);
console.log("First cue start:", universal.cues[0].startTime, "ms");

// Modify subtitles programmatically
universal.cues.forEach((cue) => {
  // Shift all subtitles by 2 seconds
  cue.startTime += 2000;
  cue.endTime += 2000;
});

// Convert to any format
const vttOutput = formatFromUniversal(universal, "vtt");
const assOutput = formatFromUniversal(universal, "ass");
const jsonOutput = formatFromUniversal(universal, "json");
```

### Analyzing Subtitles

```typescript
import { analyze } from "subs-converter";

const analysis = analyze(subtitleContent, "srt");
console.log(analysis);
// {
//   totalCues: 245,
//   totalDuration: 5400000,
//   startTime: '00:00:01.000',
//   endTime: '01:30:00.000',
//   averageDuration: 22040,
//   shortestCue: { startTime: '00:05:23.000', endTime: '00:05:24.500', text: '...', duration: 1500 },
//   longestCue: { startTime: '00:45:12.000', endTime: '00:45:18.000', text: '...', duration: 6000 },
//   totalLines: 490,
//   averageLinesPerCue: 2
// }
```

### Validating Subtitles

```typescript
import { validate } from "subs-converter";

const validation = validate(subtitleContent, "vtt");
console.log(validation);
// {
//   isValid: true,
//   errors: [],
//   warnings: []
// }
```

## API Reference

### Core Functions

#### `convert(content, fromFormat, toFormat, options?)`

Converts subtitle content between different formats.

**Parameters:**

- `content` (string): The subtitle content to convert
- `fromFormat` (string): Source format (`'srt'`, `'vtt'`, `'ass'`, `'json'`, or `'auto'`)
- `toFormat` (string): Target format (`'srt'`, `'vtt'`, `'ass'`, or `'json'`)
- `options` (ConversionOptions, optional): Conversion settings
  - `plainTextOnly`: Strip all formatting
  - `preserveStyles`: Preserve style definitions (if target supports it)
  - `preserveFormatting`: Preserve inline formatting tags
  - `includeMetadata`: Include metadata in output

**Returns:** Converted subtitle content (string)

**Throws:** Error if format detection fails or conversion is not supported

#### `analyze(content, format?)`

Analyzes subtitle content and provides detailed statistics.

**Parameters:**

- `content` (string): The subtitle content to analyze
- `format` (string, optional): Format (`'srt'`, `'vtt'`, `'ass'`, `'json'`, or `'auto'`). Defaults to `'auto'`

**Returns:** [`SubtitleAnalysis`](#subtitleanalysis) object

#### `validate(content, format?)`

Validates subtitle content structure and integrity.

**Parameters:**

- `content` (string): The subtitle content to validate
- `format` (string, optional): Format (`'srt'`, `'vtt'`, `'ass'`, `'json'`, or `'auto'`). Defaults to `'auto'`

**Returns:** [`ValidationResult`](#validationresult) object

### Universal Format Functions

#### `parseToUniversal(content, format?)`

Parses any subtitle format into Universal JSON format.

**Parameters:**

- `content` (string): The subtitle content to parse
- `format` (string, optional): Format (`'srt'`, `'vtt'`, `'ass'`, `'json'`, or `'auto'`). Defaults to `'auto'`

**Returns:** `UniversalSubtitle` object

#### `formatFromUniversal(universal, format, options?)`

Formats Universal JSON into any subtitle format.

**Parameters:**

- `universal` (UniversalSubtitle): The universal subtitle object
- `format` (string): Target format (`'srt'`, `'vtt'`, `'ass'`, or `'json'`)
- `options` (ConversionOptions, optional): Conversion settings

**Returns:** Formatted subtitle content (string)

#### `universalToJson(universal, pretty?)`

Converts Universal format to JSON string.

**Parameters:**

- `universal` (UniversalSubtitle): The universal subtitle object
- `pretty` (boolean, optional): Pretty-print JSON. Defaults to `true`

**Returns:** JSON string

#### `jsonToUniversal(jsonContent)`

Parses JSON string to Universal format.

**Parameters:**

- `jsonContent` (string): JSON content

**Returns:** `UniversalSubtitle` object

#### `getUniversalStats(universal)`

Gets statistics from Universal format.

**Parameters:**

- `universal` (UniversalSubtitle): The universal subtitle object

**Returns:** Statistics object with duration, character counts, etc.

### Utility Functions

#### `timeStringToMs(timeString)`

Converts time string to milliseconds.

**Parameters:**

- `timeString` (string): Time in HH:MM:SS,mmm or HH:MM:SS.mmm format

**Returns:** Time in milliseconds (number)

#### `msToTimeString(ms, format?)`

Converts milliseconds to time string.

**Parameters:**

- `ms` (number): Time in milliseconds
- `format` (string, optional): Output format (`'srt'` or `'vtt'`). Defaults to `'srt'`

**Returns:** Time string in HH:MM:SS,mmm (SRT) or HH:MM:SS.mmm (VTT) format

### Format Detection

#### `detectFormatSimple(content)`

Simple format detection that returns the most likely format.

**Parameters:**

- `content` (string): The subtitle content to analyze

**Returns:** Format string or `null` if format cannot be detected

#### `detectFormatWithConfidence(content)`

Advanced format detection with confidence scoring.

**Parameters:**

- `content` (string): The subtitle content to analyze

**Returns:** Object with `format` and `confidence` properties

### Format-Specific Functions

The library also exports format-specific functions for advanced use cases:

```typescript
import { parseSrt, toSrt, validateSrtStructure } from "subs-converter";
import { parseVtt, toVtt, validateVttStructure } from "subs-converter";
import { parseAss, toAss, validateAssStructure } from "subs-converter";
import { parseJson, toJson, validateJsonStructure } from "subs-converter";
```

## Type Definitions

### UniversalSubtitle

```typescript
interface UniversalSubtitle {
  version: string; // Format version (e.g., "1.0.0")
  sourceFormat: SubtitleFormat; // Original format
  metadata: SubtitleMetadata; // Global metadata
  styles: StyleDefinition[]; // Style definitions
  cues: UniversalCue[]; // Subtitle cues
}
```

### UniversalCue

```typescript
interface UniversalCue {
  index: number; // Sequence number
  startTime: number; // Start time in milliseconds
  endTime: number; // End time in milliseconds
  duration: number; // Duration in milliseconds
  text: string; // Plain text (no formatting)
  content: string; // Formatted content with tags
  style?: string; // Style reference
  identifier?: string; // Cue ID (for VTT)
  layout?: CueLayout; // Position/alignment
  formatting?: InlineFormatting[]; // Inline formatting spans
  formatSpecific?: {
    // Format-specific properties
    ass?: { layer?: number; effect?: string /* ... */ };
    vtt?: { region?: string; vertical?: string /* ... */ };
  };
}
```

### SubtitleMetadata

```typescript
interface SubtitleMetadata {
  title?: string;
  language?: string;
  author?: string;
  description?: string;
  formatSpecific?: {
    ass?: { scriptType?: string; playResX?: number /* ... */ };
    vtt?: { regions?: VttRegion[]; notes?: string[] };
    [format: string]: any;
  };
}
```

### SubtitleCue (Legacy)

```typescript
interface SubtitleCue {
  startTime: string; // HH:MM:SS.mmm format
  endTime: string; // HH:MM:SS.mmm format
  text: string; // Subtitle text (may contain newlines)
}
```

### SubtitleAnalysis

```typescript
interface SubtitleAnalysis {
  totalCues: number;
  totalDuration: number;
  startTime: string;
  endTime: string;
  averageDuration: number;
  shortestCue: SubtitleCue & { duration: number };
  longestCue: SubtitleCue & { duration: number };
  totalLines: number;
  averageLinesPerCue: number;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type:
    | "INVALID_FORMAT"
    | "OVERLAPPING_CUES"
    | "INVALID_TIMECODE"
    | "MISSING_CUE_NUMBER"
    | "EMPTY_CUE";
  message: string;
  lineNumber?: number;
  cueIndex?: number;
}

interface ValidationWarning {
  type:
    | "SHORT_DURATION"
    | "LONG_DURATION"
    | "GAP_BETWEEN_CUES"
    | "EXCESSIVE_LINES";
  message: string;
  lineNumber?: number;
  cueIndex?: number;
}
```

## Examples

### Working with Different Formats

```typescript
import { convert, detectFormatSimple } from "subs-converter";

// Read subtitle file
const content = fs.readFileSync("movie.srt", "utf8");

// Auto-detect format
const format = detectFormatSimple(content);
console.log(`Detected format: ${format}`); // "srt"

// Convert to different formats
const vttContent = convert(content, "srt", "vtt");
const jsonContent = convert(content, "srt", "json");
const assContent = convert(content, "srt", "ass");

// Save converted files
fs.writeFileSync("movie.vtt", vttContent);
fs.writeFileSync("movie.json", jsonContent);
fs.writeFileSync("movie.ass", assContent);
```

### Using Universal Format for Manipulation

```typescript
import { parseToUniversal, formatFromUniversal } from "subs-converter";

const content = fs.readFileSync("movie.srt", "utf8");

// Parse to universal format
const universal = parseToUniversal(content, "srt");

// Add metadata
universal.metadata.title = "My Movie - English Subtitles";
universal.metadata.language = "en";
universal.metadata.author = "Translation Team";

// Shift all subtitles by 5 seconds
universal.cues.forEach((cue) => {
  cue.startTime += 5000; // milliseconds
  cue.endTime += 5000;
});

// Filter out short subtitles
universal.cues = universal.cues.filter((cue) => cue.duration >= 1000);

// Convert to multiple formats from same universal object
fs.writeFileSync("movie-delayed.srt", formatFromUniversal(universal, "srt"));
fs.writeFileSync("movie-delayed.vtt", formatFromUniversal(universal, "vtt"));
fs.writeFileSync("movie-delayed.ass", formatFromUniversal(universal, "ass"));
```

### Merging Subtitle Files

```typescript
import {
  parseToUniversal,
  formatFromUniversal,
  cloneUniversal,
} from "subs-converter";

// Parse multiple subtitle files
const universal1 = parseToUniversal(
  fs.readFileSync("part1.srt", "utf8"),
  "srt"
);
const universal2 = parseToUniversal(
  fs.readFileSync("part2.srt", "utf8"),
  "srt"
);

// Merge cues
const merged = cloneUniversal(universal1);
merged.cues = [...universal1.cues, ...universal2.cues].sort(
  (a, b) => a.startTime - b.startTime
);

// Re-index cues
merged.cues.forEach((cue, index) => {
  cue.index = index + 1;
});

// Save merged file
fs.writeFileSync("merged.srt", formatFromUniversal(merged, "srt"));
```

### Batch Processing

```typescript
import { convert, analyze } from "subs-converter";

const files = ["movie1.srt", "movie2.vtt", "movie3.ass"];

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const analysis = analyze(content, "auto");

  console.log(`File: ${file}`);
  console.log(`Total cues: ${analysis.totalCues}`);
  console.log(`Duration: ${analysis.totalDuration / 1000}s`);
  console.log(`Average duration: ${analysis.averageDuration}ms`);
  console.log("---");
});
```

### Error Handling

```typescript
import { convert, validate } from "subs-converter";

try {
  // Validate first
  const validation = validate(content, "auto");

  if (!validation.isValid) {
    console.error("Validation errors:", validation.errors);
    console.warn("Validation warnings:", validation.warnings);
    return;
  }

  // Then convert
  const result = convert(content, "auto", "json");
  console.log("Conversion successful!");
} catch (error) {
  console.error("Conversion failed:", error.message);
}
```

## Development

### Building the Project

```bash
bun run build
```

### Running Tests

```bash
bun test
```

### Project Structure

```
src/
├── formats/          # Format-specific parsers and generators
│   ├── srt.ts       # SRT format support
│   ├── vtt.ts       # WebVTT format support
│   ├── ass.ts       # ASS format support
│   ├── json.ts      # JSON format support (legacy)
│   └── universal.ts # Universal JSON format core
├── utils/           # Utility functions
│   ├── formatDetector.ts  # Format detection logic
│   └── time.ts      # Time parsing utilities
├── types.ts         # TypeScript type definitions
└── index.ts         # Main entry point
```

### Examples

Check out the [examples directory](examples/) for comprehensive usage examples:

- `convertSub.ts` - Basic format conversion examples
- `universalFormat.ts` - Advanced Universal JSON format usage

## Browser Support

This library is designed to work in both Node.js and browser environments. The zero-dependency approach ensures maximum compatibility across different JavaScript runtimes.

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v2.1.0 (Current)

- **CSV Format Support**: Added support for bracket-timed CSV files used in data extraction.
- **Extraction Script**: New CLI tool to extract raw data from CSV files and convert to Universal JSON.
- **Improved Parsing**: Enhanced format detection and robustness for messy CSV files.

### v2.0.0

- **Universal JSON Architecture**: All conversions now use a lossless intermediate format
- **Metadata Preservation**: Preserve styles, formatting, and format-specific properties
- **Programmatic Manipulation**: New APIs for manipulating subtitles with millisecond precision
- **Enhanced Type Definitions**: Complete TypeScript types for Universal format
- **New Functions**: `parseToUniversal`, `formatFromUniversal`, `universalToJson`, `jsonToUniversal`
- **Utility Functions**: `timeStringToMs`, `msToTimeString`, `getUniversalStats`, `cloneUniversal`
- **Round-Trip Support**: Lossless conversions maintain all original information
- **Improved Documentation**: Comprehensive architecture documentation

### v1.0.0

- Initial release
- Support for SRT, VTT, ASS, and JSON formats
- Format detection and conversion
- Subtitle analysis and validation
- TypeScript support
- Comprehensive test suite
