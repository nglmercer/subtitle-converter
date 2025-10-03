import type { SubtitleCue, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

/**
 * Parse ASS content and convert it to an array of SubtitleCue objects
 * @param assContent - Complete ASS file content as string
 * @returns Array of SubtitleCue objects
 */
export function parseAss(assContent: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  
  const lines = assContent.trim().split(/\r?\n/);
  
  let inEventsSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith(';')) continue;
    
    // Check if we're entering the Events section
    if (trimmedLine === '[Events]') {
      inEventsSection = true;
      continue;
    }
    
    // Skip if we're not in the Events section
    if (!inEventsSection) continue;
    
    // Skip section headers and format lines
    if (trimmedLine.startsWith('[') || trimmedLine.startsWith('Format:')) continue;
    
    // Parse dialogue line
    if (trimmedLine.startsWith('Dialogue:')) {
      const dialogueMatch = trimmedLine.match(/^Dialogue:\s*(\d+),([^,]+),([^,]+),[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,([^,]*),(.*)$/);
      
      if (dialogueMatch) {
        const layer = dialogueMatch[1];
        const startTime = convertAssTimeToStandard(dialogueMatch[2]!);
        const endTime = convertAssTimeToStandard(dialogueMatch[3]!);
        const style = dialogueMatch[4]!;
        const text = dialogueMatch[5]!;
        
        // Clean up ASS formatting tags and convert to plain text
        const cleanText = cleanAssText(text);
        
        if (cleanText) {
          cues.push({
            startTime,
            endTime,
            text: cleanText
          });
        }
      }
    }
    
    // Stop parsing if we hit another section
    if (trimmedLine.startsWith('[') && trimmedLine !== '[Events]') {
      break;
    }
  }
  
  return cues;
}

/**
 * Convert an array of SubtitleCue objects to ASS format
 * @param cues - Array of SubtitleCue objects
 * @returns ASS formatted string
 */
