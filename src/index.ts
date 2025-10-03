/**
 * Subconv-ts: A lightweight, dependency-free TypeScript library for converting subtitle files
 */

import type { SubtitleCue, SubtitleAnalysis, ValidationResult, SubtitleFormat } from './types.js';

// Format-specific imports
import { parseSrt, toSrt, validateSrtStructure } from './formats/srt.js';
import { parseVtt, toVtt, validateVttStructure } from './formats/vtt.js';
import { parseAss, toAss, validateAssStructure } from './formats/ass.js';
import { parseJson, toJson, validateJsonStructure } from './formats/json.js';

// Format detection
import { detectFormat, detectFormatSimple, detectFormatWithConfidence } from './utils/formatDetector.js';
import type { FormatDetectionResult } from './utils/formatDetector.js';

/**
 * Convert subtitles between different formats
 * @param content - Subtitle content as string
 * @param fromFormat - Source format ('srt', 'vtt', 'ass', 'json', or 'auto' for automatic detection)
 * @param toFormat - Target format ('srt', 'vtt', 'ass', or 'json')
 * @returns Converted subtitle content
 */
export function convert(
  content: string, 
  fromFormat: SubtitleFormat | 'auto', 
  toFormat: SubtitleFormat
): string {
  // Auto-detect format if requested
  let actualFromFormat: SubtitleFormat;
  
  if (fromFormat === 'auto') {
    const detected = detectFormatSimple(content);
    if (!detected) {
      throw new Error('Unable to automatically detect subtitle format');
    }
    actualFromFormat = detected;
  } else {
    actualFromFormat = fromFormat;
  }

  // Parse the input content
  let cues: SubtitleCue[];
  
  switch (actualFromFormat) {
    case 'srt':
      cues = parseSrt(content);
      break;
    case 'vtt':
      cues = parseVtt(content);
      break;
    case 'ass':
      cues = parseAss(content);
      break;
    case 'json':
      cues = parseJson(content);
      break;
    default:
      throw new Error(`Unsupported input format: ${actualFromFormat}`);
  }

  // Convert to target format
  switch (toFormat) {
    case 'srt':
      return toSrt(cues);
    case 'vtt':
      return toVtt(cues);
    case 'ass':
      return toAss(cues);
    case 'json':
      return toJson(cues);
    default:
      throw new Error(`Unsupported output format: ${toFormat}`);
  }
}

/**
 * Analyze subtitle content and provide statistics
 * @param content - Subtitle content as string
 * @param format - Format of the subtitle content ('srt', 'vtt', 'ass', 'json', or 'auto')
 * @returns Analysis results
 */
export function analyze(content: string, format: SubtitleFormat | 'auto' = 'auto'): SubtitleAnalysis {
  // Auto-detect format if requested
  let actualFormat: SubtitleFormat;
  
  if (format === 'auto') {
    const detected = detectFormatSimple(content);
    if (!detected) {
      throw new Error('Unable to automatically detect subtitle format');
    }
    actualFormat = detected;
  } else {
    actualFormat = format;
  }

  let cues: SubtitleCue[];
  
  switch (actualFormat) {
    case 'srt':
      cues = parseSrt(content);
      break;
    case 'vtt':
      cues = parseVtt(content);
      break;
    case 'ass':
      cues = parseAss(content);
      break;
    case 'json':
      cues = parseJson(content);
      break;
    default:
      throw new Error(`Unsupported format: ${actualFormat}`);
  }

  if (cues.length === 0) {
    return {
      totalCues: 0,
      totalDuration: 0,
      startTime: '00:00:00.000',
      endTime: '00:00:00.000',
      averageDuration: 0,
      shortestCue: { startTime: '00:00:00.000', endTime: '00:00:00.000', text: '', duration: 0 },
      longestCue: { startTime: '00:00:00.000', endTime: '00:00:00.000', text: '', duration: 0 },
      totalLines: 0,
      averageLinesPerCue: 0
    };
  }

  // Calculate durations for each cue
  const cueDurations = cues.map(cue => ({
    ...cue,
    duration: timeToMilliseconds(cue.endTime) - timeToMilliseconds(cue.startTime)
  }));

  // Find shortest and longest cues
  const shortestCue = cueDurations.reduce((min, cue) => cue.duration < min.duration ? cue : min);
  const longestCue = cueDurations.reduce((max, cue) => cue.duration > max.duration ? cue : max);

  // Calculate basic statistics
  const totalCues = cues.length;
  const totalDuration = calculateTotalDuration(cues);
  const averageDuration = totalDuration / totalCues;
  const totalLines = cues.reduce((sum, cue) => sum + cue.text.split('\n').length, 0);
  const averageLinesPerCue = totalLines / totalCues;

  return {
    totalCues,
    totalDuration,
    startTime: cues[0]!.startTime,
    endTime: cues[cues.length - 1]!.endTime,
    averageDuration,
    shortestCue,
    longestCue,
    totalLines,
    averageLinesPerCue
  };
}

