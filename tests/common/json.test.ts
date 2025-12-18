import { describe, expect, test } from 'bun:test';
import { parseJson, toJson, validateJsonStructure } from '../../src/formats/json.js';
import { 
  commonCues, 
  multilineCues, 
  overlappingCues
} from '../fixtures/test-fixtures.js';

/**
 * Helper function to create valid JSON subtitle content
 */
function createJsonContent(cues: any[]) {
  return JSON.stringify(cues, null, 2);
}

/**
 * Helper function to convert SubtitleCue to JsonCaption format
 */
function cueToJsonCaption(cue: any, index: number) {
  const start = timeToMilliseconds(cue.startTime);
  const end = timeToMilliseconds(cue.endTime);
  const duration = end - start;
  
  return {
    type: 'caption',
    index: index + 1,
    start,
    end,
    duration,
    content: cue.text,
    text: cue.text
  };
}

/**
 * Convert time string to milliseconds (helper for tests)
 */
function timeToMilliseconds(timeString: string): number {
  const normalizedTime = timeString.replace(',', '.');
  const match = normalizedTime.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  
  if (!match) {
    throw new Error(`Invalid time format: ${timeString}`);
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

describe('JSON Format', () => {
  describe('parseJson', () => {
    test('should parse valid JSON content', () => {
      const jsonCues = commonCues.map((cue, index) => cueToJsonCaption(cue, index));
      const jsonContent = createJsonContent(jsonCues);
      const result = parseJson(jsonContent);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(commonCues[0]);
      expect(result[1]).toEqual(commonCues[1]);
      expect(result[2]).toEqual(commonCues[2]);
    });

    test('should handle multiline text', () => {
      const jsonCues = multilineCues.map((cue, index) => cueToJsonCaption(cue, index));
      const jsonContent = createJsonContent(jsonCues);
      const result = parseJson(jsonContent);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Line 1\nLine 2\nLine 3');
    });

    test('should skip meta entries', () => {
      const jsonCues = [
        { type: 'meta', index: 0, start: 0, end: 0, duration: 0, content: 'metadata', text: 'metadata' },
        cueToJsonCaption(commonCues[0], 0),
        { type: 'caption', index: 2, start: 4000, end: 6000, duration: 2000, content: 'Second caption', text: 'Second caption' }
      ];
      const jsonContent = createJsonContent(jsonCues);
      const result = parseJson(jsonContent);
      
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Hello world');
      expect(result[1].text).toBe('Second caption');
    });

    test('should handle content field when text is missing', () => {
      const jsonCue = {
        type: 'caption',
        index: 1,
        start: 1000,
        end: 3000,
        duration: 2000,
        content: 'Content field text',
        text: '' // Empty text field
      };
      const jsonContent = createJsonContent([jsonCue]);
      const result = parseJson(jsonContent);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Content field text');
    });

    test('should throw error for invalid JSON', () => {
      const invalidJson = 'invalid json content';
      
      expect(() => parseJson(invalidJson)).toThrow('Invalid JSON format');
    });

    test('should throw error for non-array JSON', () => {
      const invalidJson = '{"type": "single_object"}';
      
      expect(() => parseJson(invalidJson)).toThrow('JSON content must be an array of captions');
    });

    test('should throw error for invalid start/end times', () => {
      const invalidCue = {
        type: 'caption',
        index: 1,
        start: 'invalid', // Should be number
        end: 3000,
        duration: 2000,
        content: 'Test',
        text: 'Test'
      };
      const jsonContent = createJsonContent([invalidCue]);
      
      expect(() => parseJson(jsonContent)).toThrow('Caption 1 has invalid start/end times');
    });

    test('should throw error for missing text content', () => {
      const invalidCue = {
        type: 'caption',
        index: 1,
        start: 1000,
        end: 3000,
        duration: 2000,
        content: '', // Empty content
        text: '' // Empty text
      };
      const jsonContent = createJsonContent([invalidCue]);
      
      expect(() => parseJson(jsonContent)).toThrow('Caption 1 has no text content');
    });

    test('should handle empty JSON array', () => {
      const jsonContent = createJsonContent([]);
      const result = parseJson(jsonContent);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('toJson', () => {
    test('should convert cues to JSON format', () => {
      const result = toJson(commonCues.slice(0, 2));
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].type).toBe('caption');
      expect(parsed[0].index).toBe(1);
      expect(parsed[0].start).toBe(1000);
      expect(parsed[0].end).toBe(3000);
      expect(parsed[0].duration).toBe(2000);
      expect(parsed[0].content).toBe('Hello world');
      expect(parsed[0].text).toBe('Hello world');
    });

    test('should handle multiline text', () => {
      const result = toJson(multilineCues);
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].content).toBe('Line 1\nLine 2\nLine 3');
      expect(parsed[0].text).toBe('Line 1\nLine 2\nLine 3');
    });

    test('should handle empty array', () => {
      const result = toJson([]);
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveLength(0);
      expect(Array.isArray(parsed)).toBe(true);
    });

    test('should generate sequential indices', () => {
      const result = toJson(commonCues);
      const parsed = JSON.parse(result);
      
      expect(parsed[0].index).toBe(1);
      expect(parsed[1].index).toBe(2);
      expect(parsed[2].index).toBe(3);
    });

    test('should calculate correct durations', () => {
      const result = toJson(commonCues);
      const parsed = JSON.parse(result);
      
      expect(parsed[0].duration).toBe(2000); // 00:00:03,000 - 00:00:01,000 = 2000ms
      expect(parsed[1].duration).toBe(2000); // 00:00:06,000 - 00:00:04,000 = 2000ms
      expect(parsed[2].duration).toBe(2000); // 00:00:09,000 - 00:00:07,000 = 2000ms
    });

    test('should format JSON with proper indentation', () => {
      const result = toJson(commonCues.slice(0, 1));
      
      expect(result).toContain('"type": "caption"');
      expect(result).toContain('"index": 1');
      expect(result).toContain('"start": 1000');
    });
  });

  describe('validateJsonStructure', () => {
    test('should validate correct JSON structure', () => {
      const jsonCues = commonCues.map((cue, index) => cueToJsonCaption(cue, index));
      const jsonContent = createJsonContent(jsonCues);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should detect overlapping cues', () => {
      const jsonCues = overlappingCues.map((cue, index) => cueToJsonCaption(cue, index));
      const jsonContent = createJsonContent(jsonCues);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('OVERLAPPING_CUES');
    });

    test('should detect invalid JSON', () => {
      const invalidJson = 'invalid json content';
      const result = validateJsonStructure(invalidJson);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_FORMAT');
      expect(result.errors[0].message).toContain('Invalid JSON');
    });

    test('should detect non-array JSON', () => {
      const invalidJson = '{"type": "single_object"}';
      const result = validateJsonStructure(invalidJson);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_FORMAT');
      expect(result.errors[0].message).toContain('must be an array');
    });

    test('should detect invalid caption type', () => {
      const invalidCue = {
        type: 'invalid_type',
        index: 1,
        start: 1000,
        end: 3000,
        duration: 2000,
        content: 'Test',
        text: 'Test'
      };
      const jsonContent = createJsonContent([invalidCue]);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_FORMAT');
      expect(result.errors[0].message).toContain('invalid type');
    });

    test('should detect invalid start time', () => {
      const invalidCue = {
        type: 'caption',
        index: 1,
        start: 'invalid', // Should be number
        end: 3000,
        duration: 2000,
        content: 'Test',
        text: 'Test'
      };
      const jsonContent = createJsonContent([invalidCue]);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_TIMECODE');
      expect(result.errors[0].message).toContain('invalid start time');
    });

    test('should detect invalid end time', () => {
      const invalidCue = {
        type: 'caption',
        index: 1,
        start: 1000,
        end: -100, // Negative time
        duration: 2000,
        content: 'Test',
        text: 'Test'
      };
      const jsonContent = createJsonContent([invalidCue]);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_TIMECODE');
      expect(result.errors[0].message).toContain('invalid end time');
    });

    test('should detect start time >= end time', () => {
      const invalidCue = {
        type: 'caption',
        index: 1,
        start: 3000,
        end: 3000, // Same as start
        duration: 0,
        content: 'Test',
        text: 'Test'
      };
      const jsonContent = createJsonContent([invalidCue]);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_TIMECODE');
      expect(result.errors[0].message).toContain('start time >= end time');
    });

    test('should detect empty text content', () => {
      const invalidCue = {
        type: 'caption',
        index: 1,
        start: 1000,
        end: 3000,
        duration: 2000,
        content: '', // Empty content
        text: '' // Empty text
      };
      const jsonContent = createJsonContent([invalidCue]);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.some(error => error.type === 'EMPTY_CUE')).toBe(true);
    });

    test('should detect whitespace-only text content', () => {
      const invalidCue = {
        type: 'caption',
        index: 1,
        start: 1000,
        end: 3000,
        duration: 2000,
        content: '   ', // Whitespace only
        text: '   ' // Whitespace only
      };
      const jsonContent = createJsonContent([invalidCue]);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('EMPTY_CUE');
      expect(result.errors[0].message).toContain('empty text content');
    });

    test('should warn about duration mismatch', () => {
      const cueWithWrongDuration = {
        type: 'caption',
        index: 1,
        start: 1000,
        end: 3000,
        duration: 1500, // Wrong duration (should be 2000)
        content: 'Test',
        text: 'Test'
      };
      const jsonContent = createJsonContent([cueWithWrongDuration]);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('LONG_DURATION');
      expect(result.warnings[0].message).toContain('duration field');
      expect(result.warnings[0].message).toContain('doesn\'t match calculated duration');
    });

    test('should warn about large gaps between cues', () => {
      const jsonCues = [
        cueToJsonCaption(commonCues[0], 0),
        {
          type: 'caption',
          index: 2,
          start: 10000, // 7-second gap from previous cue (3000ms end -> 10000ms start)
          end: 12000,
          duration: 2000,
          content: 'Second caption',
          text: 'Second caption'
        }
      ];
      const jsonContent = createJsonContent(jsonCues);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('GAP_BETWEEN_CUES');
      expect(result.warnings[0].message).toContain('Large gap (7.0s)');
    });

    test('should handle mixed caption and meta entries', () => {
      const mixedContent = [
        { type: 'meta', index: 0, start: 0, end: 0, duration: 0, content: 'metadata', text: 'metadata' },
        cueToJsonCaption(commonCues[0], 0),
        { type: 'caption', index: 2, start: 4000, end: 6000, duration: 2000, content: 'Second caption', text: 'Second caption' }
      ];
      const jsonContent = createJsonContent(mixedContent);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should handle empty JSON array', () => {
      const jsonContent = createJsonContent([]);
      const result = validateJsonStructure(jsonContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Round-trip conversion', () => {
    test('should maintain data integrity through parse and convert cycle', () => {
      const jsonCues = commonCues.map((cue, index) => cueToJsonCaption(cue, index));
      const original = createJsonContent(jsonCues);
      const parsed = parseJson(original);
      const converted = toJson(parsed);
      const reparsed = parseJson(converted);
      
      expect(parsed).toEqual(reparsed);
    });

    test('should preserve multiline text in round-trip', () => {
      const jsonCues = multilineCues.map((cue, index) => cueToJsonCaption(cue, index));
      const original = createJsonContent(jsonCues);
      const parsed = parseJson(original);
      const converted = toJson(parsed);
      const reparsed = parseJson(converted);
      
      expect(reparsed[0].text).toBe(multilineCues[0].text);
    });

    test('should handle empty array in round-trip', () => {
      const original = createJsonContent([]);
      const parsed = parseJson(original);
      const converted = toJson(parsed);
      const reparsed = parseJson(converted);
      
      expect(parsed).toEqual(reparsed);
      expect(parsed).toHaveLength(0);
    });
  });
});