export function toAss(cues: SubtitleCue[]): string {
  let assContent = `[Script Info]
Title: Converted Subtitle
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  if (cues.length === 0) {
    return assContent;
  }
  
  assContent += cues
    .map((cue, index) => {
      const startTime = convertStandardTimeToAss(cue.startTime);
      const endTime = convertStandardTimeToAss(cue.endTime);
      const layer = '0';
      const style = 'Default';
      const name = '';
      const marginL = '0';
      const marginR = '0';
      const marginV = '0';
      const effect = '';
      
      // Convert text to ASS format (replace newlines with \N)
      const assText = cue.text.replace(/\n/g, '\\N');
      
      return `Dialogue: ${layer},${startTime},${endTime},${style},${name},${marginL},${marginR},${marginV},${effect},${assText}`;
    })
    .join('\n');
  
  return assContent;
}

/**
 * Validate ASS file structure
 * @param assContent - Complete ASS file content as string
 * @returns ValidationResult with errors and warnings
 */
export function validateAssStructure(assContent: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const lines = assContent.trim().split('\n');
  
  let hasScriptInfo = false;
  let hasV4Styles = false;
  let hasEvents = false;
  let inEventsSection = false;
  let dialogueCount = 0;
  const cues: SubtitleCue[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    
    if (!line || line.startsWith(';')) continue;
    
    // Check for required sections
    if (line === '[Script Info]') {
      hasScriptInfo = true;
      continue;
    }
    
    if (line === '[V4+ Styles]') {
      hasV4Styles = true;
      continue;
    }
    
    if (line === '[Events]') {
      hasEvents = true;
      inEventsSection = true;
      continue;
    }
    
    // Validate dialogue lines
    if (inEventsSection && line.startsWith('Dialogue:')) {
      dialogueCount++;
      
      const dialogueMatch = line.match(/^Dialogue:\s*(\d+),([^,]+),([^,]+),[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,([^,]*),(.*)$/);
      
      if (!dialogueMatch) {
        errors.push({
          type: 'INVALID_FORMAT',
          message: `Invalid dialogue format on line ${i + 1}`,
          lineNumber: i + 1
        });
        continue;
      }
      
      const startTimeRaw = dialogueMatch[2]!;
      const endTimeRaw = dialogueMatch[3]!;
      const text = dialogueMatch[5]!;
      
      // Validate raw ASS time format first (H:MM:SS.cc)
      const timeRegex = /^\d+:\d{2}:\d{2}\.\d{2}$/;
      
      if (!timeRegex.test(startTimeRaw)) {
        errors.push({
          type: 'INVALID_TIMECODE',
          message: `Invalid start time format on line ${i + 1}: "${startTimeRaw}"`,
          lineNumber: i + 1
        });
        continue; // Skip further processing for this line
      }
      
      if (!timeRegex.test(endTimeRaw)) {
        errors.push({
          type: 'INVALID_TIMECODE',
          message: `Invalid end time format on line ${i + 1}: "${endTimeRaw}"`,
          lineNumber: i + 1
        });
        continue; // Skip further processing for this line
      }
      
      const startTime = convertAssTimeToStandard(startTimeRaw);
      const endTime = convertAssTimeToStandard(endTimeRaw);
      
      // Validate that start time is before end time
      if (timeToMilliseconds(startTime) >= timeToMilliseconds(endTime)) {
        errors.push({
          type: 'INVALID_TIMECODE',
          message: `Start time must be before end time on line ${i + 1}`,
          lineNumber: i + 1
        });
        continue;
      }
      
      const cleanText = cleanAssText(text);
      if (cleanText) {
        cues.push({
          startTime,
          endTime,
          text: cleanText
        });
      }
    }
    
    // Stop parsing events if we hit another section
    if (line.startsWith('[') && line !== '[Events]') {
      inEventsSection = false;
    }
  }
  
  // Validate required sections
  if (!hasScriptInfo) {
    errors.push({
      type: 'INVALID_FORMAT',
      message: 'Missing [Script Info] section'
    });
  }
  
  if (!hasV4Styles) {
    errors.push({
      type: 'INVALID_FORMAT',
      message: 'Missing [V4+ Styles] section'
    });
  }
  
  if (!hasEvents) {
    errors.push({
      type: 'INVALID_FORMAT',
      message: 'Missing [Events] section'
    });
  }
  
  if (dialogueCount === 0) {
    warnings.push({
      type: 'EMPTY_CUE',
      message: 'No dialogue lines found in the file'
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
 * Convert ASS time format (H:MM:SS.cc) to standard format (HH:MM:SS,mmm)
 * @param assTime - Time in H:MM:SS.cc format (ASS format)
 * @returns Time in HH:MM:SS,mmm format (SRT format)
 */
function convertAssTimeToStandard(assTime: string): string {
  // ASS format: H:MM:SS.cc (centiseconds)
  // Standard format: HH:MM:SS,mmm (milliseconds)
  const match = assTime.match(/^(\d+):(\d{2}):(\d{2})\.(\d{2})$/);
  
  if (!match) {
    // Return a default time instead of throwing to handle validation gracefully
    return '00:00:00,000';
  }
  
  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const centiseconds = parseInt(match[4]!, 10);
  
  // Convert centiseconds to milliseconds
  const milliseconds = centiseconds * 10;
  
  // Format as HH:MM:SS,mmm
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Convert standard time format (HH:MM:SS,mmm) to ASS format (H:MM:SS.cc)
 * @param standardTime - Time in HH:MM:SS,mmm format (SRT format)
 * @returns Time in H:MM:SS.cc format (ASS format)
 */
function convertStandardTimeToAss(standardTime: string): string {
  // Standard format: HH:MM:SS,mmm (milliseconds)
  // ASS format: H:MM:SS.cc (centiseconds)
  const match = standardTime.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  
  if (!match) {
    // Return a default time instead of throwing to handle validation gracefully
    return '0:00:00.00';
  }
  
  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const milliseconds = parseInt(match[4]!, 10);
  
  // Convert milliseconds to centiseconds (truncate, don't round)
  const centiseconds = Math.floor(milliseconds / 10);
  
  // Format as H:MM:SS.cc
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

/**
 * Clean ASS text by removing formatting tags and converting special characters
 * @param assText - Raw ASS text with formatting tags
 * @returns Clean text suitable for display
 */
function cleanAssText(assText: string): string {
  // Remove ASS formatting tags
  let cleanText = assText;
  
  // Remove basic ASS tags
  cleanText = cleanText.replace(/\{[^}]*\}/g, '');
  
  // Convert ASS line breaks to regular newlines
  // Use String.fromCharCode to avoid bundler issues with literal newlines
  cleanText = cleanText.replace(/\\N/g, String.fromCharCode(10)); // hard line break (\n)
  
  cleanText = cleanText.replace(/\\n/g, ' '); // soft line break
  
  // Remove other ASS escape sequences
  cleanText = cleanText.replace(/\\h/g, ' '); // Non-breaking space
  
  // Trim whitespace
  cleanText = cleanText.trim();
  
  return cleanText;
}

/**
 * Validate time format (HH:MM:SS,mmm)
 * @param timeString - Time string to validate
 * @returns true if valid, false otherwise
 */
function isValidTimeFormat(timeString: string): boolean {
  const match = timeString.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  return match !== null;
}

/**
 * Convert time string to milliseconds
 * @param timeString - Time in HH:MM:SS,mmm format
 * @returns Time in milliseconds
 */
function timeToMilliseconds(timeString: string): number {
  const match = timeString.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) return 0;

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const milliseconds = parseInt(match[4]!, 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}