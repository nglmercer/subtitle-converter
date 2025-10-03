/**
 * Represents a single subtitle cue/block
 */
export interface SubtitleCue {
  /**
   * The start time of the subtitle in HH:MM:SS,mmm (SRT) or HH:MM:SS.mmm (VTT) format
   */
  startTime: string;
  /**
   * The end time of the subtitle in HH:MM:SS,mmm (SRT) or HH:MM:SS.mmm (VTT) format
   */
  endTime: string;
  /**
   * The text content of the subtitle. May contain line breaks.
   */
  text: string;
}

/**
 * Contains detailed information about subtitle file analysis
 */
export interface SubtitleAnalysis {
  /**
   * Total number of subtitles (cues) in the file
   */
  totalCues: number;
  /**
   * Total duration of the subtitle in milliseconds
   */
  totalDuration: number;
  /**
   * Start time of the first subtitle
   */
  startTime: string;
  /**
   * End time of the last subtitle
   */
  endTime: string;
  /**
   * Average duration of subtitles in milliseconds
   */
  averageDuration: number;
  /**
   * Subtitle with the shortest duration
   */
  shortestCue: SubtitleCue & { duration: number };
  /**
   * Subtitle with the longest duration
   */
  longestCue: SubtitleCue & { duration: number };
  /**
   * Total number of text lines in all subtitles
   */
  totalLines: number;
  /**
   * Average number of lines per subtitle
   */
  averageLinesPerCue: number;
}

/**
 * Result of subtitle file integrity validation
 */
export interface ValidationResult {
  /**
   * Indicates whether the file is valid or not
   */
  isValid: boolean;
  /**
   * List of errors found during validation
   */
  errors: ValidationError[];
  /**
   * List of warnings found during validation
   */
  warnings: ValidationWarning[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  /**
   * Type of error
   */
  type: 'INVALID_FORMAT' | 'OVERLAPPING_CUES' | 'INVALID_TIMECODE' | 'MISSING_CUE_NUMBER' | 'EMPTY_CUE';
  /**
   * Descriptive error message
   */
  message: string;
  /**
   * Line number where the error was found (if applicable)
   */
  lineNumber?: number;
  /**
   * Index of the cue where the error was found (if applicable)
   */
  cueIndex?: number;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /**
   * Type of warning
   */
  type: 'SHORT_DURATION' | 'LONG_DURATION' | 'GAP_BETWEEN_CUES' | 'EXCESSIVE_LINES' | 'EMPTY_CUE';
  /**
   * Descriptive warning message
   */
  message: string;
  /**
   * Line number where the warning was found (if applicable)
   */
  lineNumber?: number;
  /**
   * Index of the cue where the warning was found (if applicable)
   */
  cueIndex?: number;
}

/**
 * Supported subtitle formats
 */
export type SubtitleFormat = 'srt' | 'vtt' | 'ass';