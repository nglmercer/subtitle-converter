import { describe, expect, test } from 'bun:test';
import { parseVtt, toVtt, validateVttStructure } from '../src/formats/vtt.js';
import { 
  VttBuilder, 
  commonCues, 
  multilineCues, 
  overlappingCues,
  invalidCases 
} from './fixtures/test-fixtures.js';

describe('VTT Format', () => {
  const builder = new VttBuilder();

  describe('parseVtt', () => {
    test('should parse valid VTT content', () => {
      const vttContent = builder.addCues(commonCues).build();
      const result = parseVtt(vttContent);
      
      expect(result).toHaveLength(3);
      // VTT uses dots instead of commas
      expect(result[0].startTime).toBe('00:00:01.000');
      expect(result[0].endTime).toBe('00:00:03.000');
      expect(result[0].text).toBe('Hello world');
    });

    test('should parse VTT with metadata', () => {
      const vttContent = builder
        .reset()
        .addMetadata('Kind', 'captions')
        .addMetadata('Language', 'en')
        .addCues(commonCues)
        .build();
      
      const result = parseVtt(vttContent);
      expect(result).toHaveLength(3);
    });

    test('should throw error for missing WEBVTT header', () => {
      expect(() => parseVtt(invalidCases.vtt.missingHeader))
        .toThrow('Invalid VTT file: missing WEBVTT header');
    });

    test('should handle multiline text', () => {
      const vttContent = builder.reset().addCues(multilineCues).build();
      const result = parseVtt(vttContent);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Line 1\nLine 2\nLine 3');
    });

    test('should skip NOTE blocks', () => {
      const vttWithNotes = `WEBVTT

NOTE This is a comment

00:00:01.000 --> 00:00:03.000
Hello world

NOTE Another comment

00:00:04.000 --> 00:00:06.000
Second subtitle`;
      
      const result = parseVtt(vttWithNotes);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Hello world');
      expect(result[1].text).toBe('Second subtitle');
    });

    test('should skip STYLE blocks', () => {
      const vttWithStyles = `WEBVTT

STYLE
::cue {
  background-image: linear-gradient(to bottom, dimgray, lightgray);
}

00:00:01.000 --> 00:00:03.000
Hello world`;
      
      const result = parseVtt(vttWithStyles);
      expect(result).toHaveLength(1);
    });
  });

  describe('toVtt', () => {
    test('should convert cues to VTT format', () => {
      const result = toVtt(commonCues.slice(0, 2).map(cue => ({
        ...cue,
        startTime: cue.startTime.replace(',', '.'),
        endTime: cue.endTime.replace(',', '.')
      })));
      
      expect(result).toContain('WEBVTT');
      expect(result).toContain('00:00:01.000 --> 00:00:03.000');
      expect(result).toContain('Hello world');
    });

    test('should handle multiline text', () => {
      const vttCues = multilineCues.map(cue => ({
        ...cue,
        startTime: cue.startTime.replace(',', '.'),
        endTime: cue.endTime.replace(',', '.')
      }));
      
      const result = toVtt(vttCues);
      expect(result).toContain('Line 1\nLine 2\nLine 3');
    });

    test('should handle empty array', () => {
      const result = toVtt([]);
      expect(result).toBe('WEBVTT');
    });

    test('should include proper spacing', () => {
      const vttCues = commonCues.map(cue => ({
        ...cue,
        startTime: cue.startTime.replace(',', '.'),
        endTime: cue.endTime.replace(',', '.')
      }));
      
      const result = toVtt(vttCues);
      const lines = result.split('\n');
      
      expect(lines[0]).toBe('WEBVTT');
      expect(lines[1]).toBe('');
    });
  });

  describe('validateVttStructure', () => {
    test('should validate correct VTT structure', () => {
      const vttContent = builder.reset().addCues(commonCues).build();
      const result = validateVttStructure(vttContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should detect missing WEBVTT header', () => {
      const result = validateVttStructure(invalidCases.vtt.missingHeader);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_FORMAT');
      expect(result.errors[0].message).toContain('WEBVTT');
    });

    test('should detect overlapping cues', () => {
      const vttContent = builder.reset().addCues(overlappingCues).build();
      const result = validateVttStructure(vttContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('OVERLAPPING_CUES');
    });

    test('should detect invalid time format', () => {
      const result = validateVttStructure(invalidCases.vtt.invalidTimeFormat);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('INVALID_TIMECODE');
    });
    test('should detect malformed time format', () => {
      const result = validateVttStructure(invalidCases.vtt.invalidTimeFormatMalformed);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('INVALID_TIMECODE');
    });
    test('should detect empty cues', () => {
      const result = validateVttStructure(invalidCases.vtt.emptyCue);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('EMPTY_CUE');
    });

    test('should allow NOTE blocks', () => {
      const vttWithNotes = `WEBVTT

NOTE This is a valid comment

00:00:01.000 --> 00:00:03.000
Hello world`;
      
      const result = validateVttStructure(vttWithNotes);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Round-trip conversion', () => {
    test('should maintain data integrity through parse and convert cycle', () => {
      const vttCues = commonCues.map(cue => ({
        ...cue,
        startTime: cue.startTime.replace(',', '.'),
        endTime: cue.endTime.replace(',', '.')
      }));
      
      const original = toVtt(vttCues);
      const parsed = parseVtt(original);
      const converted = toVtt(parsed);
      const reparsed = parseVtt(converted);
      
      expect(parsed).toEqual(reparsed);
    });
  });
});