/**
 * Validate subtitle content (with automatic format detection)
 * @param content - Subtitle content as string
 * @param format - Format of the subtitle content ('srt', 'vtt', 'ass', 'json', or 'auto')
 * @returns Validation results
 */
export function validate(content: string, format: SubtitleFormat | 'auto' = 'auto'): ValidationResult {
  // Auto-detect format if requested
  let actualFormat: SubtitleFormat;
  
  if (format === 'auto') {
    const detected = detectFormatSimple(content);
    if (!detected) {
      return {
        isValid: false,
        errors: [{
          type: 'INVALID_FORMAT',
          message: 'Unable to automatically detect subtitle format'
        }],
        warnings: []
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
      errors: [{
        type: 'INVALID_FORMAT',
        message: `Content appears to be ${detectionResult.format || 'unknown format'}, but ${actualFormat} format was specified/detected`
      }],
      warnings: []
    };
  }

  // Now validate with the appropriate validator
  switch (actualFormat) {
    case 'srt':
      return validateSrtStructure(content);
    case 'vtt':
      return validateVttStructure(content);
    case 'ass':
      return validateAssStructure(content);
    case 'json':
      return validateJsonStructure(content);
    default:
      throw new Error(`Unsupported format: ${actualFormat}`);
  }
}

/**
 * Helper function to calculate total duration of all cues
 * @param cues - Array of subtitle cues
 * @returns Total duration in milliseconds
 */
function calculateTotalDuration(cues: SubtitleCue[]): number {
  if (cues.length === 0) return 0;
  
  // Simple implementation: sum of all cue durations
  return cues.reduce((total, cue) => {
    const startMs = timeToMilliseconds(cue.startTime);
    const endMs = timeToMilliseconds(cue.endTime);
    return total + (endMs - startMs);
  }, 0);
}

/**
 * Convert time string to milliseconds (helper function)
 * @param timeString - Time in format HH:MM:SS,mmm (SRT) or HH:MM:SS.mmm (VTT)
 * @returns Time in milliseconds
 */
function timeToMilliseconds(timeString: string): number {
  // Handle both SRT (comma) and VTT (dot) formats
  const normalizedTime = timeString.replace(',', '.');
  const match = normalizedTime.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  
  if (!match) {
    throw new Error(`Invalid time format: ${timeString}`);
  }

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const milliseconds = parseInt(match[4]!, 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

// Export all format parsers and converters
export { parseAss, toAss, validateAssStructure };
export { parseVtt, toVtt, validateVttStructure };
export { parseSrt, toSrt, validateSrtStructure };
export { parseJson, toJson, validateJsonStructure };

// Export format detection utilities
export { detectFormat, detectFormatSimple, detectFormatWithConfidence };
export type { FormatDetectionResult };

// Re-export types for convenience
export type { SubtitleCue, SubtitleAnalysis, ValidationResult, ValidationError, ValidationWarning, SubtitleFormat } from './types.js';