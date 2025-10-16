/**
 * SubtitleEditor - Safe subtitle manipulation class
 *
 * Provides a high-level API for editing subtitles in any format with:
 * - Safe fragment-based editing
 * - Automatic validation
 * - Format conversion
 * - AI-friendly operations (MCP compatible)
 * - Undo/redo support
 * - Transaction-based changes
 */

import type {
  SubtitleFormat,
  UniversalSubtitle,
  UniversalCue,
  SubtitleMetadata,
  StyleDefinition,
  ConversionOptions,
  ValidationResult,
} from "./types.js";

import {
  parseToUniversal,
  formatFromUniversal,
  cloneUniversal,
  getUniversalStats,
} from "./index.js";

/**
 * Change event types
 */
export type ChangeType =
  | "cue-added"
  | "cue-updated"
  | "cue-deleted"
  | "metadata-updated"
  | "style-added"
  | "style-updated"
  | "style-deleted"
  | "batch-update";

/**
 * Change event
 */
export interface ChangeEvent {
  type: ChangeType;
  timestamp: number;
  data: any;
}

/**
 * History entry for undo/redo
 */
interface HistoryEntry {
  state: UniversalSubtitle;
  event: ChangeEvent;
}

/**
 * Search options
 */
export interface SearchOptions {
  caseSensitive?: boolean;
  regex?: boolean;
  includeContent?: boolean; // Search in formatted content too
  timeRange?: {
    start: number;
    end: number;
  };
  styles?: string[];
  layers?: number[];
}

/**
 * Fragment context for AI operations
 */
export interface FragmentContext {
  cue: UniversalCue;
  index: number;
  previous?: UniversalCue;
  next?: UniversalCue;
  timeFromStart: number;
  timeToEnd: number;
  style?: StyleDefinition;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  checkOverlaps?: boolean;
  checkDurations?: boolean;
  checkTextLength?: boolean;
  maxTextLength?: number;
  minDuration?: number;
  maxDuration?: number;
}

/**
 * SubtitleEditor class for safe subtitle manipulation
 */
export class SubtitleEditor {
  private universal: UniversalSubtitle;
  private history: HistoryEntry[] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number = 50;
  private changeListeners: Array<(event: ChangeEvent) => void> = [];
  private inBatch: boolean = false;

