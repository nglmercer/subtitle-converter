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

  // Step 2: Convert FROM source format TO Universal JSON
  const universal = parseToUniversal(content, actualFromFormat);

  // Step 3: Convert FROM Universal JSON TO target format
  return formatFromUniversal(universal, toFormat, options);
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
