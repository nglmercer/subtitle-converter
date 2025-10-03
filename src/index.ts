/**
 * Subconv-ts: A lightweight, dependency-free TypeScript library for converting subtitle files
 */

import type { SubtitleCue, SubtitleAnalysis, ValidationResult, SubtitleFormat } from './types.js';

// Format-specific imports (to be implemented)
import { parseSrt, toSrt, validateSrtStructure } from './formats/srt.js';
import { parseVtt, toVtt, validateVttStructure } from './formats/vtt.js';

/**
 * Convert subtitles between different formats
 * @param content - Subtitle content as string
 * @param fromFormat - Source format ('srt' or 'vtt')
 * @param toFormat - Target format ('srt' or 'vtt')
 * @returns Converted subtitle content
 */
export function convert(content: string, fromFormat: SubtitleFormat, toFormat: SubtitleFormat): string {
  // Parse the input content
  let cues: SubtitleCue[];
  
  switch (fromFormat) {
    case 'srt':
      cues = parseSrt(content);
      break;
    case 'vtt':
      cues = parseVtt(content);
      break;
    default:
      throw new Error(`Unsupported input format: ${fromFormat}`);
  }

  // Convert to target format
  switch (toFormat) {
    case 'srt':
      return toSrt(cues);
    case 'vtt':
      return toVtt(cues);
    default:
      throw new Error(`Unsupported output format: ${toFormat}`);
  }
}

/**
 * Analyze subtitle content and provide statistics
 * @param content - Subtitle content as string
 * @param format - Format of the subtitle content ('srt' or 'vtt')
 * @returns Analysis results
 */
export function analyze(content: string, format: SubtitleFormat): SubtitleAnalysis {
  let cues: SubtitleCue[];
  
  switch (format) {
    case 'srt':
      cues = parseSrt(content);
      break;
    case 'vtt':
      cues = parseVtt(content);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
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
    startTime: cues[0].startTime,
    endTime: cues[cues.length - 1].endTime,
    averageDuration,
    shortestCue,
    longestCue,
    totalLines,
    averageLinesPerCue
  };
}

/**
 * Validate subtitle content
 * @param content - Subtitle content as string
 * @param format - Format of the subtitle content ('srt' or 'vtt')
 * @returns Validation results
 */
export function validate(content: string, format: SubtitleFormat): ValidationResult {
  switch (format) {
    case 'srt':
      return validateSrtStructure(content);
    case 'vtt':
      return validateVttStructure(content);
    default:
      throw new Error(`Unsupported format: ${format}`);
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

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

// Re-export types for convenience
export type { SubtitleCue, SubtitleAnalysis, ValidationResult, ValidationError, ValidationWarning, SubtitleFormat } from './types.js';