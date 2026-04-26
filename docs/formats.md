# Supported Formats

The library supports converting between SRT, VTT, ASS, JSON, and CSV subtitle formats.

## Format Support Matrix

| Format               | Extension | Read | Write | Styles | Metadata |
|---------------------|-----------|------|-------|--------|----------|
| SubRip              | `.srt`    | ✅   | ✅    | ❌     | Limited  |
| WebVTT              | `.vtt`    | ✅   | ✅    | ✅     | ✅       |
| Advanced SubStation | `.ass`    | ✅   | ✅    | ✅     | ✅       |
| JSON                | `.json`   | ✅   | ✅    | ✅     | ✅       |
| CSV (Timed Brackets) | `.csv`    | ✅   | ✅    | ❌     | ❌       |

## SubRip (SRT)

The most common subtitle format, widely supported by media players.

### Format Structure

```
1
00:00:01,000 --> 00:00:04,000
First subtitle text

2
00:00:05,000 --> 00:00:08,000
Second subtitle text
multiline
```

- **Time format:** `HH:MM:SS,mmm` (comma as millisecond separator)
- **Cue number:** Sequential integer starting at 1
- **Line breaks:** Blank line between cues

### Conversion Options

```typescript
import { convert } from 'subs-converter';

const srt = `1
00:00:01,000 --> 00:00:04,000
Hello, World!
`;

const vtt = convert(srt, 'srt', 'vtt');
// Output:
// WEBVTT
//
// 1
// 00:00:01.000 --> 00:00:04.000
// Hello, World!
```

### Features Preserved

- Timing accuracy (milliseconds)
- Multi-line text
- Basic cues

### Features Not Preserved

