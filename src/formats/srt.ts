import type { SubtitleCue, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

/**
 * Parse SRT content and convert it to an array of SubtitleCue objects
 * @param srtContent - Complete SRT file content as string
 * @returns Array of SubtitleCue objects
 */
export function parseSrt(srtContent: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = srtContent.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n'); // Don't trim individual lines to preserve whitespace
    if (lines.length < 2) continue;

    // First line should be the cue number (we'll validate but not use it)
    const cueNumber = lines[0]?.trim();
    if (!cueNumber || !/^\d+$/.test(cueNumber)) continue;

    // Second line should be the time range
    const timeLine = lines[1]?.trim();
    if (!timeLine) continue;
    
    const timeMatch = timeLine.match(/^(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})$/);
    
    if (!timeMatch) continue;

    const startTime = timeMatch[1];
    const endTime = timeMatch[2];

    // Remaining lines are the text content - preserve whitespace
    const text = lines.slice(2).join('\n'); // Don't trim to preserve whitespace

    cues.push({
      startTime,
      endTime,
      text
    });
  }

  return cues;
}

/**
 * Convert an array of SubtitleCue objects to SRT format
 * @param cues - Array of SubtitleCue objects
 * @returns SRT formatted string
 */
export function toSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue, index) => {
      const cueNumber = (index + 1).toString();
      const timeRange = `${cue.startTime} --> ${cue.endTime}`;
      return `${cueNumber}\n${timeRange}\n${cue.text}`;
    })
    .join('\n\n');
}

/**
 * Validate SRT file structure
 * @param srtContent - Complete SRT file content as string
 * @returns ValidationResult with errors and warnings
 */
export function validateSrtStructure(srtContent: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const blocks = srtContent.trim().split(/\n\n+/);
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block) continue;
    
    const lines = block.trim().split('\n');
    
    if (lines.length < 2) {
      errors.push({
        type: 'INVALID_FORMAT',
        message: `Block ${i + 1} has insufficient lines`,
        lineNumber: blocks.slice(0, i).join('\n\n').split('\n').length + 1
      });
      continue;
    }

    // Validate cue number
    const cueNumber = lines[0]?.trim();
    if (!cueNumber || !/^\d+$/.test(cueNumber)) {
      errors.push({
        type: 'MISSING_CUE_NUMBER',
        message: `Invalid or missing cue number in block ${i + 1}`,
        lineNumber: blocks.slice(0, i).join('\n\n').split('\n').length + 1
      });
    }

    // Validate time format
    const timeLine = lines[1]?.trim();
    if (!timeLine) {
      errors.push({
        type: 'INVALID_TIMECODE',
        message: `Missing time line in block ${i + 1}`,
        lineNumber: blocks.slice(0, i).join('\n\n').split('\n').length + 2
      });
      continue;
    }
    
    const timeMatch = timeLine.match(/^(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})$/);
    
    if (!timeMatch) {
      errors.push({
        type: 'INVALID_TIMECODE',
        message: `Invalid time format in block ${i + 1}`,
        lineNumber: blocks.slice(0, i).join('\n\n').split('\n').length + 2
      });
      continue;
    }

    const startTime = timeMatch[1];
    const endTime = timeMatch[2];

    // Validate text content
    const text = lines.slice(2).join('\n').trim();
    if (!text) {
      errors.push({
        type: 'EMPTY_CUE',
        message: `Empty cue text in block ${i + 1}`,
        cueIndex: i
      });
    }

    cues.push({
      startTime,
      endTime,
      text
    });
  }

  // Check for overlapping cues
  for (let i = 0; i < cues.length - 1; i++) {
    const currentEnd = timeToMilliseconds(cues[i]!.endTime);
    const nextStart = timeToMilliseconds(cues[i + 1]!.startTime);
    
    if (currentEnd > nextStart) {
      errors.push({
        type: 'OVERLAPPING_CUES',
        message: `Overlapping cues: cue ${i + 1} ends after cue ${i + 2} starts`,
        cueIndex: i
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Convert SRT time format (HH:MM:SS,mmm) to milliseconds
 * @param timeString - Time in HH:MM:SS,mmm format
 * @returns Time in milliseconds
 */
function timeToMilliseconds(timeString: string): number {
  const match = timeString.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}