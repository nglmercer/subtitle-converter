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

📖 **Full Documentation**: See the [docs](/docs) directory for complete guides:
- [Getting Started](/docs/getting-started.md)
- [API Reference](/docs/api-reference.md)
- [Universal JSON Architecture](/docs/universal-json.md)
- [Supported Formats](/docs/formats.md)
- [SubtitleEditor Guide](/docs/subtitle-editor.md)

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
