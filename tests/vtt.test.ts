import { describe, expect, test } from 'bun:test';
import { parseVtt, toVtt, validateVttStructure } from '../src/formats/vtt.js';

describe('VTT Format', () => {
  const sampleVtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello world

00:00:04.000 --> 00:00:06.000
This is a test subtitle

00:00:07.000 --> 00:00:09.000
Testing VTT format`;

  describe('parseVtt', () => {
    test('should parse valid VTT content', () => {
      const result = parseVtt(sampleVtt);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        startTime: '00:00:01.000',
        endTime: '00:00:03.000',
        text: 'Hello world'
      });
      expect(result[1]).toEqual({
        startTime: '00:00:04.000',
        endTime: '00:00:06.000',
        text: 'This is a test subtitle'
      });
    });

    test('should throw error for missing WEBVTT header', () => {
      const invalidVtt = `00:00:01.000 --> 00:00:03.000
Hello world`;
      
      expect(() => parseVtt(invalidVtt)).toThrow('Invalid VTT file: missing WEBVTT header');
    });

    test('should skip metadata blocks', () => {
      const vttWithMetadata = `WEBVTT
Kind: captions
Language: en

00:00:01.000 --> 00:00:03.000
Hello world

00:00:04.000 --> 00:00:06.000
This is a test subtitle`;
      
      const result = parseVtt(vttWithMetadata);
      expect(result).toHaveLength(2);
    });
  });

  describe('toVtt', () => {
    test('should convert cues to VTT format', () => {
      const cues = [
        {
          startTime: '00:00:01.000',
          endTime: '00:00:03.000',
          text: 'Hello world'
        },
        {
          startTime: '00:00:04.000',
          endTime: '00:00:06.000',
          text: 'This is a test subtitle'
        }
      ];

      const result = toVtt(cues);
      const expected = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello world

00:00:04.000 --> 00:00:06.000
This is a test subtitle`;

      expect(result).toBe(expected);
    });

    test('should handle empty array', () => {
      const result = toVtt([]);
      expect(result).toBe('WEBVTT');
    });
  });

  describe('validateVttStructure', () => {
    test('should validate correct VTT structure', () => {
      const result = validateVttStructure(sampleVtt);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should detect missing WEBVTT header', () => {
      const invalidVtt = `00:00:01.000 --> 00:00:03.000
Hello world`;

      const result = validateVttStructure(invalidVtt);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_FORMAT');
    });

    test('should detect overlapping cues', () => {
      const vttWithOverlap = `WEBVTT

00:00:01.000 --> 00:00:05.000
First subtitle

00:00:03.000 --> 00:00:07.000
Overlapping subtitle`;

      const result = validateVttStructure(vttWithOverlap);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('OVERLAPPING_CUES');
    });

    test('should detect invalid time format', () => {
      const vttWithInvalidTime = `WEBVTT

00:00:01,000 --> 00:00:03.000
Invalid time format`;

      const result = validateVttStructure(vttWithInvalidTime);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('INVALID_TIMECODE');
    });

    test('should detect empty cues', () => {
      const vttWithEmptyCue = `WEBVTT

00:00:01.000 --> 00:00:03.000

00:00:04.000 --> 00:00:06.000
Valid subtitle`;

      const result = validateVttStructure(vttWithEmptyCue);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('EMPTY_CUE');
    });
  });
});