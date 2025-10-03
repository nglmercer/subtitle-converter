# Subconv-ts

A lightweight, dependency-free TypeScript library for converting subtitle files between different formats. Built with modern TypeScript and tested with Bun.

## Features

- 🔄 **Format Conversion**: Convert between SRT, VTT, ASS, and JSON formats
- 🔍 **Format Detection**: Automatic format detection with confidence scoring
- 📊 **Subtitle Analysis**: Get detailed statistics about subtitle files
- ✅ **Validation**: Validate subtitle structure and integrity
- 🎯 **TypeScript First**: Full TypeScript support with comprehensive type definitions
- 📦 **Zero Dependencies**: No external dependencies for maximum compatibility
- 🧪 **Well Tested**: Comprehensive test suite using Bun
- ⚡ **Lightweight**: Minimal footprint, maximum performance

## Supported Formats

| Format | Extension | Read | Write |
|--------|-----------|------|-------|
| SubRip | `.srt` | ✅ | ✅ |
| WebVTT | `.vtt` | ✅ | ✅ |
| Advanced SubStation | `.ass` | ✅ | ✅ |
| JSON | `.json` | ✅ | ✅ |

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
import { convert } from 'subs-converter';

// Convert SRT to VTT
const vttContent = convert(srtContent, 'srt', 'vtt');

// Convert with automatic format detection
const result = convert(subtitleContent, 'auto', 'json');
```

### Analyzing Subtitles

```typescript
import { analyze } from 'subs-converter';

const analysis = analyze(subtitleContent, 'srt');
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
import { validate } from 'subs-converter';

const validation = validate(subtitleContent, 'vtt');
console.log(validation);
// {
//   isValid: true,
//   errors: [],
//   warnings: []
// }
```

## API Reference

### Core Functions

#### `convert(content, fromFormat, toFormat)`

Converts subtitle content between different formats.

**Parameters:**
- `content` (string): The subtitle content to convert
- `fromFormat` (string): Source format (`'srt'`, `'vtt'`, `'ass'`, `'json'`, or `'auto'`)
- `toFormat` (string): Target format (`'srt'`, `'vtt'`, `'ass'`, or `'json'`)

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
import { parseSrt, toSrt, validateSrtStructure } from 'subs-converter';
import { parseVtt, toVtt, validateVttStructure } from 'subs-converter';
import { parseAss, toAss, validateAssStructure } from 'subs-converter';
import { parseJson, toJson, validateJsonStructure } from 'subs-converter';
```

## Type Definitions

### SubtitleCue

```typescript
interface SubtitleCue {
  startTime: string;  // HH:MM:SS.mmm format
  endTime: string;    // HH:MM:SS.mmm format
  text: string;       // Subtitle text (may contain newlines)
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
  type: 'INVALID_FORMAT' | 'OVERLAPPING_CUES' | 'INVALID_TIMECODE' | 'MISSING_CUE_NUMBER' | 'EMPTY_CUE';
  message: string;
  lineNumber?: number;
  cueIndex?: number;
}

interface ValidationWarning {
  type: 'SHORT_DURATION' | 'LONG_DURATION' | 'GAP_BETWEEN_CUES' | 'EXCESSIVE_LINES';
  message: string;
  lineNumber?: number;
  cueIndex?: number;
}
```

## Examples

### Working with Different Formats

```typescript
import { convert, detectFormatSimple } from 'subs-converter';

// Read subtitle file
const content = fs.readFileSync('movie.srt', 'utf8');

// Auto-detect format
const format = detectFormatSimple(content);
console.log(`Detected format: ${format}`); // "srt"

// Convert to different formats
const vttContent = convert(content, 'srt', 'vtt');
const jsonContent = convert(content, 'srt', 'json');
const assContent = convert(content, 'srt', 'ass');

// Save converted files
fs.writeFileSync('movie.vtt', vttContent);
fs.writeFileSync('movie.json', jsonContent);
fs.writeFileSync('movie.ass', assContent);
```

### Batch Processing

```typescript
import { convert, analyze } from 'subs-converter';

const files = ['movie1.srt', 'movie2.vtt', 'movie3.ass'];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const analysis = analyze(content, 'auto');
  
  console.log(`File: ${file}`);
  console.log(`Total cues: ${analysis.totalCues}`);
  console.log(`Duration: ${analysis.totalDuration / 1000}s`);
  console.log(`Average duration: ${analysis.averageDuration}ms`);
  console.log('---');
});
```

### Error Handling

```typescript
import { convert, validate } from 'subs-converter';

try {
  // Validate first
  const validation = validate(content, 'auto');
  
  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors);
    console.warn('Validation warnings:', validation.warnings);
    return;
  }
  
  // Then convert
  const result = convert(content, 'auto', 'json');
  console.log('Conversion successful!');
  
} catch (error) {
  console.error('Conversion failed:', error.message);
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
│   └── json.ts      # JSON format support
├── utils/           # Utility functions
│   ├── formatDetector.ts  # Format detection logic
│   └── time.ts      # Time parsing utilities
├── types.ts         # TypeScript type definitions
└── index.ts         # Main entry point
```

## Browser Support

This library is designed to work in both Node.js and browser environments. The zero-dependency approach ensures maximum compatibility across different JavaScript runtimes.

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Support for SRT, VTT, ASS, and JSON formats
- Format detection and conversion
- Subtitle analysis and validation
- TypeScript support
- Comprehensive test suite