# Quick Start Guide: Universal JSON Architecture

## 📊 Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBTITLE CONVERSION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

   INPUT FILE                UNIVERSAL JSON              OUTPUT FILE
   ──────────                ──────────────              ───────────

    ┌─────┐                                              ┌─────┐
    │ SRT │──┐                                      ┌───│ SRT │
    └─────┘  │                                      │   └─────┘
             │         ┌──────────────┐             │
    ┌─────┐  │         │              │             │   ┌─────┐
    │ VTT │──┼────────▶│  UNIVERSAL   │────────────┼──▶│ VTT │
    └─────┘  │         │     JSON     │             │   └─────┘
             │         │              │             │
    ┌─────┐  │         │  • Metadata  │             │   ┌─────┐
    │ ASS │──┼────────▶│  • Styles    │────────────┼──▶│ ASS │
    └─────┘  │         │  • Cues (ms) │             │   └─────┘
             │         │  • Format-   │             │
    ┌─────┐  │         │    Specific  │             │   ┌─────┐
    │JSON │──┘         └──────────────┘             └───│JSON │
    └─────┘                   ▲                          └─────┘
                              │
                              │
                    ┌─────────┴──────────┐
                    │   MANIPULATE:      │
                    │   • Time shift     │
                    │   • Filter cues    │
                    │   • Merge files    │
                    │   • Add metadata   │
                    │   • Transform text │
                    └────────────────────┘
```

## 🚀 5-Second Start

```typescript
import { convert } from 'subconv-ts';

// That's it! Universal JSON is used automatically
const vttContent = convert(srtContent, 'srt', 'vtt');
```

## 💡 Key Concepts

| Concept | Description |
|---------|-------------|
| **Universal JSON** | Intermediate format storing all subtitle data with millisecond precision |
| **Lossless** | No information is lost during conversion (metadata, styles preserved) |
| **Milliseconds** | All times stored as integers (easy manipulation, no string parsing) |
| **Format-Specific** | Properties unique to each format stored in `formatSpecific` fields |

## 📝 Common Use Cases

### 1. Simple Conversion (v1 style - still works!)

```typescript
import { convert } from 'subconv-ts';

const output = convert(input, 'srt', 'vtt');
```

### 2. Time Shift Subtitles

```typescript
import { parseToUniversal, formatFromUniversal } from 'subconv-ts';

const universal = parseToUniversal(content, 'srt');

// Delay by 2 seconds
universal.cues.forEach(cue => {
  cue.startTime += 2000;  // milliseconds
  cue.endTime += 2000;
});

const output = formatFromUniversal(universal, 'srt');
```

### 3. Filter Short Subtitles

```typescript
const universal = parseToUniversal(content, 'srt');

// Keep only subtitles longer than 1 second
universal.cues = universal.cues.filter(cue => cue.duration >= 1000);

const output = formatFromUniversal(universal, 'srt');
```

### 4. Add Metadata

```typescript
const universal = parseToUniversal(content, 'srt');

universal.metadata.title = 'My Movie - English';
universal.metadata.language = 'en';
universal.metadata.author = 'Subtitle Team';

// Export with metadata
const jsonOutput = universalToJson(universal);
```

### 5. Convert to Multiple Formats

```typescript
const universal = parseToUniversal(content, 'srt');

// Parse once, export many times
const srt = formatFromUniversal(universal, 'srt');
const vtt = formatFromUniversal(universal, 'vtt');
const ass = formatFromUniversal(universal, 'ass');
const json = formatFromUniversal(universal, 'json');
```

### 6. Merge Subtitle Files

```typescript
import { cloneUniversal } from 'subconv-ts';

const sub1 = parseToUniversal(content1, 'srt');
const sub2 = parseToUniversal(content2, 'srt');

const merged = cloneUniversal(sub1);
merged.cues = [...sub1.cues, ...sub2.cues]
  .sort((a, b) => a.startTime - b.startTime);

