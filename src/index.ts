/**
 * Subconv-ts: A lightweight, dependency-free TypeScript library for converting subtitle files
 *
 * ARCHITECTURE:
 * All conversions use a Universal JSON intermediate format to avoid N×N conversion implementations.
 * This ensures:
 * - Lossless conversions with metadata preservation
 * - Easy addition of new formats (only need to implement to/from universal)
 * - Consistent behavior across all format pairs
 * - Ability to inspect and manipulate subtitles programmatically
 */

import type {
  SubtitleCue,
  SubtitleAnalysis,
  ValidationResult,
  SubtitleFormat,
  UniversalSubtitle,
  ConversionOptions,
  RendererAdapter,
  RenderOptions,
} from "./types.js";

// Format-specific imports
import { parseSrt, toSrt, validateSrtStructure } from "./formats/srt.js";
import { parseVtt, toVtt, validateVttStructure } from "./formats/vtt.js";
import {
  parseAss,
  toAss,
  validateAssStructure,
  assToUniversal,
  universalToAss,
} from "./formats/ass.js";
import { parseJson, toJson, validateJsonStructure } from "./formats/json.js";

// Universal format utilities
import {
  toUniversal as cuesToUniversal,
  fromUniversal as universalToCues,
  universalToJson,
  jsonToUniversal,
  universalToLegacyJson,
  timeStringToMs,
  msToTimeString,
  createDefaultStyle,
  mergeMetadata,
  validateUniversal,
  getUniversalStats,
  cloneUniversal,
} from "./formats/universal.js";

// Format detection
import {
  detectFormat,
  detectFormatSimple,
  detectFormatWithConfidence,
} from "./utils/formatDetector.js";
import type { FormatDetectionResult } from "./utils/formatDetector.js";

/**
 * Convert subtitles between different formats using Universal JSON intermediate
 *
 * @param content - Subtitle content as string
 * @param fromFormat - Source format ('srt', 'vtt', 'ass', 'json', or 'auto' for automatic detection)
 * @param toFormat - Target format ('srt', 'vtt', 'ass', or 'json')
 * @param options - Optional conversion settings
 * @returns Converted subtitle content
 *
 * @example
 * ```typescript
 * // Convert SRT to VTT
 * const vttContent = convert(srtContent, 'srt', 'vtt');
 *
 * // Auto-detect format and convert
 * const assContent = convert(unknownContent, 'auto', 'ass');
 *
 * // Convert with options
 * const result = convert(content, 'ass', 'srt', { plainTextOnly: true });
 * ```
 */
export function convert(
  content: string,
  fromFormat: SubtitleFormat | "auto",
  toFormat: SubtitleFormat,
  options?: ConversionOptions,
): string {
  // Step 1: Auto-detect format if requested
  let actualFromFormat: SubtitleFormat;

  if (fromFormat === "auto") {
    const detected = detectFormatSimple(content);
    if (!detected) {
      throw new Error("Unable to automatically detect subtitle format");
    }
    actualFromFormat = detected;
  } else {
    actualFromFormat = fromFormat;
  }

  const universal = parseToUniversal(content, actualFromFormat);
  const universalJson = universalToJson(universal, false);
  const normalizedUniversal = jsonToUniversal(universalJson);
  return formatFromUniversal(normalizedUniversal, toFormat, options);
}

/**
 * Parse any subtitle format into Universal JSON format
 *
 * @param content - Subtitle content as string
 * @param format - Format of the subtitle content
 * @returns UniversalSubtitle object
 *
 * @example
 * ```typescript
 * const universal = parseToUniversal(srtContent, 'srt');
 * console.log(universal.cues.length); // Number of subtitle cues
 * console.log(universal.metadata); // Metadata information
 * ```
 */