  /**
   * Create a SubtitleEditor from content or Universal JSON
   */
  constructor(
    content: string | UniversalSubtitle,
    format?: SubtitleFormat | "auto",
  ) {
    if (typeof content === "string") {
      this.universal = parseToUniversal(content, format || "auto");
    } else {
      this.universal = cloneUniversal(content);
    }

    // Save initial state
    this.saveHistory({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "initial" },
    });
  }

  // ============================================================================
  // BASIC ACCESSORS
  // ============================================================================

  /**
   * Get the Universal JSON representation
   */
  getUniversal(): UniversalSubtitle {
    return cloneUniversal(this.universal);
  }

  /**
   * Get source format
   */
  getSourceFormat(): SubtitleFormat {
    return this.universal.sourceFormat;
  }

  /**
   * Get metadata
   */
  getMetadata(): SubtitleMetadata {
    return { ...this.universal.metadata };
  }

  /**
   * Get all cues
   */
  getCues(): UniversalCue[] {
    return [...this.universal.cues];
  }

  /**
   * Get specific cue by index
   */
  getCue(index: number): UniversalCue | undefined {
    return this.universal.cues[index];
  }

  /**
   * Get cue by ID
   */
  getCueById(id: number): UniversalCue | undefined {
    return this.universal.cues.find((cue) => cue.index === id);
  }

  /**
   * Get all styles
   */
  getStyles(): StyleDefinition[] {
    return [...this.universal.styles];
  }

  /**
   * Get statistics
   */
  getStats() {
    return getUniversalStats(this.universal);
  }

  /**
   * Get total duration in milliseconds
   */
  getTotalDuration(): number {
    if (this.universal.cues.length === 0) return 0;
    const lastCue = this.universal.cues[this.universal.cues.length - 1];
    return lastCue ? lastCue.endTime : 0;
  }

  // ============================================================================
  // FRAGMENT-BASED OPERATIONS (AI-FRIENDLY)
  // ============================================================================

  /**
   * Get fragment context for AI operations
   * Provides surrounding context for better AI understanding
   */
  getFragmentContext(index: number): FragmentContext | null {
    const cue = this.universal.cues[index];
    if (!cue) return null;

    const previous = this.universal.cues[index - 1];
    const next = this.universal.cues[index + 1];
    const lastCue = this.universal.cues[this.universal.cues.length - 1];

    const style = this.universal.styles.find((s) => s.name === cue.style);

    const result: FragmentContext = {
      cue: { ...cue },
      index,
      timeFromStart: cue.startTime,
      timeToEnd: lastCue ? lastCue.endTime - cue.endTime : 0,
    };

    if (previous) {
      result.previous = { ...previous };
    }

    if (next) {
      result.next = { ...next };
    }

    if (style) {
      result.style = style;
    }

    return result;
  }

  /**
   * Get fragments in time range (useful for AI context)
   */
  getFragmentsInRange(
    startMs: number,
    endMs: number,
  ): Array<{ cue: UniversalCue; index: number }> {
    return this.universal.cues
      .map((cue, index) => ({ cue, index }))
      .filter(({ cue }) => cue.startTime >= startMs && cue.endTime <= endMs);
  }

  /**
   * Get fragments by speaker/actor (for dialogue editing)
   */
  getFragmentsBySpeaker(
    speaker: string,
  ): Array<{ cue: UniversalCue; index: number }> {
    return this.universal.cues
      .map((cue, index) => ({ cue, index }))
      .filter(({ cue }) => cue.formatSpecific?.ass?.actor === speaker);
  }

  /**
   * Update fragment safely (with validation)
   */
  updateFragment(
    index: number,
    updates: Partial<UniversalCue>,
    validate: boolean = true,
  ): boolean {
    const cue = this.universal.cues[index];
    if (!cue) return false;

    // Store original for rollback
    const original = { ...cue };

    try {
      // Apply updates
      Object.assign(cue, updates);

      // Recalculate duration if times changed
      if (updates.startTime !== undefined || updates.endTime !== undefined) {
        cue.duration = cue.endTime - cue.startTime;
      }

      // Validate if requested
      if (validate) {
        const validation = this.validateCue(index);
        if (!validation.isValid) {
          // Rollback
          Object.assign(cue, original);
          return false;
        }
      }

      // Emit change event
      this.emitChange({
        type: "cue-updated",
        timestamp: Date.now(),
        data: { index, updates, original },
      });

      this.saveHistory({
        type: "cue-updated",
        timestamp: Date.now(),
        data: { index, updates, original },
      });

      return true;
    } catch (error) {
      // Rollback on error
      Object.assign(cue, original);
      return false;
    }
  }

  /**
   * Update fragment text safely
   */
  updateFragmentText(
    index: number,
    text: string,
    updateContent: boolean = true,
  ): boolean {
    const updates: Partial<UniversalCue> = { text };
    if (updateContent) {
      updates.content = text; // Update formatted content too
    }
    return this.updateFragment(index, updates);
  }

  /**
   * Update fragment timing safely
   */
  updateFragmentTiming(
    index: number,
    startTime: number,
    endTime: number,
  ): boolean {
    if (startTime >= endTime) return false;
    return this.updateFragment(index, {
      startTime,
      endTime,
      duration: endTime - startTime,
    });
  }

  // ============================================================================
  // CUE OPERATIONS
  // ============================================================================

  /**
   * Add a new cue
   */
  addCue(cue: Omit<UniversalCue, "index">): number {
    const newIndex = this.universal.cues.length;
    const fullCue: UniversalCue = {
      ...cue,
      index: newIndex + 1,
    };

    this.universal.cues.push(fullCue);

    this.emitChange({
      type: "cue-added",
      timestamp: Date.now(),
      data: { cue: fullCue, index: newIndex },
    });

    this.saveHistory({
      type: "cue-added",
      timestamp: Date.now(),
      data: { cue: fullCue, index: newIndex },
    });

    return newIndex;
  }

  /**
   * Insert cue at specific position
   */
  insertCue(index: number, cue: Omit<UniversalCue, "index">): boolean {
    if (index < 0 || index > this.universal.cues.length) return false;

    const fullCue: UniversalCue = {
      ...cue,
      index: index + 1,
    };

    this.universal.cues.splice(index, 0, fullCue);
    this.reindexCues();

    this.emitChange({
      type: "cue-added",
      timestamp: Date.now(),
      data: { cue: fullCue, index },
    });

    this.saveHistory({
      type: "cue-added",
      timestamp: Date.now(),
      data: { cue: fullCue, index },
    });

    return true;
  }

  /**
   * Delete cue
   */
  deleteCue(index: number): boolean {
    if (index < 0 || index >= this.universal.cues.length) return false;

    const deleted = this.universal.cues.splice(index, 1)[0];
    this.reindexCues();

    this.emitChange({
      type: "cue-deleted",
      timestamp: Date.now(),
      data: { cue: deleted, index },
    });

    this.saveHistory({
      type: "cue-deleted",
      timestamp: Date.now(),
      data: { cue: deleted, index },
    });

    return true;
  }

  /**
   * Split cue at time point
   */
  splitCue(index: number, splitTimeMs: number): boolean {
    const cue = this.universal.cues[index];
    if (!cue) return false;

    if (splitTimeMs <= cue.startTime || splitTimeMs >= cue.endTime) {
      return false;
    }

    // Create second part with only defined properties
    const secondPart: Omit<UniversalCue, "index"> = {
      startTime: splitTimeMs,
      endTime: cue.endTime,
      duration: cue.endTime - splitTimeMs,
      text: cue.text,
      content: cue.content,
    };

    // Only add optional properties if they exist
    if (cue.style) {
      secondPart.style = cue.style;
    }
    if (cue.identifier) {
      secondPart.identifier = cue.identifier;
    }
    if (cue.layout) {
      secondPart.layout = cue.layout;
    }
    if (cue.formatting) {
      secondPart.formatting = cue.formatting;
    }
    if (cue.formatSpecific) {
      secondPart.formatSpecific = cue.formatSpecific;
    }

    // Update first part
    cue.endTime = splitTimeMs;
    cue.duration = splitTimeMs - cue.startTime;

    // Insert second part
    return this.insertCue(index + 1, secondPart);
  }

  /**
   * Merge consecutive cues
   */
  mergeCues(startIndex: number, endIndex: number): boolean {
    if (
      startIndex < 0 ||
      endIndex >= this.universal.cues.length ||
      startIndex >= endIndex
    ) {
      return false;
    }

    const firstCue = this.universal.cues[startIndex];
    if (!firstCue) return false;

    // Merge text and timing
    const cuesToMerge = this.universal.cues.slice(startIndex, endIndex + 1);
    const mergedText = cuesToMerge.map((c) => c.text).join("\n");
    const mergedContent = cuesToMerge.map((c) => c.content).join("\n");
    const lastCue = cuesToMerge[cuesToMerge.length - 1]!;

    // Update first cue
    firstCue.text = mergedText;
    firstCue.content = mergedContent;
    firstCue.endTime = lastCue.endTime;
    firstCue.duration = lastCue.endTime - firstCue.startTime;

    // Remove other cues
    this.universal.cues.splice(startIndex + 1, endIndex - startIndex);
    this.reindexCues();

    this.emitChange({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "merge", startIndex, endIndex },
    });

    this.saveHistory({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "merge", startIndex, endIndex },
    });

    return true;
  }

  // ============================================================================
  // SEARCH AND FILTER
  // ============================================================================

  /**
   * Search for text in cues
   */
  search(query: string, options: SearchOptions = {}): number[] {
    const {
      caseSensitive = false,
      regex = false,
      includeContent = false,
      timeRange,
      styles,
      layers,
    } = options;

    let pattern: RegExp;
    if (regex) {
      pattern = new RegExp(query, caseSensitive ? "" : "i");
    } else {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      pattern = new RegExp(escaped, caseSensitive ? "" : "i");
    }

    return this.universal.cues
      .map((cue, index) => ({ cue, index }))
      .filter(({ cue }) => {
        // Time range filter
        if (timeRange) {
          if (cue.startTime < timeRange.start || cue.endTime > timeRange.end) {
            return false;
          }
        }

        // Style filter
        if (styles && styles.length > 0) {
          if (!cue.style || !styles.includes(cue.style)) {
            return false;
          }
        }

        // Layer filter
        if (layers && layers.length > 0) {
          const layer = cue.formatSpecific?.ass?.layer;
          if (layer === undefined || !layers.includes(layer)) {
            return false;
          }
        }

        // Text search
        const searchText = includeContent
          ? `${cue.text} ${cue.content}`
          : cue.text;
        return pattern.test(searchText);
      })
      .map(({ index }) => index);
  }

  /**
   * Find and replace text
   */
  findAndReplace(
    find: string,
    replace: string,
    options: SearchOptions = {},
  ): number {
    const indices = this.search(find, options);
    let count = 0;

    const {
      caseSensitive = false,
      regex = false,
      includeContent = false,
    } = options;

    let pattern: RegExp;
    if (regex) {
      pattern = new RegExp(find, caseSensitive ? "g" : "gi");
    } else {
      const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      pattern = new RegExp(escaped, caseSensitive ? "g" : "gi");
    }

    indices.forEach((index) => {
      const cue = this.universal.cues[index];
      if (!cue) return;

      const newText = cue.text.replace(pattern, replace);
      if (newText !== cue.text) {
        cue.text = newText;
        if (includeContent) {
          cue.content = cue.content.replace(pattern, replace);
        }
        count++;
      }
    });

    if (count > 0) {
      this.emitChange({
        type: "batch-update",
        timestamp: Date.now(),
        data: { action: "find-replace", find, replace, count },
      });

      this.saveHistory({
        type: "batch-update",
        timestamp: Date.now(),
        data: { action: "find-replace", find, replace, count },
      });
    }

    return count;
  }

  // ============================================================================
  // TIME OPERATIONS
  // ============================================================================

  /**
   * Shift all cues by offset
   */
  shiftTime(offsetMs: number, startIndex: number = 0, endIndex?: number): void {
    const end = endIndex ?? this.universal.cues.length - 1;

    for (let i = startIndex; i <= end && i < this.universal.cues.length; i++) {
      const cue = this.universal.cues[i];
      if (cue) {
        cue.startTime += offsetMs;
        cue.endTime += offsetMs;
      }
    }

    this.emitChange({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "time-shift", offsetMs, startIndex, endIndex },
    });

    this.saveHistory({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "time-shift", offsetMs, startIndex, endIndex },
    });
  }

  /**
   * Scale time (speed up or slow down)
   */
  scaleTime(factor: number, startIndex: number = 0, endIndex?: number): void {
    if (factor <= 0) return;

    const end = endIndex ?? this.universal.cues.length - 1;

    for (let i = startIndex; i <= end && i < this.universal.cues.length; i++) {
      const cue = this.universal.cues[i];
      if (cue) {
        cue.startTime = Math.round(cue.startTime * factor);
        cue.endTime = Math.round(cue.endTime * factor);
        cue.duration = cue.endTime - cue.startTime;
      }
    }

    this.emitChange({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "time-scale", factor, startIndex, endIndex },
    });

    this.saveHistory({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "time-scale", factor, startIndex, endIndex },
    });
  }

  /**
   * Fix overlapping cues
   */
  fixOverlaps(gapMs: number = 0): number {
    let fixed = 0;

    for (let i = 0; i < this.universal.cues.length - 1; i++) {
      const current = this.universal.cues[i];
      const next = this.universal.cues[i + 1];

      if (current && next && current.endTime > next.startTime) {
        current.endTime = next.startTime - gapMs;
        current.duration = current.endTime - current.startTime;
        fixed++;
      }
    }

    if (fixed > 0) {
      this.emitChange({
        type: "batch-update",
        timestamp: Date.now(),
        data: { action: "fix-overlaps", fixed, gapMs },
      });

      this.saveHistory({
        type: "batch-update",
        timestamp: Date.now(),
        data: { action: "fix-overlaps", fixed, gapMs },
      });
    }

    return fixed;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate single cue
   */
  validateCue(
    index: number,
    options: ValidationOptions = {},
  ): ValidationResult {
    const cue = this.universal.cues[index];
    if (!cue) {
      return {
        isValid: false,
        errors: [{ type: "INVALID_FORMAT", message: "Cue not found" }],
        warnings: [],
      };
    }

    const errors: any[] = [];
    const warnings: any[] = [];

    const {
      checkDurations = true,
      checkTextLength = true,
      maxTextLength = 200,
      minDuration = 500,
      maxDuration = 10000,
    } = options;

    // Check timing
    if (cue.startTime >= cue.endTime) {
      errors.push({
        type: "INVALID_TIMECODE",
        message: "Start time must be before end time",
        cueIndex: index,
      });
    }

    // Check duration
    if (checkDurations) {
      if (cue.duration < minDuration) {
        warnings.push({
          type: "SHORT_DURATION",
          message: `Duration (${cue.duration}ms) is less than minimum (${minDuration}ms)`,
          cueIndex: index,
        });
      }
      if (cue.duration > maxDuration) {
        warnings.push({
          type: "LONG_DURATION",
          message: `Duration (${cue.duration}ms) exceeds maximum (${maxDuration}ms)`,
          cueIndex: index,
        });
      }
    }

    // Check text length
    if (checkTextLength && cue.text.length > maxTextLength) {
      warnings.push({
        type: "EXCESSIVE_LINES",
        message: `Text length (${cue.text.length}) exceeds maximum (${maxTextLength})`,
        cueIndex: index,
      });
    }

    // Check for empty text
    if (!cue.text.trim()) {
      errors.push({
        type: "EMPTY_CUE",
        message: "Cue has empty text",
        cueIndex: index,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate all cues
   */
  validateAll(options: ValidationOptions = {}): ValidationResult {
    const allErrors: any[] = [];
    const allWarnings: any[] = [];

    // Validate each cue
    this.universal.cues.forEach((_, index) => {
      const result = this.validateCue(index, options);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    // Check for overlaps
    if (options.checkOverlaps !== false) {
      for (let i = 0; i < this.universal.cues.length - 1; i++) {
        const current = this.universal.cues[i];
        const next = this.universal.cues[i + 1];

        if (current && next && current.endTime > next.startTime) {
          allErrors.push({
            type: "OVERLAPPING_CUES",
            message: `Cue ${i + 1} overlaps with cue ${i + 2}`,
            cueIndex: i,
          });
        }
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  // ============================================================================
  // METADATA AND STYLES
  // ============================================================================

  /**
   * Update metadata
   */
  updateMetadata(metadata: Partial<SubtitleMetadata>): void {
    Object.assign(this.universal.metadata, metadata);

    this.emitChange({
      type: "metadata-updated",
      timestamp: Date.now(),
      data: { metadata },
    });

    this.saveHistory({
      type: "metadata-updated",
      timestamp: Date.now(),
      data: { metadata },
    });
  }

  /**
   * Add style
   */
  addStyle(style: StyleDefinition): void {
    this.universal.styles.push(style);

    this.emitChange({
      type: "style-added",
      timestamp: Date.now(),
      data: { style },
    });

    this.saveHistory({
      type: "style-added",
      timestamp: Date.now(),
      data: { style },
    });
  }

  /**
   * Update style
   */
  updateStyle(name: string, updates: Partial<StyleDefinition>): boolean {
    const style = this.universal.styles.find((s) => s.name === name);
    if (!style) return false;

    Object.assign(style, updates);

    this.emitChange({
      type: "style-updated",
      timestamp: Date.now(),
      data: { name, updates },
    });

    this.saveHistory({
      type: "style-updated",
      timestamp: Date.now(),
      data: { name, updates },
    });

    return true;
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Export to specific format
   */
  export(format: SubtitleFormat, options?: ConversionOptions): string {
    return formatFromUniversal(this.universal, format, options);
  }

  /**
   * Export to JSON
   */
  toJSON(pretty: boolean = true): string {
    return JSON.stringify(this.universal, null, pretty ? 2 : 0);
  }

  // ============================================================================
  // HISTORY (UNDO/REDO)
  // ============================================================================

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Undo last change
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    this.historyIndex--;
    this.universal = cloneUniversal(this.history[this.historyIndex]!.state);

    this.emitChange({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "undo" },
    });

    return true;
  }

  /**
   * Redo last undone change
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    this.historyIndex++;
    this.universal = cloneUniversal(this.history[this.historyIndex]!.state);

    this.emitChange({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "redo" },
    });

    return true;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
    this.saveHistory({
      type: "batch-update",
      timestamp: Date.now(),
      data: { action: "clear-history" },
    });
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Subscribe to changes
   */
  onChange(listener: (event: ChangeEvent) => void): () => void {
    this.changeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.changeListeners.indexOf(listener);
      if (index > -1) {
        this.changeListeners.splice(index, 1);
      }
    };
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Execute multiple operations in a transaction
   */
  batch(operations: () => void): void {
    const stateBefore = cloneUniversal(this.universal);

    try {
      this.inBatch = true;
      operations();
      this.inBatch = false;

      this.emitChange({
        type: "batch-update",
        timestamp: Date.now(),
        data: { action: "batch" },
      });

      this.saveHistory({
        type: "batch-update",
        timestamp: Date.now(),
        data: { action: "batch" },
      });
    } catch (error) {
      // Rollback on error
      this.inBatch = false;
      this.universal = stateBefore;
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private reindexCues(): void {
    this.universal.cues.forEach((cue, index) => {
      cue.index = index + 1;
    });
  }

  private saveHistory(event: ChangeEvent): void {
    // Skip history for operations inside a batch (except the batch itself)
    if (this.inBatch && event.type !== "batch-update") {
      return;
    }

    // Remove any redo history
    if (this.historyIndex < this.history.length - 1) {
      this.history.splice(this.historyIndex + 1);
    }

    // Add new state
    this.history.push({
      state: cloneUniversal(this.universal),
      event,
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  private emitChange(event: ChangeEvent): void {
    this.changeListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in change listener:", error);
      }
    });
  }
}
