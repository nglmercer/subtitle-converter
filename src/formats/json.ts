import type { SubtitleCue, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

/**
 * Represents a subtitle caption in JSON format
 */
export interface JsonCaption {
  type: 'caption' | 'meta';
  index: number;
  start: number;        // milliseconds
  end: number;          // milliseconds
  duration: number;     // milliseconds
  content: string;      // formatted content (with formatting tags)
  text: string;         // plain text content
}

/**
 * Parse JSON subtitle content and convert it to an array of SubtitleCue objects
 * @param jsonContent - Complete JSON subtitle content as string
 * @returns Array of SubtitleCue objects
 */
export function parseJson(jsonContent: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  
  let captions: JsonCaption[];
  try {
    captions = JSON.parse(jsonContent);
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  if (!Array.isArray(captions)) {
    throw new Error('JSON content must be an array of captions');
  }
  
  for (const caption of captions) {
    // Skip meta entries, only process captions
    if (caption.type !== 'caption') continue;
    
    // Validate required fields
    if (typeof caption.start !== 'number' || typeof caption.end !== 'number') {
      throw new Error(`Caption ${caption.index} has invalid start/end times`);
    }
    
    if (!caption.text && !caption.content) {
      throw new Error(`Caption ${caption.index} has no text content`);
    }
    
    // Convert milliseconds to SRT time format
    const startTime = millisecondsToSrtTime(caption.start);
    const endTime = millisecondsToSrtTime(caption.end);
    
    // Use plain text if available, otherwise use content
    const text = caption.text || caption.content || '';
    
    cues.push({
      startTime,
      endTime,
      text: text.trim()
    });
  }
  
  return cues;
}

/**
 * Convert an array of SubtitleCue objects to JSON format
 * @param cues - Array of SubtitleCue objects
 * @returns JSON formatted string
 */
export function toJson(cues: SubtitleCue[]): string {
  const captions: JsonCaption[] = cues.map((cue, index) => {
    const start = timeToMilliseconds(cue.startTime);
    const end = timeToMilliseconds(cue.endTime);
    const duration = end - start;
    
    return {
      type: 'caption',
      index: index + 1,
      start,
      end,
      duration,
      content: cue.text,
      text: cue.text
    };
  });
  
  return JSON.stringify(captions, null, 2);
}

/**
 * Validate JSON subtitle structure
 * @param jsonContent - Complete JSON subtitle content as string
 * @returns ValidationResult with errors and warnings
 */
export function validateJsonStructure(jsonContent: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  let captions: any[];
  try {
    captions = JSON.parse(jsonContent);
  } catch (error) {
    errors.push({
      type: 'INVALID_FORMAT',
      message: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return { isValid: false, errors, warnings };
  }
  
  if (!Array.isArray(captions)) {
    errors.push({
      type: 'INVALID_FORMAT',
      message: 'JSON content must be an array'
    });
    return { isValid: false, errors, warnings };
  }
  
  const cues: SubtitleCue[] = [];
  
  for (let i = 0; i < captions.length; i++) {
    const caption = captions[i];
    
    // Skip meta entries
    if (caption?.type === 'meta') continue;
    
    // Validate type field
    if (caption?.type !== 'caption') {
      errors.push({
        type: 'INVALID_FORMAT',
        message: `Entry ${i} has invalid type: "${caption?.type}"`,
        cueIndex: i
      });
      continue;
    }
    
    // Validate index
    if (typeof caption.index !== 'number') {
      errors.push({
        type: 'MISSING_CUE_NUMBER',
        message: `Caption ${i} has invalid or missing index`,
        cueIndex: i
      });
    }
    
    // Validate start time
    if (typeof caption.start !== 'number' || caption.start < 0) {
      errors.push({
        type: 'INVALID_TIMECODE',
        message: `Caption ${i} has invalid start time: ${caption.start}`,
        cueIndex: i
      });
      continue;
    }
    
    // Validate end time
    if (typeof caption.end !== 'number' || caption.end < 0) {
      errors.push({
        type: 'INVALID_TIMECODE',
        message: `Caption ${i} has invalid end time: ${caption.end}`,
        cueIndex: i
      });
      continue;
    }
    
    // Validate start < end
    if (caption.start >= caption.end) {
      errors.push({
        type: 'INVALID_TIMECODE',
        message: `Caption ${i} has start time >= end time`,
        cueIndex: i
      });
      continue;
    }
    
    // Validate duration (should match calculated duration)
    if (typeof caption.duration === 'number') {
      const calculatedDuration = caption.end - caption.start;
      if (Math.abs(caption.duration - calculatedDuration) > 1) {
        warnings.push({
          type: 'LONG_DURATION',
          message: `Caption ${i} duration field (${caption.duration}) doesn't match calculated duration (${calculatedDuration})`,
          cueIndex: i
        });
      }
    }
    
    // Validate text content
    if (!caption.text && !caption.content) {
      errors.push({
        type: 'EMPTY_CUE',
        message: `Caption ${i} has no text or content`,
        cueIndex: i
      });
    }
    
    const text = caption.text || caption.content || '';
    if (text.trim() === '') {
      errors.push({
        type: 'EMPTY_CUE',
        message: `Caption ${i} has empty text content`,
        cueIndex: i
      });
    }
    
    // Add to cues for overlap checking
    cues.push({
      startTime: millisecondsToSrtTime(caption.start),
      endTime: millisecondsToSrtTime(caption.end),
      text
    });
  }
  
  // Check for overlapping cues
  for (let i = 0; i < cues.length - 1; i++) {
    const currentCue = cues[i];
    const nextCue = cues[i + 1];
    
    if (!currentCue || !nextCue) continue;
    
    const currentEnd = timeToMilliseconds(currentCue.endTime);
    const nextStart = timeToMilliseconds(nextCue.startTime);
    
    if (currentEnd > nextStart) {
      errors.push({
        type: 'OVERLAPPING_CUES',
        message: `Overlapping captions: caption ${i + 1} ends after caption ${i + 2} starts`,
        cueIndex: i
      });
    }
  }
  
  // Check for large gaps between cues
  for (let i = 0; i < cues.length - 1; i++) {
    const currentCue = cues[i];
    const nextCue = cues[i + 1];
    
    if (!currentCue || !nextCue) continue;
    
    const currentEnd = timeToMilliseconds(currentCue.endTime);
    const nextStart = timeToMilliseconds(nextCue.startTime);
    const gap = nextStart - currentEnd;
    
    // Warn about gaps larger than 5 seconds
    if (gap > 5000) {
      warnings.push({
        type: 'GAP_BETWEEN_CUES',
        message: `Large gap (${(gap / 1000).toFixed(1)}s) between caption ${i + 1} and ${i + 2}`,
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
 * Convert milliseconds to SRT time format (HH:MM:SS,mmm)
 * @param milliseconds - Time in milliseconds
 * @returns Time in HH:MM:SS,mmm format
 */
function millisecondsToSrtTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor(milliseconds % 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(ms, 3)}`;
}

/**
 * Convert time string to milliseconds
 * Supports both SRT (HH:MM:SS,mmm) and VTT (HH:MM:SS.mmm) formats
 * @param timeString - Time in format HH:MM:SS,mmm or HH:MM:SS.mmm
 * @returns Time in milliseconds
 */
function timeToMilliseconds(timeString: string): number {
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

/**
 * Helper function to pad numbers with leading zeros
 * @param num - Number to pad
 * @param size - Desired length (default: 2)
 * @returns Padded string
 */
function pad(num: number, size: number = 2): string {
  return num.toString().padStart(size, '0');
}