export function parseToUniversal(
  content: string,
  format: SubtitleFormat | "auto" = "auto",
): UniversalSubtitle {
  // Auto-detect if needed
  let actualFormat: SubtitleFormat;

  if (format === "auto") {
    const detected = detectFormatSimple(content);
    if (!detected) {
      throw new Error("Unable to automatically detect subtitle format");
    }
    actualFormat = detected;
  } else {
    actualFormat = format;
  }

  // Parse format-specific content to basic cues
  let cues: SubtitleCue[];

  switch (actualFormat) {
    case "srt":
      cues = parseSrt(content);
      break;
    case "vtt":
      cues = parseVtt(content);
      break;
    case "ass":
      // Use assToUniversal for better metadata/style preservation
      return assToUniversal(content);
    case "json":
      // Check if it's already in universal format
      try {
        return jsonToUniversal(content);
      } catch {
        // Fall back to legacy JSON parsing
        cues = parseJson(content);
      }
      break;
    default:
      throw new Error(`Unsupported input format: ${actualFormat}`);
  }

  // Convert basic cues to universal format
  return cuesToUniversal(cues, actualFormat);
}

/**
 * Format Universal JSON into any subtitle format
 *
 * @param universal - UniversalSubtitle object
 * @param format - Target format
 * @param options - Optional conversion settings
 * @returns Formatted subtitle content as string
 *
 * @example
 * ```typescript
 * const universal = parseToUniversal(content, 'srt');
 * const vttContent = formatFromUniversal(universal, 'vtt');
 * ```
 */
