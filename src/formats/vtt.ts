import type { SubtitleCue, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

/**
 * Parse VTT content and convert it to an array of SubtitleCue objects
 * @param vttContent - Complete VTT file content as string
 * @returns Array of SubtitleCue objects
 */
export function parseVtt(vttContent: string): SubtitleCue[] {
  const lines = vttContent.trim().split('\n');
  const cues: SubtitleCue[] = [];
  
  // Check for WEBVTT header
  if (!lines[0]?.startsWith('WEBVTT')) {
    return cues; // Invalid VTT file
  }

  let currentCue: Partial<SubtitleCue> = {};
  let inCue = false;
  let cueTextLines: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    
    // Skip empty lines and metadata
    if (!line || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      if (inCue && cueTextLines.length > 0) {
        // End of current cue
        currentCue.text = cueTextLines.join('\n').trim();
        if (currentCue.startTime && currentCue.endTime && currentCue.text) {
          cues.push(currentCue as SubtitleCue);
        }
        currentCue = {};
        cueTextLines = [];
        inCue = false;
      }
      continue;
    }

    // Check if this is a timing line
    const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
    
    if (timeMatch) {
      // Start of a new cue
      if (inCue && cueTextLines.length > 0) {
        // Save previous cue
        currentCue.text = cueTextLines.join('\n').trim();
        if (currentCue.startTime && currentCue.endTime && currentCue.text) {
          cues.push(currentCue as SubtitleCue);
        }
      }
      
      currentCue = {
        startTime: timeMatch[1],
        endTime: timeMatch[2]
      };
      cueTextLines = [];
      inCue = true;
    } else if (inCue) {
      // This is text content
      cueTextLines.push(line);
    }
  }

  // Handle last cue
  if (inCue && cueTextLines.length > 0 && currentCue.startTime && currentCue.endTime) {
    currentCue.text = cueTextLines.join('\n').trim();
    if (currentCue.text) {
      cues.push(currentCue as SubtitleCue);
    }
  }

  return cues;
}

/**
 * Convert an array of SubtitleCue objects to VTT format
 * @param cues - Array of SubtitleCue objects
 * @returns VTT formatted string
 */
export function toVtt(cues: SubtitleCue[]): string {
  let vttContent = 'WEBVTT\n\n';
  
  if (cues.length === 0) {
    return vttContent;
  }
  
  vttContent += cues
    .map((cue) => {
      const timeRange = `${cue.startTime} --> ${cue.endTime}`;
      return `${timeRange}\n${cue.text}`;
    })
    .join('\n\n');
  
  return vttContent;
}

/**
 * Validate VTT file structure
 * @param vttContent - Complete VTT file content as string
 * @returns ValidationResult with errors and warnings
 */
export function validateVttStructure(vttContent: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const lines = vttContent.trim().split('\n');
  const cues: SubtitleCue[] = [];

  // Validate WEBVTT header
  if (!lines[0]?.startsWith('WEBVTT')) {
    errors.push({
      type: 'INVALID_FORMAT',
      message: 'Missing or invalid WEBVTT header',
      lineNumber: 1
    });
  }

  let currentCue: Partial<SubtitleCue> = {};
  let inCue = false;
  let cueTextLines: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    
    // Skip empty lines and metadata
    if (!line || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      if (inCue && cueTextLines.length > 0) {
        // End of current cue
        currentCue.text = cueTextLines.join('\n').trim();
        if (currentCue.startTime && currentCue.endTime && currentCue.text) {
          cues.push(currentCue as SubtitleCue);
        }
        currentCue = {};
        cueTextLines = [];
        inCue = false;
      }
      continue;
    }

    // Check if this is a timing line
    const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
    
    if (timeMatch) {
      // Start of a new cue
      if (inCue && cueTextLines.length > 0) {
        // Save previous cue
        currentCue.text = cueTextLines.join('\n').trim();
        if (currentCue.startTime && currentCue.endTime && currentCue.text) {
          cues.push(currentCue as SubtitleCue);
        }
      }
      
      currentCue = {
        startTime: timeMatch[1],
        endTime: timeMatch[2]
      };
      cueTextLines = [];
      inCue = true;
    } else if (inCue) {
      // This is text content
      cueTextLines.push(line);
    }
  }

  // Handle last cue
  if (inCue && cueTextLines.length > 0 && currentCue.startTime && currentCue.endTime) {
    currentCue.text = cueTextLines.join('\n').trim();
    if (currentCue.text) {
      cues.push(currentCue as SubtitleCue);
    }
  }

  // Validate each cue
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (!cue) continue;
    
    if (!cue.text?.trim()) {
      errors.push({
        type: 'EMPTY_CUE',
        message: `Empty cue text in cue ${i + 1}`,
        cueIndex: i
      });
    }

    // Validate time format
    const startMatch = cue.startTime?.match(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
    const endMatch = cue.endTime?.match(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
    
    if (!startMatch || !endMatch) {
      errors.push({
        type: 'INVALID_TIMECODE',
        message: `Invalid time format in cue ${i + 1}`,
        cueIndex: i
      });
    }
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
 * Convert VTT time format (HH:MM:SS.mmm) to milliseconds
 * @param timeString - Time in HH:MM:SS.mmm format
 * @returns Time in milliseconds
 */
function timeToMilliseconds(timeString: string): number {
  const match = timeString.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}