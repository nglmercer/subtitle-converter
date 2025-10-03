/**
 * Time utility functions for subtitle processing
 */

/**
 * Convert time string to milliseconds
 * Supports both SRT (HH:MM:SS,mmm) and VTT (HH:MM:SS.mmm) formats
 * @param timeString - Time in format HH:MM:SS,mmm or HH:MM:SS.mmm
 * @returns Time in milliseconds
 */
export function timeToMilliseconds(timeString: string): number {
  // Handle both SRT (comma) and VTT (dot) formats
  const normalizedTime = timeString.replace(',', '.');
  const match = normalizedTime.match(/^(\d{2,}):(\d{2}):(\d{2})\.(\d{3})$/);
  
  if (!match) {
    throw new Error(`Invalid time format: ${timeString}`);
  }

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const milliseconds = parseInt(match[4]!, 10);

  // Validate ranges (allow hours up to 24, but reject hours >= 25)
  if (hours > 24 || minutes > 59 || seconds > 59) {
    throw new Error(`Invalid time format: ${timeString}`);
  }

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

/**
 * Convert milliseconds to SRT time format (HH:MM:SS,mmm)
 * @param milliseconds - Time in milliseconds
 * @returns Time in HH:MM:SS,mmm format
 */
export function millisecondsToSrtTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor(milliseconds % 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(ms, 3)}`;
}

/**
 * Convert milliseconds to VTT time format (HH:MM:SS.mmm)
 * @param milliseconds - Time in milliseconds
 * @returns Time in HH:MM:SS.mmm format
 */
export function millisecondsToVttTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = milliseconds % 1000;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(ms, 3)}`;
}

/**
 * Validate time format
 * @param timeString - Time string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimeFormat(timeString: string): boolean {
  try {
    timeToMilliseconds(timeString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate duration between two time strings
 * @param startTime - Start time in HH:MM:SS,mmm or HH:MM:SS.mmm format
 * @param endTime - End time in HH:MM:SS,mmm or HH:MM:SS.mmm format
 * @returns Duration in milliseconds
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMs = timeToMilliseconds(startTime);
  const endMs = timeToMilliseconds(endTime);
  return endMs - startMs;
}

/**
 * Add milliseconds to a time string
 * @param timeString - Base time in HH:MM:SS,mmm or HH:MM:SS.mmm format
 * @param milliseconds - Milliseconds to add (can be negative)
 * @returns New time string in same format as input
 */
export function addMilliseconds(timeString: string, milliseconds: number): string {
  const baseMs = timeToMilliseconds(timeString);
  const newMs = baseMs + milliseconds;
  
  if (newMs < 0) {
    throw new Error('Resulting time cannot be negative');
  }

  // Preserve original format (comma or dot)
  if (timeString.includes(',')) {
    return millisecondsToSrtTime(newMs);
  } else {
    return millisecondsToVttTime(newMs);
  }
}

/**
 * Compare two time strings
 * @param time1 - First time string
 * @param time2 - Second time string
 * @returns -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 */
export function compareTimes(time1: string, time2: string): number {
  const ms1 = timeToMilliseconds(time1);
  const ms2 = timeToMilliseconds(time2);
  
  if (ms1 < ms2) return -1;
  if (ms1 > ms2) return 1;
  return 0;
}

/**
 * Check if two time ranges overlap
 * @param start1 - Start time of first range
 * @param end1 - End time of first range
 * @param start2 - Start time of second range
 * @param end2 - End time of second range
 * @returns true if ranges overlap, false otherwise
 */
export function doTimeRangesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const start1Ms = timeToMilliseconds(start1);
  const end1Ms = timeToMilliseconds(end1);
  const start2Ms = timeToMilliseconds(start2);
  const end2Ms = timeToMilliseconds(end2);

  return start1Ms < end2Ms && end1Ms > start2Ms;
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