- Styles (SRT doesn't support styles)
- Positioning
- Formatting tags

---

## WebVTT (VTT)

Modern web subtitle format with styling and positioning support.

### Format Structure

```
WEBVTT

REGION: id=foo width=50% lines=3 regionanchor=0%,100% viewportanchor=0%,100%

NOTE This is a note

1
00:00:01.000 --> 00:00:04.000
First subtitle

2
00:00:05.000 --> 00:00:08.000 line:80% position:20%
Second subtitle with position
```

- **Time format:** `HH:MM:SS.mmm` (period as millisecond separator)
- **Header:** `WEBVTT` required
- **Regions:** Optional positioning regions
- **Cue settings:** `line`, `position`, `size`, `align`, `region`

### Cue Settings

WebVTT supports various cue settings:

```
00:00:01.000 --> 00:00:04.000 line:10% position:50% size:80%
```

| Setting | Description | Values |
|---------|-------------|--------|
| `line` | Vertical position | `0-100%` or line number |
| `position` | Horizontal position | `0-100%` |
| `size` | Cue width | `0-100%` |
| `align` | Text alignment | `start`, `center`, `end` |
| `region` | Region ID | Region identifier |

### Conversion

```typescript
import { convert, parseToUniversal, formatFromUniversal } from 'subs-converter';

// Convert SRT to VTT
const vtt = convert(srtContent, 'srt', 'vtt');

// Work with VTT specific features
const universal = parseToUniversal(vttContent, 'vtt');

// Access VTT specific data
universal.cues[0].formatSpecific?.vtt;
// { region?: string, position?: string, line?: string }
```

### Features Preserved

- All SRT features
- Cue settings (position, line, size, align)
- Regions
- Notes

---

## Advanced SubStation Alpha (ASS/SSA)

Feature-rich subtitle format with comprehensive styling.

### Format Structure

```
[Script Info]
Title: My Movie
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1
Style: BoldRed,Arial,48,&H0000FF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,First subtitle
Dialogue: 0,0:00:05.00,0:00:08.00,BoldRed,,0,0,0,,{\pos(100,100)}Colored text
```

### Style Format

ASS styles contain extensive formatting information:

| Parameter | Description |
|-----------|-------------|
| `Name` | Style name |
| `Fontname` | Font family |
| `Fontsize` | Font size |
| `PrimaryColour` | Text color |
| `SecondaryColour` | Secondary color (Karaoke) |
| `OutlineColour` | Outline color |
| `BackColour` | Shadow/background color |
| `Bold` | Bold flag |
| `Italic` | Italic flag |
| `Alignment` | Numpad alignment (1-9) |

### Alignment Values

```
7 8 9    Top-Left, Top-Center, Top-Right
4 5 6    Mid-Left, Center,    Mid-Right  
1 2 3    Bot-Left, Bot-Center, Bot-Right
```

### Conversion

```typescript
import { convert, parseToUniversal } from 'subs-converter';

// Convert SRT to ASS with styles
const ass = convert(srtContent, 'srt', 'ass');

// Convert ASS to VTT
const vtt = convert(assContent, 'ass', 'vtt');

// Access styles
const universal = parseToUniversal(assContent, 'ass');
const styles = universal.styles;
// [{ name: "Default", fontName: "Arial", primaryColor: "#FFFFFF", ... }]
```

### Inline Overrides

ASS supports inline formatting overrides:

```ass
Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,{\c&HFF0000}Red text
{\i\fs48}Large italic
{\pos(100,200)}Positioned
```

| Override | Description |
|----------|-------------|
| `{\c&HFF0000}` | Color (BGR hex) |
| `{\fs48}` | Font size |
| `{\b1}` | Bold |
| `{\i1}` | Italic |
| `{\u1}` | Underline |
| `{\pos(x,y)}` | Position |
| `{\an2}` | Alignment |

### Features Preserved

- All style definitions
- Inline formatting overrides
- Positioning
- Effects
- Layers

---

## JSON Format

The library's native format for programmatic subtitle manipulation.

### Universal JSON

```json
{
  "version": "1.0.0",
  "sourceFormat": "vtt",
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
      "text": "Hello",
      "content": "Hello",
      "style": "Default"
    }
  ]
}
```

### Compact Format

```json
{"v":"1.0.0","f":"vtt","s":[{"n":"Default","fn":"Arial","fs":24}],"c":[{"i":1,"s":1000,"e":4000,"t":"Hello"}]}
```

### Conversion

```typescript
import { convert } from 'subs-converter';

// Convert SRT to JSON
const json = convert(srtContent, 'srt', 'json');

// Convert JSON to ASS
const ass = convert(json, 'json', 'ass');
```

---

## CSV Format

Timed brackets format compatible with certain subtitle tools.

### Format Structure

```csv
Index,StartTime,EndTime,Text
1,00:00:01.000,00:00:04.000,First subtitle
2,00:00:05.000,00:00:08.000,"Multi line
subtitle"
```

### Time Format

Supports multiple time formats:
- `HH:MM:SS.mmm` (VTT style)
- `HH:MM:SS,mmm` (SRT style)
- `HH:MM:SS` (seconds only)

### Conversion

```typescript
import { convert } from 'subs-converter';

// Convert SRT to CSV
const csv = convert(srtContent, 'srt', 'csv');

// Convert CSV to VTT
const vtt = convert(csv, 'csv', 'vtt');
```

---

## Format Detection

The library automatically detects input formats:

```typescript
import { detectFormat, detectFormatSimple } from 'subs-converter';

// Simple detection
const format = detectFormatSimple(content);
// Returns: "srt" | "vtt" | "ass" | "json" | "csv" | null

// Detection with confidence
const result = detectFormat(content);
// { format: "srt", confidence: 0.95 }
```

Detection uses heuristics:
- **SRT:** Cue numbering (`1\r\n00:00:00,000`)
- **VTT:** `WEBVTT` header
- **ASS:** `[Script Info]` or `[V4+ Styles]` sections
- **JSON:** Valid JSON with `cues` array
- **CSV:** Header row with time columns

---

## Format-Specific Operations

### Working with Styles

```typescript
const universal = parseToUniversal(assContent, 'ass');

// Access styles
const defaultStyle = universal.styles.find(s => s.name === 'Default');

// Create new style
universal.styles.push({
  name: 'Custom',
  fontName: 'Roboto',
  fontSize: 32,
  primaryColor: '#FFFF00',
  bold: true,
});
```

### Working with Positioning

```typescript
// VTT positioning
universal.cues[0].formatSpecific = {
  vtt: {
    position: '10%',
    line: '90%',
    align: 'center'
  }
};

// ASS positioning
universal.cues[0].formatSpecific = {
  ass: {
    marginL: 100,
    marginR: 50,
    marginV: 10
  }
};
```

### Working with Metadata

```typescript
// Update metadata
universal.metadata.title = 'New Title';
universal.metadata.language = 'en';

// ASS specific
universal.metadata.formatSpecific = {
  ass: {
    scriptType: 'v4.00+',
    playResX: 1920,
    playResY: 1080
  }
};
```