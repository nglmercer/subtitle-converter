/**
 * Universal subtitle format converter
 * Central hub for converting between all subtitle formats using a universal JSON intermediate
 */

import type {
  SubtitleFormat,
  UniversalSubtitle,
  UniversalCue,
  SubtitleMetadata,
  StyleDefinition,
  ConversionOptions,
  SubtitleCue,
} from "../types.js";

/**
 * Current version of the universal subtitle format
 */
const UNIVERSAL_FORMAT_VERSION = "1.0.0";

/**
 * Convert time string to milliseconds
 * Supports SRT (HH:MM:SS,mmm) and VTT (HH:MM:SS.mmm) formats
 */
export function timeStringToMs(timeString: string): number {
  const normalized = timeString.replace(",", ".");
  const match = normalized.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);

  if (!match) {
    throw new Error(`Invalid time format: ${timeString}`);
  }

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const milliseconds = parseInt(match[4]!, 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

/**
 * Convert milliseconds to time string in SRT format (HH:MM:SS,mmm)
 */
export function msToTimeString(
  ms: number,
  format: "srt" | "vtt" = "srt",
): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);

  const separator = format === "srt" ? "," : ".";
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${separator}${pad(milliseconds, 3)}`;
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, size: number = 2): string {
  return num.toString().padStart(size, "0");
}

/**
 * Convert basic SubtitleCue array to UniversalSubtitle format
 */
export function toUniversal(
  cues: SubtitleCue[],
  sourceFormat: SubtitleFormat,
  metadata?: Partial<SubtitleMetadata>,
  styles?: StyleDefinition[],
): UniversalSubtitle {
  const universalCues: UniversalCue[] = cues.map((cue, index) => ({
    index: index + 1,
    startTime: timeStringToMs(cue.startTime),
    endTime: timeStringToMs(cue.endTime),
    duration: timeStringToMs(cue.endTime) - timeStringToMs(cue.startTime),
    text: stripFormatting(cue.text),
    content: cue.text,
  }));

  const finalMetadata: SubtitleMetadata = {
    formatSpecific: metadata?.formatSpecific || {},
  };

  if (metadata?.title) finalMetadata.title = metadata.title;
  if (metadata?.language) finalMetadata.language = metadata.language;
  if (metadata?.author) finalMetadata.author = metadata.author;
  if (metadata?.description) finalMetadata.description = metadata.description;

  return {
    version: UNIVERSAL_FORMAT_VERSION,
    sourceFormat,
    metadata: finalMetadata,
    styles: styles || [],
    cues: universalCues,
  };
}

/**
 * Convert UniversalSubtitle to basic SubtitleCue array
 */
export function fromUniversal(
  universal: UniversalSubtitle,
  targetFormat: SubtitleFormat = "srt",
  options?: ConversionOptions,
): SubtitleCue[] {
  return universal.cues.map((cue) => {
    let text = options?.plainTextOnly ? cue.text : cue.content;

    // Apply format-specific text transformations if needed
    if (targetFormat === "srt" && !options?.plainTextOnly) {
      // SRT doesn't support rich formatting, use basic text
      text = cue.text;
    }

    return {
      startTime: msToTimeString(
        cue.startTime,
        targetFormat === "vtt" ? "vtt" : "srt",
      ),
      endTime: msToTimeString(
        cue.endTime,
        targetFormat === "vtt" ? "vtt" : "srt",
      ),
      text,
    };
  });
}

/**
 * Strip formatting tags from text
 */
function stripFormatting(text: string): string {
  let clean = text;

  // Remove HTML-like tags
  clean = clean.replace(/<[^>]*>/g, "");

  // Remove ASS formatting tags
  clean = clean.replace(/\{[^}]*\}/g, "");

  // Convert ASS line breaks to regular newlines
  clean = clean.replace(/\\N/g, "\n");
  clean = clean.replace(/\\n/g, " ");
  clean = clean.replace(/\\h/g, " ");

  return clean.trim();
}

/**
 * Create default style definition
 */
export function createDefaultStyle(name: string = "Default"): StyleDefinition {
  return {
    name,
    fontName: "Arial",
    fontSize: 20,
    primaryColor: "#FFFFFF",
    secondaryColor: "#0000FF",
    outlineColor: "#000000",
    backColor: "#000000",
    bold: false,
    italic: false,
    underline: false,
    strikeOut: false,
    scaleX: 100,
    scaleY: 100,
    spacing: 0,
    angle: 0,
    borderStyle: 1,
    outline: 2,
    shadow: 0,
    alignment: 2,
    marginL: 10,
    marginR: 10,
    marginV: 10,
    encoding: 1,
  };
}

/**
 * Merge metadata from multiple sources
 */
export function mergeMetadata(
  ...metadatas: Partial<SubtitleMetadata>[]
): SubtitleMetadata {
  const merged: SubtitleMetadata = {
    formatSpecific: {},
  };

  for (const meta of metadatas) {
    if (!meta) continue;

    if (meta.title) merged.title = meta.title;
    if (meta.language) merged.language = meta.language;
    if (meta.author) merged.author = meta.author;
    if (meta.description) merged.description = meta.description;

    if (meta.formatSpecific) {
      merged.formatSpecific = {
        ...merged.formatSpecific,
        ...meta.formatSpecific,
      };
    }
  }

  return merged;
}

/**
 * Validate universal subtitle structure
 */
export function validateUniversal(
  universal: any,
): universal is UniversalSubtitle {
  if (!universal || typeof universal !== "object") return false;

  if (!universal.version || typeof universal.version !== "string") return false;
  if (!universal.sourceFormat || typeof universal.sourceFormat !== "string")
    return false;
  if (!universal.metadata || typeof universal.metadata !== "object")
    return false;
  if (!Array.isArray(universal.styles)) return false;
  if (!Array.isArray(universal.cues)) return false;

  // Validate cues
  for (const cue of universal.cues) {
    if (typeof cue.index !== "number") return false;
    if (typeof cue.startTime !== "number") return false;
    if (typeof cue.endTime !== "number") return false;
    if (typeof cue.duration !== "number") return false;
    if (typeof cue.text !== "string") return false;
    if (typeof cue.content !== "string") return false;
  }

  return true;
}

/**
 * Convert universal format to JSON string
 */
export function universalToJson(
  universal: UniversalSubtitle,
  pretty: boolean = true,
): string {
  return JSON.stringify(universal, null, pretty ? 2 : 0);
}

/**
 * Parse JSON string to universal format
 */
export function jsonToUniversal(jsonContent: string): UniversalSubtitle {
  let parsed: any;

  try {
    parsed = JSON.parse(jsonContent);
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Check if it's already in universal format
  if (validateUniversal(parsed)) {
    return parsed as UniversalSubtitle;
  }

  // Check if it's the old JSON format (array of captions)
  if (Array.isArray(parsed)) {
    return convertLegacyJsonToUniversal(parsed);
  }

  throw new Error("Invalid universal subtitle format");
}

/**
 * Convert legacy JSON format to universal format
 */
function convertLegacyJsonToUniversal(
  legacyCaptions: any[],
): UniversalSubtitle {
  const cues: UniversalCue[] = legacyCaptions
    .filter((caption) => caption.type === "caption")
    .map((caption) => ({
      index: caption.index || 0,
      startTime: caption.start,
      endTime: caption.end,
      duration: caption.duration || caption.end - caption.start,
      text: caption.text || caption.content || "",
      content: caption.content || caption.text || "",
    }));

  return {
    version: UNIVERSAL_FORMAT_VERSION,
    sourceFormat: "json",
    metadata: {},
    styles: [],
    cues,
  };
}

/**
 * Convert universal format to legacy JSON format for backward compatibility
 */
export function universalToLegacyJson(universal: UniversalSubtitle): any[] {
  return universal.cues.map((cue) => ({
    type: "caption",
    index: cue.index,
    start: cue.startTime,
    end: cue.endTime,
    duration: cue.duration,
    content: cue.content,
    text: cue.text,
  }));
}

/**
 * Clone a universal subtitle object
 */
export function cloneUniversal(
  universal: UniversalSubtitle,
): UniversalSubtitle {
  return JSON.parse(JSON.stringify(universal));
}

/**
 * Get statistics from universal format
 */
export function getUniversalStats(universal: UniversalSubtitle) {
  const totalCues = universal.cues.length;

  if (totalCues === 0) {
    return {
      totalCues: 0,
      totalDuration: 0,
      averageDuration: 0,
      firstCueStart: 0,
      lastCueEnd: 0,
      totalCharacters: 0,
      averageCharactersPerCue: 0,
    };
  }

  const totalDuration = universal.cues.reduce(
    (sum, cue) => sum + cue.duration,
    0,
  );
  const totalCharacters = universal.cues.reduce(
    (sum, cue) => sum + cue.text.length,
    0,
  );
  const firstCue = universal.cues[0]!;
  const lastCue = universal.cues[totalCues - 1]!;

  return {
    totalCues,
    totalDuration,
    averageDuration: totalDuration / totalCues,
    firstCueStart: firstCue.startTime,
    lastCueEnd: lastCue.endTime,
    totalCharacters,
    averageCharactersPerCue: totalCharacters / totalCues,
  };
}