export function formatFromUniversal(
  universal: UniversalSubtitle,
  format: SubtitleFormat,
  options?: ConversionOptions,
): string {
  // Convert universal to basic cues for target format
  const cues = universalToCues(universal, format, options);

  // Format using format-specific serializer
  switch (format) {
    case "srt":
      return toSrt(cues);
    case "vtt":
      return toVtt(cues);
    case "ass":
      return toAss(cues);
    case "json":
      // Support both universal and legacy JSON formats
      if (options?.formatSpecific?.["useLegacyJson"]) {
        return JSON.stringify(universalToLegacyJson(universal), null, 2);
      }
      return universalToJson(universal, true);
    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}

export function renderWithAdapter(
  universal: UniversalSubtitle,
  adapter: RendererAdapter,
  options?: RenderOptions,
): string {
  return adapter.render(universal, options);
}

export function renderHtml(
  universal: UniversalSubtitle,
  options?: RenderOptions,
): string {
  const usePlain = options?.usePlainText ?? true;
  const processAss = options?.processAssOverrides ?? false;
  const containerTag = options?.containerTag ?? "div";
  const cueTag = options?.cueTag ?? "div";
  const containerClass = options?.containerClass ?? "subconv-container";
  const cueClass = options?.cueClass ?? "subconv-cue";
  const timeFmt = options?.timeFormat ?? "ms";
  const attrs = options?.dataAttributes ?? {};
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` data-${k}="${String(v)}"`)
    .join("");
  const meta = options?.includeMetadata
    ? ` data-format="${universal.sourceFormat}"`
    : "";
  const header = `<${containerTag} class="${containerClass}"${meta}${attrStr}>`;
  const cuesHtml = universal.cues
    .map((c) => {
      const start = timeFmt === "ms" ? String(c.startTime) : msToTimeString(c.startTime, timeFmt === "vtt" ? "vtt" : "srt");
      const end = timeFmt === "ms" ? String(c.endTime) : msToTimeString(c.endTime, timeFmt === "vtt" ? "vtt" : "srt");
      let text = usePlain ? c.text : c.content;
      let extraAttrs = "";
      if (processAss && universal.sourceFormat === "ass" && !usePlain) {
        const info = extractAssOverrides(text);
        text = info.cleaned;
        if (info.posX !== undefined) extraAttrs += ` data-pos-x="${info.posX}"`;
        if (info.posY !== undefined) extraAttrs += ` data-pos-y="${info.posY}"`;
        if (info.color) extraAttrs += ` data-override-color="${escapeHtml(info.color)}"`;
      }
      const styleName = c.style ? ` data-style="${c.style}"` : "";
      return `<${cueTag} class="${cueClass}" data-index="${c.index}" data-start="${start}" data-end="${end}"${styleName}${extraAttrs}><span class="subconv-text">${escapeHtml(text)}</span></${cueTag}>`;
    })
    .join("");
  const footer = `</${containerTag}>`;
  return header + cuesHtml + footer;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderJson(
  universal: UniversalSubtitle,
  options?: RenderOptions,
): string {
  const target = options?.target ?? "raw";
  const compact = options?.compact ?? true;
  const styles = mapStyles(universal.styles, target);
  if (compact) {
    const payload: any = {
      v: universal.version,
      f: universal.sourceFormat,
      s: styles,
      c: universal.cues.map((c) => ({ i: c.index, s: c.startTime, e: c.endTime, t: (options?.usePlainText ?? true) ? c.text : c.content, st: c.style })),
    };
    return JSON.stringify(payload);
  }
  const payload: any = {
    version: universal.version,
    format: universal.sourceFormat,
    styles,
    cues: universal.cues.map((c) => ({ index: c.index, startTime: c.startTime, endTime: c.endTime, duration: c.duration, text: (options?.usePlainText ?? true) ? c.text : c.content, style: c.style })),
    metadata: options?.includeMetadata ? universal.metadata : undefined,
  };
  return JSON.stringify(payload);
}

function mapStyles(styles: any[], target: string): any {
  const out: any = {};
  for (const s of styles) {
    const name = s.name || "Default";
    if (target === "raw") {
      out[name] = s;
    } else if (target === "browser") {
      out[name] = {
        fontFamily: s.fontName,
        fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
        color: s.primaryColor ? toCssColor(s.primaryColor) : undefined,
        outlineColor: s.outlineColor ? toCssColor(s.outlineColor) : undefined,
        backgroundColor: s.backColor ? toCssColor(s.backColor) : undefined,
        fontWeight: s.bold ? "700" : "400",
        fontStyle: s.italic ? "italic" : "normal",
        textDecoration: s.underline ? "underline" : undefined,
        letterSpacing: s.spacing !== undefined ? `${s.spacing}px` : undefined,
        textShadow: s.shadow !== undefined ? `${s.shadow}px ${s.shadow}px ${s.shadow}px ${s.outlineColor ? toCssColor(s.outlineColor) : "#000"}` : undefined,
        textAlign: s.alignment === 1 ? "left" : s.alignment === 2 ? "center" : s.alignment === 3 ? "right" : s.alignment === 4 ? "left" : s.alignment === 5 ? "center" : s.alignment === 6 ? "right" : s.alignment === 7 ? "left" : s.alignment === 8 ? "center" : s.alignment === 9 ? "right" : undefined,
        marginTop: s.marginV !== undefined ? `${s.marginV}px` : undefined,
        marginLeft: s.marginL !== undefined ? `${s.marginL}px` : undefined,
        marginRight: s.marginR !== undefined ? `${s.marginR}px` : undefined,
        alignment: s.alignment,
      };
    } else if (target === "slint") {
      out[name] = {
        font_name: s.fontName,
        font_size: s.fontSize,
        color: s.primaryColor ? toCssColor(s.primaryColor) : undefined,
        outline_color: s.outlineColor ? toCssColor(s.outlineColor) : undefined,
        back_color: s.backColor ? toCssColor(s.backColor) : undefined,
        bold: !!s.bold,
        italic: !!s.italic,
        underline: !!s.underline,
        spacing: s.spacing,
        shadow: s.shadow,
        alignment: s.alignment,
      };
    }
  }
  return out;
}

function toCssColor(color: string): string {
  if (!color) return "";
  if (color.startsWith("#")) return color;
  const m = color.match(/^&H([0-9A-Fa-f]{8})$/);
  if (m) {
    const hex = m[1]!;
    const aa = parseInt(hex.slice(0, 2), 16);
    const bb = parseInt(hex.slice(2, 4), 16);
    const gg = parseInt(hex.slice(4, 6), 16);
    const rr = parseInt(hex.slice(6, 8), 16);
    const a = 1 - aa / 255;
    return `rgba(${rr},${gg},${bb},${a.toFixed(3)})`;
  }
  const m6 = color.match(/^&H([0-9A-Fa-f]{6})$/);
  if (m6) {
    const hex = m6[1]!;
    const bb = parseInt(hex.slice(0, 2), 16);
    const gg = parseInt(hex.slice(2, 4), 16);
    const rr = parseInt(hex.slice(4, 6), 16);
    return `rgb(${rr},${gg},${bb})`;
  }
  return color;
}

function extractAssOverrides(s: string): { posX?: number; posY?: number; color?: string; cleaned: string } {
  let posX: number | undefined;
  let posY: number | undefined;
  let color: string | undefined;
  const mPos = s.match(/\{[^}]*pos\((\d+),(\d+)\)[^}]*\}/) || s.match(/pos\((\d+),(\d+)\)/);
  if (mPos) {
    posX = parseInt(mPos[1]!, 10);
    posY = parseInt(mPos[2]!, 10);
  }
  const mColor = s.match(/\{[^}]*c&H([0-9A-Fa-f]{6,8})&[^}]*\}/) || s.match(/\\?c&H([0-9A-Fa-f]{6,8})&/);
  if (mColor) {
    color = `&H${mColor[1]!}`;
  }
  let cleaned = s.replace(/\{\\?pos\([^}]+\)\}/g, "").replace(/\\?pos\([^)]*\)/g, "");
  cleaned = cleaned.replace(/\{\\c&H[0-9A-Fa-f]{6,8}&\}/g, "");
  cleaned = cleaned.replace(/\{[^}]*\}/g, "");
  cleaned = cleaned.replace(/\\N/g, String.fromCharCode(10));
  cleaned = cleaned.replace(/\\n/g, " ");
  cleaned = cleaned.replace(/\\h/g, " ");
  cleaned = cleaned.trim();
  const out: { posX?: number; posY?: number; color?: string; cleaned: string } = { cleaned };
  if (posX !== undefined) out.posX = posX;
  if (posY !== undefined) out.posY = posY;
  if (color !== undefined) out.color = color;
  return out;
}

