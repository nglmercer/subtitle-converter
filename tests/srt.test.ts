import { describe, expect, test } from 'bun:test';
import { parseSrt, toSrt, validateSrtStructure } from '../src/formats/srt.js';

describe('SRT Format', () => {
  const sampleSrt = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:04,000 --> 00:00:06,000
This is a test subtitle

3
00:00:07,000 --> 00:00:09,000
Testing SRT format`;

  describe('parseSrt', () => {
    test('should parse valid SRT content', () => {
      const result = parseSrt(sampleSrt);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        startTime: '00:00:01,000',
        endTime: '00:00:03,000',
        text: 'Hello world'
      });
      expect(result[1]).toEqual({
        startTime: '00:00:04,000',
        endTime: '00:00:06,000',
        text: 'This is a test subtitle'
      });
    });

    test('should handle empty lines and whitespace', () => {
      const srtWithWhitespace = `1
00:00:01,000 --> 00:00:03,000
  Hello world  

2
00:00:04,000 --> 00:00:06,000
This is a test subtitle

3
00:00:07,000 --> 00:00:09,000
Testing SRT format`;
      
      const result = parseSrt(srtWithWhitespace);
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('  Hello world  ');
    });
  });

  describe('toSrt', () => {
    test('should convert cues to SRT format', () => {
      const cues = [
        {
          startTime: '00:00:01,000',
          endTime: '00:00:03,000',
          text: 'Hello world'
        },
        {
          startTime: '00:00:04,000',
          endTime: '00:00:06,000',
          text: 'This is a test subtitle'
        }
      ];

      const result = toSrt(cues);
      const expected = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:04,000 --> 00:00:06,000
This is a test subtitle`;

      expect(result).toBe(expected);
    });

    test('should handle empty array', () => {
      const result = toSrt([]);
      expect(result).toBe('');
    });
  });

  describe('validateSrtStructure', () => {
    test('should validate correct SRT structure', () => {
      const result = validateSrtStructure(sampleSrt);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should detect overlapping cues', () => {
      const srtWithOverlap = `1
00:00:01,000 --> 00:00:05,000
First subtitle

2
00:00:03,000 --> 00:00:07,000
Overlapping subtitle`;

      const result = validateSrtStructure(srtWithOverlap);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('OVERLAPPING_CUES');
    });

    test('should detect invalid time format', () => {
      const srtWithInvalidTime = `1
00:00:01.000 --> 00:00:03,000
Invalid time format`;

      const result = validateSrtStructure(srtWithInvalidTime);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should detect empty cues', () => {
      const srtWithEmptyCue = `1
00:00:01,000 --> 00:00:03,000

2
00:00:04,000 --> 00:00:06,000
Valid subtitle`;

      const result = validateSrtStructure(srtWithEmptyCue);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('EMPTY_CUE');
    });
  });
});