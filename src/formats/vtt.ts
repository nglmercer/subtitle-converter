// Parche completo para src/formats/vtt.js

import type { SubtitleCue, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

/**
 * Parse VTT content and convert it to an array of SubtitleCue objects
 * ACEPTA TANTO PUNTOS COMO COMAS EN LOS TIEMPOS
 * @param vttContent - Complete VTT file content as string
 * @returns Array of SubtitleCue objects
 */
export function parseVtt(vttContent: string): SubtitleCue[] {
  const lines = vttContent.trim().split('\n');
  const cues: SubtitleCue[] = [];
  
  // Check for WEBVTT header
  if (!lines[0]?.startsWith('WEBVTT')) {
    throw new Error('Invalid VTT file: missing WEBVTT header');
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

    // Check if this is a timing line - ACEPTA TANTO PUNTOS COMO COMAS
    const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/);
    
    if (timeMatch) {
      // Start of a new cue
      if (inCue && cueTextLines.length > 0) {
        // Save previous cue
        currentCue.text = cueTextLines.join('\n').trim();
        if (currentCue.startTime && currentCue.endTime && currentCue.text) {
          cues.push(currentCue as SubtitleCue);
        }
      }
      
      // Normalizar: convertir comas a puntos para formato estándar
      currentCue = {
        startTime: timeMatch[1]!.replace(',', '.'),
        endTime: timeMatch[2]!.replace(',', '.'),
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
  let vttContent = 'WEBVTT';
  
  if (cues.length === 0) {
    return vttContent;
  }
  
  vttContent += '\n\n' + cues
    .map((cue) => {
      // Asegurar que los tiempos usen puntos (formato estándar VTT)
      const startTime = cue.startTime.replace(',', '.');
      const endTime = cue.endTime.replace(',', '.');
      const timeRange = `${startTime} --> ${endTime}`;
      return `${timeRange}\n${cue.text}`;
    })
    .join('\n\n');
  
  return vttContent;
}

/**
 * Validate VTT file structure (FIXED VERSION)
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
  let lastTimingLine = -1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    
    // Skip empty lines and metadata
    if (!line || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      if (inCue && lastTimingLine !== -1 && i > lastTimingLine + 1) {
        // Check if we have an empty cue (timing but no text)
        if (cueTextLines.length === 0) {
          errors.push({
            type: 'EMPTY_CUE',
            message: `Empty cue text`,
            lineNumber: lastTimingLine + 1
          });
        }
        
        // End of current cue
        currentCue.text = cueTextLines.join('\n').trim();
        if (currentCue.startTime && currentCue.endTime) {
          cues.push(currentCue as SubtitleCue);
        }
        currentCue = {};
        cueTextLines = [];
        inCue = false;
        lastTimingLine = -1;
      }
      continue;
    }

    // Check if this is a timing line - ACEPTA TANTO PUNTOS COMO COMAS
    const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/);
    
    if (timeMatch) {
      // Start of a new cue
      if (inCue && lastTimingLine !== -1 && cueTextLines.length === 0) {
        // Previous cue had timing but no text
        errors.push({
          type: 'EMPTY_CUE',
          message: `Empty cue text`,
          lineNumber: lastTimingLine + 1
        });
      }
      
      if (inCue && cueTextLines.length > 0) {
        // Save previous cue
        currentCue.text = cueTextLines.join('\n').trim();
        if (currentCue.startTime && currentCue.endTime) {
          cues.push(currentCue as SubtitleCue);
        }
      }
      
      // Normalizar el tiempo: convertir comas a puntos si es necesario
      const startTime = timeMatch[1]!.replace(',', '.');
      const endTime = timeMatch[2]!.replace(',', '.');
      
      // Agregar advertencia si se usaron comas (no es estándar pero lo aceptamos)
      if (timeMatch[1]!.includes(',') || timeMatch[2]!.includes(',')) {
        warnings.push({
          type: 'LONG_DURATION',
          message: `Non-standard time format at line ${i + 1}: VTT standard uses dots, not commas`,
          lineNumber: i + 1
        });
      }
      
      currentCue = {
        startTime,
        endTime,
      };
      cueTextLines = [];
      inCue = true;
      lastTimingLine = i;
    } else if (inCue) {
      // This is text content
      cueTextLines.push(line);
    } else if (line.match(/^\d{2}:\d{2}:\d{2}/)) {
      // Parece un tiempo pero con formato incorrecto
      errors.push({
        type: 'INVALID_TIMECODE',
        message: `Invalid time format at line ${i + 1}: ${line}`,
        lineNumber: i + 1
      });
    }
  }

  // Handle last cue
  if (inCue && currentCue.startTime && currentCue.endTime) {
    if (cueTextLines.length === 0) {
      errors.push({
        type: 'EMPTY_CUE',
        message: `Empty cue text`,
        lineNumber: lastTimingLine + 1
      });
    }
    currentCue.text = cueTextLines.join('\n').trim();
    cues.push(currentCue as SubtitleCue);
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
 * Convert VTT time format (HH:MM:SS.mmm or HH:MM:SS,mmm) to milliseconds
 * @param timeString - Time in HH:MM:SS.mmm or HH:MM:SS,mmm format
 * @returns Time in milliseconds
 */
function timeToMilliseconds(timeString: string): number {
  const normalized = timeString.replace(',', '.');
  const match = normalized.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) return 0;

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const milliseconds = parseInt(match[4]!, 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}