/**
 * Analyze subtitle content and provide statistics
 *
 * @param content - Subtitle content as string
 * @param format - Format of the subtitle content ('srt', 'vtt', 'ass', 'json', or 'auto')
 * @returns Analysis results with detailed statistics
 *
 * @example
 * ```typescript
 * const analysis = analyze(srtContent, 'srt');
 * console.log(`Total cues: ${analysis.totalCues}`);
 * console.log(`Duration: ${analysis.totalDuration}ms`);
 * ```
 */
export function analyze(
  content: string,
  format: SubtitleFormat | "auto" = "auto",
): SubtitleAnalysis {
  // Parse to universal format first
  const universal = parseToUniversal(content, format);

  if (universal.cues.length === 0) {
    return {
      totalCues: 0,
      totalDuration: 0,
      startTime: "00:00:00.000",
      endTime: "00:00:00.000",
      averageDuration: 0,
      shortestCue: {
        startTime: "00:00:00.000",
        endTime: "00:00:00.000",
        text: "",
        duration: 0,
      },
      longestCue: {
        startTime: "00:00:00.000",
        endTime: "00:00:00.000",
        text: "",
        duration: 0,
      },
      totalLines: 0,
      averageLinesPerCue: 0,
    };
  }

  // Find shortest and longest cues
  const shortestCue = universal.cues.reduce((min, cue) =>
    cue.duration < min.duration ? cue : min,
  );
  const longestCue = universal.cues.reduce((max, cue) =>
    cue.duration > max.duration ? cue : max,
  );

  // Calculate statistics
  const totalCues = universal.cues.length;
  const totalDuration = universal.cues.reduce(
    (sum, cue) => sum + cue.duration,
    0,
  );
  const averageDuration = totalDuration / totalCues;
  const totalLines = universal.cues.reduce(
    (sum, cue) => sum + cue.text.split("\n").length,
    0,
  );
  const averageLinesPerCue = totalLines / totalCues;

  const firstCue = universal.cues[0]!;
  const lastCue = universal.cues[universal.cues.length - 1]!;

  return {
    totalCues,
    totalDuration,
    startTime: msToTimeString(firstCue.startTime),
    endTime: msToTimeString(lastCue.endTime),
    averageDuration,
    shortestCue: {
      startTime: msToTimeString(shortestCue.startTime),
      endTime: msToTimeString(shortestCue.endTime),
      text: shortestCue.text,
      duration: shortestCue.duration,
    },
    longestCue: {
      startTime: msToTimeString(longestCue.startTime),
      endTime: msToTimeString(longestCue.endTime),
      text: longestCue.text,
      duration: longestCue.duration,
    },
    totalLines,
    averageLinesPerCue,
  };
}

