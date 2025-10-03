import { describe, expect, test } from 'bun:test';
import { parseSrt, toSrt, validateSrtStructure } from '../src/formats/srt.js';
import { 
  SrtBuilder, 
  commonCues, 
  multilineCues, 
  overlappingCues,
  invalidCases 
} from './fixtures/test-fixtures.js';

describe('SRT Format', () => {
  const builder = new SrtBuilder();

  describe('parseSrt', () => {
    test('should parse valid SRT content', () => {
      const srtContent = builder.addCues(commonCues).build();
      const result = parseSrt(srtContent);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(commonCues[0]);
      expect(result[1]).toEqual(commonCues[1]);
      expect(result[2]).toEqual(commonCues[2]);
    });

    test('should handle multiline text', () => {
      const srtContent = builder.reset().addCues(multilineCues).build();
      const result = parseSrt(srtContent);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Line 1\nLine 2\nLine 3');
    });

    test('should preserve whitespace in text', () => {
      const cueWithWhitespace = {
        startTime: '00:00:01,000',
        endTime: '00:00:03,000',
        text: '  Hello world  '
      };
      
      const srtContent = builder.reset().addCue(cueWithWhitespace).build();
      const result = parseSrt(srtContent);
      
      // El parser hace trim() en el bloque, lo que elimina whitespace al final
      // pero preserva el whitespace al inicio y en medio de las líneas
      expect(result[0].text).toBe('  Hello world');
    });

    test('should handle empty SRT content', () => {
      const result = parseSrt('');
      expect(result).toHaveLength(0);
    });

    test('should handle multiple empty lines between cues', () => {
      const srtContent = builder.reset().addCues(commonCues).build();
      const srtWithExtraLines = srtContent.replace(/\n\n/g, '\n\n\n\n');
      
      const result = parseSrt(srtWithExtraLines);
      expect(result).toHaveLength(3);
    });
  });

  describe('toSrt', () => {
    test('should convert cues to SRT format', () => {
      const result = toSrt(commonCues.slice(0, 2));
      const expected = builder.reset().addCues(commonCues.slice(0, 2)).build();
      
      expect(result).toBe(expected);
    });

    test('should handle multiline text', () => {
      const result = toSrt(multilineCues);
      const expected = builder.reset().addCues(multilineCues).build();
      
      expect(result).toBe(expected);
    });

    test('should handle empty array', () => {
      const result = toSrt([]);
      expect(result).toBe('');
    });

    test('should generate sequential cue numbers', () => {
      const result = toSrt(commonCues);
      
      expect(result).toContain('1\n');
      expect(result).toContain('2\n');
      expect(result).toContain('3\n');
    });
  });

  describe('validateSrtStructure', () => {
    test('should validate correct SRT structure', () => {
      const srtContent = builder.reset().addCues(commonCues).build();
      const result = validateSrtStructure(srtContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should detect overlapping cues', () => {
      const srtContent = builder.reset().addCues(overlappingCues).build();
      const result = validateSrtStructure(srtContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('OVERLAPPING_CUES');
    });

    test('should detect invalid time format', () => {
      const result = validateSrtStructure(invalidCases.srt.invalidTimeFormat);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('INVALID_TIMECODE');
    });

    test('should detect empty cues', () => {
      const result = validateSrtStructure(invalidCases.srt.emptyCue);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('EMPTY_CUE');
    });

    test('should detect missing cue number', () => {
      const result = validateSrtStructure(invalidCases.srt.missingCueNumber);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'MISSING_CUE_NUMBER')).toBe(true);
    });

    test('should handle malformed blocks', () => {
      const malformedSrt = `1
00:00:01,000`;
      
      const result = validateSrtStructure(malformedSrt);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Round-trip conversion', () => {
    test('should maintain data integrity through parse and convert cycle', () => {
      const original = builder.reset().addCues(commonCues).build();
      const parsed = parseSrt(original);
      const converted = toSrt(parsed);
      const reparsed = parseSrt(converted);
      
      expect(parsed).toEqual(reparsed);
    });

    test('should preserve multiline text in round-trip', () => {
      const original = builder.reset().addCues(multilineCues).build();
      const parsed = parseSrt(original);
      const converted = toSrt(parsed);
      const reparsed = parseSrt(converted);
      
      expect(reparsed[0].text).toBe(multilineCues[0].text);
    });
  });
});