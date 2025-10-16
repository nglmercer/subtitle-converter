/**
 * Type definitions for subconv-ts
 */

/**
 * Represents a single subtitle cue/block (legacy format for backward compatibility)
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
 * Universal JSON format for subtitle interchange
 * This format preserves all metadata, styles, and format-specific information
 * to enable lossless conversions between formats
 */
export interface UniversalSubtitle {
  /**
   * Format version for future compatibility
   */
  version: string;
  /**
   * Original source format
   */
  sourceFormat: SubtitleFormat;
  /**
   * Global metadata from the original file
   */
  metadata: SubtitleMetadata;
  /**
   * Style definitions (for formats that support styling)
   */
  styles: StyleDefinition[];
  /**
   * Array of subtitle cues with rich information
   */
  cues: UniversalCue[];
}

/**
 * Global metadata for subtitle files
 */
export interface SubtitleMetadata {
  /**
   * Title of the subtitle file
   */
  title?: string;
  /**
   * Language code (e.g., 'en', 'es', 'fr')
   */
  language?: string;
  /**
   * Original author or creator
   */
  author?: string;
  /**
   * Description or comments
   */
  description?: string;
  /**
   * Format-specific metadata (preserved for reversibility)
   */
  formatSpecific?: {
    /**
     * ASS/SSA specific metadata
     */
    ass?: {
      scriptType?: string;
      wrapStyle?: string;
      playResX?: number;
      playResY?: number;
      scaledborderandshadow?: string;
      collisions?: string;
      playDepth?: number;
      timer?: string;
      [key: string]: any;
    };
    /**
     * VTT specific metadata
     */
    vtt?: {
      regions?: VttRegion[];
      notes?: string[];
      [key: string]: any;
    };
    /**
     * Additional format-specific data
     */
    [format: string]: any;
  };
}

/**
 * VTT region definition
 */
export interface VttRegion {
  id: string;
  width?: string;
  lines?: number;
  regionAnchor?: string;
  viewportAnchor?: string;
  scroll?: string;
}

/**
 * Style definition for subtitle formatting
 */
export interface StyleDefinition {
  /**
   * Unique name/identifier for the style
   */
  name: string;
  /**
   * Font family
   */
  fontName?: string;
  /**
   * Font size
   */
  fontSize?: number;
  /**
   * Primary color (hex format)
   */
  primaryColor?: string;
  /**
   * Secondary color (hex format)
   */
  secondaryColor?: string;
  /**
   * Outline color (hex format)
   */
  outlineColor?: string;
  /**
   * Background/shadow color (hex format)
   */
  backColor?: string;
  /**
   * Bold flag
   */
  bold?: boolean;
  /**
   * Italic flag
   */
  italic?: boolean;
  /**
   * Underline flag
   */
  underline?: boolean;
  /**
   * Strikeout flag
   */
  strikeOut?: boolean;
  /**
   * Horizontal scale percentage
   */
  scaleX?: number;
  /**
   * Vertical scale percentage
   */
  scaleY?: number;
  /**
   * Letter spacing
   */
  spacing?: number;
  /**
   * Rotation angle
   */
  angle?: number;
  /**
   * Border style
   */
  borderStyle?: number;
  /**
   * Outline width
   */
  outline?: number;
  /**
   * Shadow depth
   */
  shadow?: number;
  /**
   * Text alignment (1-9 for numpad positions)
   */
  alignment?: number;
  /**
   * Left margin
   */
  marginL?: number;
  /**
   * Right margin
   */
  marginR?: number;
  /**
   * Vertical margin
   */
  marginV?: number;
  /**
   * Character encoding
   */
  encoding?: number;
  /**
   * Format-specific style properties
   */
  formatSpecific?: {
    [key: string]: any;
  };
}

/**
 * Enhanced subtitle cue with comprehensive information
 */
export interface UniversalCue {
  /**
   * Cue index/sequence number
   */
  index: number;
  /**
   * Start time in milliseconds
   */
  startTime: number;
  /**
   * End time in milliseconds
   */
  endTime: number;
  /**
   * Duration in milliseconds (computed)
   */
  duration: number;
  /**
   * Plain text content (without formatting)
   */
  text: string;
  /**
   * Formatted content (with inline formatting tags preserved)
   */
  content: string;
  /**
   * Style name reference (for formats that support styles)
   */
  style?: string;
  /**
   * Cue identifier (for VTT named cues)
   */
  identifier?: string;
  /**
   * Position and layout settings
   */
  layout?: CueLayout;
  /**
   * Inline formatting information
   */
  formatting?: InlineFormatting[];
  /**
   * Format-specific properties for reversibility
   */
  formatSpecific?: {
    /**
     * ASS/SSA specific properties
     */
    ass?: {
      layer?: number;
      effect?: string;
      actor?: string;
      marginL?: number;
      marginR?: number;
      marginV?: number;
      [key: string]: any;
    };
    /**
     * VTT specific properties
     */
    vtt?: {
      region?: string;
      vertical?: string;
      line?: string | number;
      position?: string | number;
      size?: string | number;
      align?: string;
      [key: string]: any;
    };
    /**
     * Additional format-specific data
     */
    [format: string]: any;
  };
}

/**
 * Layout and positioning information for a cue
 */
export interface CueLayout {
  /**
   * Horizontal alignment (left, center, right)
   */
  align?: "left" | "center" | "right" | "start" | "end";
  /**
   * Vertical alignment (top, middle, bottom)
   */
  verticalAlign?: "top" | "middle" | "bottom";
  /**
   * Line position
   */
  line?: number | string;
  /**
   * Horizontal position
   */
  position?: number | string;
  /**
   * Text size/width
   */
  size?: number | string;
  /**
   * Region identifier (for VTT)
   */
  region?: string;
}

/**
 * Inline formatting span within a cue
 */
export interface InlineFormatting {
  /**
   * Start position in text (character index)
   */
  start: number;
  /**
   * End position in text (character index)
   */
  end: number;
  /**
   * Formatting type
   */
  type: "bold" | "italic" | "underline" | "color" | "font" | "custom";
  /**
   * Value for the formatting (e.g., color hex, font name)
   */
  value?: string;
  /**
   * Custom formatting tag (for preserving unknown tags)
   */
  customTag?: string;
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
  type:
    | "INVALID_FORMAT"
    | "OVERLAPPING_CUES"
    | "INVALID_TIMECODE"
    | "MISSING_CUE_NUMBER"
    | "EMPTY_CUE";
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
  type:
    | "SHORT_DURATION"
    | "LONG_DURATION"
    | "GAP_BETWEEN_CUES"
    | "EXCESSIVE_LINES"
    | "EMPTY_CUE";
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
export type SubtitleFormat = "srt" | "vtt" | "ass" | "json";

/**
 * Conversion options for format transformations
 */
export interface ConversionOptions {
  /**
   * Preserve styles when converting (if target format supports it)
   */
  preserveStyles?: boolean;
  /**
   * Preserve formatting tags when converting
   */
  preserveFormatting?: boolean;
  /**
   * Strip all formatting and return plain text
   */
  plainTextOnly?: boolean;
  /**
   * Default style to use if target format requires one
   */
  defaultStyle?: string;
  /**
   * Include metadata in conversion
   */
  includeMetadata?: boolean;
  /**
   * Format-specific conversion options
   */
  formatSpecific?: {
    [format: string]: any;
  };
}