/**
 * Validate subtitle content
 *
 * @param content - Subtitle content as string
 * @param format - Format of the subtitle content ('srt', 'vtt', 'ass', 'json', or 'auto')
 * @returns Validation results with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validate(srtContent, 'srt');
 * if (!result.isValid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validate(
  content: string,
  format: SubtitleFormat | "auto" = "auto",
): ValidationResult {
  // Auto-detect format if requested
  let actualFormat: SubtitleFormat;

  if (format === "auto") {
    const detected = detectFormatSimple(content);
    if (!detected) {
      return {
        isValid: false,
        errors: [
          {
            type: "INVALID_FORMAT",
            message: "Unable to automatically detect subtitle format",
          },
        ],
        warnings: [],
      };
    }
    actualFormat = detected;
  } else {
    actualFormat = format;
  }

  // First, validate that the detected/specified format matches the content
  const detectionResult = detectFormat(content);

  if (detectionResult.format !== actualFormat) {
    return {
      isValid: false,
      errors: [
        {
          type: "INVALID_FORMAT",
          message: `Content appears to be ${
            detectionResult.format || "unknown format"
          }, but ${actualFormat} format was specified/detected`,
        },
      ],
      warnings: [],
    };
  }

  // Validate with format-specific validator
  switch (actualFormat) {
    case "srt":
      return validateSrtStructure(content);
    case "vtt":
      return validateVttStructure(content);
    case "ass":
      return validateAssStructure(content);
    case "json":
      // Try to validate as universal format first
      try {
        const universal = jsonToUniversal(content);
        if (validateUniversal(universal)) {
          return { isValid: true, errors: [], warnings: [] };
        }
      } catch {
        // Fall back to legacy JSON validation
      }
      return validateJsonStructure(content);
    default:
      throw new Error(`Unsupported format: ${actualFormat}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Main API functions are already exported above in their definitions

// Format-specific parsers and converters (for backward compatibility)
export {
  parseAss,
  toAss,
  validateAssStructure,
  assToUniversal,
  universalToAss,
};
export { parseVtt, toVtt, validateVttStructure };
export { parseSrt, toSrt, validateSrtStructure };
export { parseJson, toJson, validateJsonStructure };

// Universal format utilities
export {
  cuesToUniversal as toUniversal,
  universalToCues as fromUniversal,
  universalToJson,
  jsonToUniversal,
  universalToLegacyJson,
  timeStringToMs,
  msToTimeString,
  createDefaultStyle,
  mergeMetadata,
  validateUniversal,
  getUniversalStats,
  cloneUniversal,
};

// Format detection utilities
export { detectFormat, detectFormatSimple, detectFormatWithConfidence };
export type { FormatDetectionResult };

// Type exports
export type {
  SubtitleCue,
  SubtitleAnalysis,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SubtitleFormat,
  UniversalSubtitle,
  UniversalCue,
  SubtitleMetadata,
  StyleDefinition,
  ConversionOptions,
  RendererAdapter,
  RenderOptions,
  CueLayout,
  InlineFormatting,
  VttRegion,
} from "./types.js";

// Export SubtitleEditor class
export { SubtitleEditor } from "./SubtitleEditor.js";
export type {
  ChangeEvent,
  ChangeType,
  SearchOptions,
  FragmentContext,
  ValidationOptions,
} from "./SubtitleEditor.js";
