import type { SubtitleFormat } from '../types.js';

/**
 * Result of format detection
 */
export interface FormatDetectionResult {
  /**
   * Detected format, or null if unable to determine
   */
  format: SubtitleFormat | null;
  /**
   * Confidence level of the detection (0-1)
   */
  confidence: number;
  /**
   * Reasons for the detection decision
   */
  reasons: string[];
}

/**
 * Detect the format of subtitle content by analyzing headers and structure
 * @param content - Subtitle content as string
 * @returns Detection result with format, confidence, and reasons
 */
export function detectFormat(content: string): FormatDetectionResult {
  const trimmedContent = content.trim();
  
  if (!trimmedContent) {
    return {
      format: null,
      confidence: 0,
      reasons: ['Empty content']
    };
  }

  // Try each format detector in order of specificity
  const detectors = [
    detectJson,
    detectVtt,
    detectAss,
    detectSrt
  ];

  for (const detector of detectors) {
    const result = detector(trimmedContent);
    if (result.confidence >= 0.8) {
      return result;
    }
  }

  // If no high-confidence match, return the best guess
  const results = detectors.map(d => d(trimmedContent));
  const bestResult = results.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );

  return bestResult;
}

/**
 * Detect JSON format
 */
function detectJson(content: string): FormatDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;

  // Check if content starts with array bracket
  if (content.trimStart().startsWith('[')) {
    reasons.push('Starts with array bracket');
    confidence += 0.3;
  }

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(content);
    reasons.push('Valid JSON syntax');
    confidence += 0.4;

    if (Array.isArray(parsed)) {
      reasons.push('Content is an array');
      confidence += 0.2;

      // Check if it has caption-like structure
      if (parsed.length > 0) {
        const first = parsed[0];
        const hasRequiredFields = first && 
          typeof first === 'object' &&
          ('start' in first || 'end' in first || 'text' in first || 'content' in first);
        
        if (hasRequiredFields) {
          reasons.push('Contains caption-like objects');
          confidence += 0.2;
        }
      }
    }
  } catch {
    reasons.push('Invalid JSON syntax');
    return { format: null, confidence: 0, reasons };
  }

  return {
    format: confidence >= 0.5 ? 'json' : null,
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * Detect WebVTT format
 */
function detectVtt(content: string): FormatDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;
  const lines = content.split('\n');

  // Check for WEBVTT header
  if (lines[0]?.trim().startsWith('WEBVTT')) {
    reasons.push('Has WEBVTT header');
    confidence += 0.7;
  } else {
    reasons.push('Missing WEBVTT header');
    return { format: null, confidence: 0, reasons };
  }

  // Check for VTT time format (HH:MM:SS.mmm with dots)
  const vttTimePattern = /\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/;
  const hasVttTime = content.match(vttTimePattern);
  
  if (hasVttTime) {
    reasons.push('Contains VTT time format (dots)');
    confidence += 0.3;
  }

  // Check for VTT-specific features
  if (content.includes('NOTE') || content.includes('STYLE')) {
    reasons.push('Contains VTT-specific keywords');
    confidence += 0.05;
  }

  return {
    format: confidence >= 0.7 ? 'vtt' : null,
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * Detect ASS/SSA format
 */
function detectAss(content: string): FormatDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;

  // Check for ASS section headers
  const hasScriptInfo = content.includes('[Script Info]');
  const hasV4Styles = content.includes('[V4+ Styles]') || content.includes('[V4 Styles]');
  const hasEvents = content.includes('[Events]');

  if (hasScriptInfo) {
    reasons.push('Has [Script Info] section');
    confidence += 0.3;
  }

  if (hasV4Styles) {
    reasons.push('Has [V4+ Styles] or [V4 Styles] section');
    confidence += 0.3;
  }

  if (hasEvents) {
    reasons.push('Has [Events] section');
    confidence += 0.2;
  }

  // Check for Dialogue lines
  if (content.includes('Dialogue:')) {
    reasons.push('Contains Dialogue: lines');
    confidence += 0.2;
  }

  // Check for ASS time format (H:MM:SS.cc)
  const assTimePattern = /Dialogue:\s*\d+,\d+:\d{2}:\d{2}\.\d{2},\d+:\d{2}:\d{2}\.\d{2}/;
  if (content.match(assTimePattern)) {
    reasons.push('Contains ASS time format');
    confidence += 0.1;
  }

  if (confidence < 0.5) {
    reasons.push('Insufficient ASS format indicators');
  }

  return {
    format: confidence >= 0.5 ? 'ass' : null,
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * Detect SRT format
 */
function detectSrt(content: string): FormatDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;
  const blocks = content.trim().split(/\n\n+/);

  if (blocks.length === 0) {
    reasons.push('No content blocks found');
    return { format: null, confidence: 0, reasons };
  }

  // Analyze first few blocks
  const samplesToCheck = Math.min(3, blocks.length);
  let validBlocks = 0;

  for (let i = 0; i < samplesToCheck; i++) {
    const block = blocks[i];
    if (!block) continue;
    
    const lines = block.trim().split('\n');
    
    if (lines.length < 3) continue;

    // Check for sequential number at the start
    const firstLine = lines[0]?.trim();
    if (firstLine && /^\d+$/.test(firstLine)) {
      validBlocks++;
    }

    // Check for SRT time format (HH:MM:SS,mmm with commas)
    const srtTimePattern = /^\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}$/;
    const timeLine = lines[1]?.trim();
    
    if (timeLine && srtTimePattern.test(timeLine)) {
      validBlocks++;
    }

    // Check for text content
    if (lines.length >= 3 && lines.slice(2).some(l => l.trim())) {
      validBlocks++;
    }
  }

  // Calculate confidence based on valid blocks
  const blockScore = validBlocks / (samplesToCheck * 3);
  confidence = blockScore;

  if (validBlocks > 0) {
    reasons.push(`Found ${validBlocks} valid SRT indicators in sample blocks`);
  }

  // Check that it doesn't have other format headers
  if (!content.includes('WEBVTT') && !content.includes('[Script Info]')) {
    reasons.push('No conflicting format headers');
    confidence += 0.1;
  }

  // Check for SRT-specific comma separator in times
  if (content.match(/\d{2}:\d{2}:\d{2},\d{3}/)) {
    reasons.push('Contains SRT time format (commas)');
    confidence += 0.2;
  }

  if (confidence < 0.5) {
    reasons.push('Insufficient SRT format indicators');
  }

  return {
    format: confidence >= 0.5 ? 'srt' : null,
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * Detect format and return only the format (convenience function)
 * @param content - Subtitle content as string
 * @returns Detected format or null
 */
export function detectFormatSimple(content: string): SubtitleFormat | null {
  return detectFormat(content).format;
}

/**
 * Detect format with a minimum confidence threshold
 * @param content - Subtitle content as string
 * @param minConfidence - Minimum confidence level required (0-1)
 * @returns Detected format or null if confidence is too low
 */
export function detectFormatWithConfidence(
  content: string, 
  minConfidence: number = 0.8
): SubtitleFormat | null {
  const result = detectFormat(content);
  return result.confidence >= minConfidence ? result.format : null;
}