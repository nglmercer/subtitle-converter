# API Reference

Complete API reference for subs-converter.

## Core Functions

### convert()

Converts subtitles between different formats using the Universal JSON intermediate format.

```typescript
function convert(
  content: string,
  fromFormat: SubtitleFormat | "auto",
  toFormat: SubtitleFormat,
  options?: ConversionOptions
): string
```

**Parameters:**
- `content` - Subtitle content as string
- `fromFormat` - Source format (`'srt'`, `'vtt'`, `'ass'`, `'json'`, `'csv'`, or `'auto'`)
- `toFormat` - Target format
- `options` - Optional conversion settings

**Returns:** Converted subtitle content as string

**Example:**
```typescript
const vtt = convert(srtContent, 'srt', 'vtt');
const json = convert(unknownContent, 'auto', 'json', { plainTextOnly: true });
```

---

### parseToUniversal()

Parses any subtitle format into the Universal JSON format.

```typescript
function parseToUniversal(
  content: string,
  format: SubtitleFormat | "auto" = "auto"
): UniversalSubtitle
```

**Parameters:**
- `content` - Subtitle content as string
- `format` - Format of the content (defaults to `'auto'`)

**Returns:** `UniversalSubtitle` object

**Example:**
```typescript
const universal = parseToUniversal(srtContent, 'srt');
console.log(universal.cues.length); // Number of cues
console.log(universal.metadata.title);
```

---

### formatFromUniversal()

Formats Universal JSON into any subtitle format.

```typescript
function formatFromUniversal(
  universal: UniversalSubtitle,
  format: SubtitleFormat,
  options?: ConversionOptions
): string
```

**Parameters:**
- `universal` - UniversalSubtitle object
- `format` - Target format
- `options` - Optional conversion settings

**Returns:** Formatted subtitle content

**Example:**
```typescript
const universal = parseToUniversal(content, 'srt');
const vttContent = formatFromUniversal(universal, 'vtt');
```

---

## Analysis & Validation

### analyze()

Analyzes subtitle content and provides detailed statistics.

```typescript
function analyze(
  content: string,
  format: SubtitleFormat | "auto" = "auto"
): SubtitleAnalysis
```

**Returns:** `SubtitleAnalysis` object with properties:
- `totalCues` - Total number of subtitles
- `totalDuration` - Total duration in milliseconds
- `startTime` - Start time string (HH:MM:SS.mmm)
- `endTime` - End time string
- `averageDuration` - Average cue duration in milliseconds
- `shortestCue` - Shortest cue with text and duration
- `longestCue` - Longest cue with text and duration
- `totalLines` - Total text lines
- `averageLinesPerCue` - Average lines per cue

**Example:**
```typescript
const stats = analyze(vttContent, 'vtt');
console.log(`Duration: ${stats.totalDuration}ms`);
console.log(`Average: ${stats.averageDuration}ms per cue`);
```

---

### validate()

Validates subtitle structure and integrity.

```typescript
function validate(
  content: string,
  format: SubtitleFormat | "auto" = "auto"
): ValidationResult
```

**Returns:** `ValidationResult` object with properties:
- `isValid` - Boolean indicating validity
- `errors` - Array of `ValidationError` objects
- `warnings` - Array of `ValidationWarning` objects

**Error Types:**
- `INVALID_FORMAT` - Format detection failed
- `OVERLAPPING_CUES` - Cues overlap in time
- `INVALID_TIMECODE` - Invalid time values
- `MISSING_CUE_NUMBER` - Missing cue index
- `EMPTY_CUE` - Empty text content

**Example:**
```typescript
const result = validate(srtContent, 'srt');
if (!result.isValid) {
  console.error(result.errors);
}
```

---

## Format Detection

### detectFormat()

Detects subtitle format with confidence scoring.

```typescript
function detectFormat(content: string): FormatDetectionResult
```

**Returns:** `FormatDetectionResult` with:
- `format` - Detected format or null
- `confidence` - Confidence score (0-1)

---

### detectFormatSimple()

Simple format detection returning just the format.

```typescript
function detectFormatSimple(content: string): SubtitleFormat | null
```

---

### detectFormatWithConfidence()

Detailed format detection with confidence scores.

```typescript
function detectFormatWithConfidence(
  content: string
): FormatDetectionResult[]
```

Returns array of results sorted by confidence.

---

## Rendering Functions

### renderHtml()

Renders subtitles as HTML for display.

```typescript
function renderHtml(
  universal: UniversalSubtitle,
  options?: RenderOptions
): string
```