merged.cues.forEach((cue, i) => cue.index = i + 1);
```

## 🎯 Universal JSON Structure (Simplified)

```typescript
{
  version: "1.0.0",
  sourceFormat: "srt",
  
  metadata: {
    title?: string,
    language?: string,
    author?: string,
    formatSpecific?: { /* ASS, VTT specific data */ }
  },
  
  styles: [
    { name: "Default", fontName: "Arial", fontSize: 20, ... }
  ],
  
  cues: [
    {
      index: 1,
      startTime: 1000,        // milliseconds
      endTime: 3000,          // milliseconds
      duration: 2000,         // auto-calculated
      text: "Plain text",     // no formatting
      content: "<b>Rich</b>", // with formatting
      formatSpecific?: { /* per-cue specific data */ }
    }
  ]
}
```

## ⚡ Quick API Reference

| Function | Purpose |
|----------|---------|
| `convert(content, from, to, options?)` | Convert between formats (uses Universal internally) |
| `parseToUniversal(content, format?)` | Parse any format → Universal JSON |
| `formatFromUniversal(universal, format, options?)` | Universal JSON → any format |
| `universalToJson(universal, pretty?)` | Universal → JSON string |
| `jsonToUniversal(jsonString)` | JSON string → Universal |
| `timeStringToMs(timeString)` | "00:01:23,456" → 83456 |
| `msToTimeString(ms, format?)` | 83456 → "00:01:23,456" |
| `getUniversalStats(universal)` | Get detailed statistics |
| `cloneUniversal(universal)` | Deep clone |

## 🔧 Utility Examples

### Time Conversion

```typescript
import { timeStringToMs, msToTimeString } from 'subconv-ts';

const ms = timeStringToMs('00:01:23,456');  // 83456
const srtTime = msToTimeString(83456, 'srt');  // "00:01:23,456"
const vttTime = msToTimeString(83456, 'vtt');  // "00:01:23.456"
```

### Get Statistics

```typescript
import { getUniversalStats } from 'subconv-ts';

const stats = getUniversalStats(universal);
console.log(`Total: ${stats.totalCues} cues`);
console.log(`Duration: ${stats.totalDuration}ms`);
console.log(`Avg: ${stats.averageDuration.toFixed(0)}ms per cue`);
```

## 🎨 Conversion Options

```typescript
// Plain text only (strip formatting)
convert(content, 'ass', 'srt', { plainTextOnly: true });

// Preserve styles
convert(content, 'srt', 'ass', { preserveStyles: true });

// Legacy JSON format
formatFromUniversal(universal, 'json', { 
  formatSpecific: { useLegacyJson: true } 
});
```

## 📚 Learn More

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Deep dive into Universal JSON design
- **[examples/universalFormat.ts](examples/universalFormat.ts)** - 13 comprehensive examples
- **[MIGRATION.md](MIGRATION.md)** - Upgrade guide from v1.x
- **[README.md](README.md)** - Full API documentation

## ✅ Why Universal JSON?

| Benefit | Explanation |
|---------|-------------|
| 🎯 **Lossless** | All metadata, styles, formatting preserved |
| 🔧 **Easy Manipulation** | Work with milliseconds, not time strings |
| 🚀 **Fast Multi-Export** | Parse once, export to all formats |
| 📦 **Extensible** | Easy to add new formats (just 2 functions) |
| 🔄 **Round-Trip Safe** | Format → Universal → Format maintains all data |
| 💪 **Type-Safe** | Full TypeScript support |

## 🆘 Common Tasks Cheat Sheet

```typescript
// Time shift
universal.cues.forEach(cue => { cue.startTime += 2000; cue.endTime += 2000; });

// Speed up (1.5x faster)
universal.cues.forEach(cue => { 
  const duration = cue.duration / 1.5;
  cue.endTime = cue.startTime + duration;
  cue.duration = duration;
});

// Uppercase all text
universal.cues.forEach(cue => { cue.text = cue.text.toUpperCase(); });

// Remove short cues
universal.cues = universal.cues.filter(cue => cue.duration >= 1000);

// Find overlaps
for (let i = 0; i < universal.cues.length - 1; i++) {
  const gap = universal.cues[i+1].startTime - universal.cues[i].endTime;
  if (gap < 0) console.log(`Overlap at cue ${i+1}`);
}
```

---

**Pro Tip**: Bookmark this page for quick reference! 🔖