**Options:**
```typescript
interface RenderOptions {
  usePlainText?: boolean;        // Use plain text (default: true)
  processAssOverrides?: boolean;  // Process ASS overrides (default: false)
  containerTag?: string;         // Container tag (default: "div")
  cueTag?: string;              // Cue tag (default: "div")
  containerClass?: string;      // Container class (default: "subconv-container")
  cueClass?: string;            // Cue class (default: "subconv-cue")
  includeMetadata?: boolean;    // Include metadata (default: false)
  timeFormat?: "ms" | "srt" | "vtt"; // Time format (default: "ms")
  dataAttributes?: Record<string, string | number | boolean>;
  target?: "raw" | "browser" | "slint"; // Style target
  compact?: boolean;           // Compact output (default: true)
}
```

**Example:**
```html
${renderHtml(universal, { containerClass: 'subtitles' })}
```

Output:
```html
<div class="subtitles">
  <div class="subconv-cue" data-index="1" data-start="1000" data-end="4000">
    <span class="subconv-text">Hello</span>
  </div>
</div>
```

---

### renderJson()

Renders subtitles as JSON.

```typescript
function renderJson(
  universal: UniversalSubtitle,
  options?: RenderOptions
): string
```

**Options:**
```typescript
interface RenderOptions {
  usePlainText?: boolean;   // Use plain text (default: true)
  includeMetadata?: boolean;
  target?: "raw" | "browser" | "slint";
  compact?: boolean;       // Compact output (default: true)
}
```

---

### renderWithAdapter()

Render using a custom adapter.

```typescript
function renderWithAdapter(
  universal: UniversalSubtitle,
  adapter: RendererAdapter,
  options?: RenderOptions
): string
```

**Example:**
```typescript
const adapter: RendererAdapter = {
  render(universal, options) {
    return universal.cues.map(c => `<p>${c.text}</p>`).join('');
  }
};

const html = renderWithAdapter(universal, adapter);
```

---

## Type Exports

### SubtitleFormat

```typescript
type SubtitleFormat = "srt" | "vtt" | "ass" | "json" | "csv";
```

### UniversalSubtitle

```typescript
interface UniversalSubtitle {
  version: string;
  sourceFormat: SubtitleFormat;
  metadata: SubtitleMetadata;
  styles: StyleDefinition[];
  cues: UniversalCue[];
}
```

### UniversalCue

```typescript
interface UniversalCue {
  index: number;
  startTime: number;    // milliseconds
  endTime: number;      // milliseconds
  duration: number;   // milliseconds (computed)
  text: string;       // plain text
  content: string;    // formatted content
  style?: string;
  identifier?: string;
  layout?: CueLayout;
  formatting?: InlineFormatting[];
  formatSpecific?: {
    ass?: {};
    vtt?: {};
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
    ass?: {};
    vtt?: {};
  };
}
```

### StyleDefinition

```typescript
interface StyleDefinition {
  name: string;
  fontName?: string;
  fontSize?: number;
  primaryColor?: string;
  secondaryColor?: string;
  outlineColor?: string;
  backColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeOut?: boolean;
  scaleX?: number;
  scaleY?: number;
  spacing?: number;
  angle?: number;
  borderStyle?: number;
  outline?: number;
  shadow?: number;
  alignment?: number;
  marginL?: number;
  marginR?: number;
  marginV?: number;
}
```

### ConversionOptions

```typescript
interface ConversionOptions {
  preserveStyles?: boolean;
  preserveFormatting?: boolean;
  plainTextOnly?: boolean;
  defaultStyle?: string;
  includeMetadata?: boolean;
  formatSpecific?: Record<string, any>;
}
```

---

## Utility Functions

### timeStringToMs()

Converts time string to milliseconds.

```typescript
function timeStringToMs(time: string, format?: "srt" | "vtt"): number
```

### msToTimeString()

Converts milliseconds to time string.

```typescript
function msToTimeString(ms: number, format?: "srt" | "vtt"): string
```

### cloneUniversal()

Creates a deep clone of UniversalSubtitle.

```typescript
function cloneUniversal(universal: UniversalSubtitle): UniversalSubtitle
```

---

## Format-Specific Exports

The library also exports format-specific parsers and formatters:

```typescript
import {
  parseSrt, toSrt, validateSrtStructure,
  parseVtt, toVtt, validateVttStructure,
  parseAss, toAss, validateAssStructure,
  parseJson, toJson, validateJsonStructure,
  parseCsv, toCsv, validateCsvStructure,
} from 'subs-converter';
```

These can be used directly for format-specific operations.