import { describe, expect, test } from 'bun:test';
import {
  timeToMilliseconds,
  millisecondsToSrtTime,
  millisecondsToVttTime,
  isValidTimeFormat,
  calculateDuration,
  addMilliseconds,
  compareTimes,
  doTimeRangesOverlap
} from '../src/utils/time.js';

describe('Time Utilities', () => {
  describe('timeToMilliseconds', () => {
    test('should convert SRT time format to milliseconds', () => {
      expect(timeToMilliseconds('00:00:01,000')).toBe(1000);
      expect(timeToMilliseconds('00:01:00,000')).toBe(60000);
      expect(timeToMilliseconds('01:00:00,000')).toBe(3600000);
      expect(timeToMilliseconds('01:30:45,123')).toBe(5445123);
    });

    test('should convert VTT time format to milliseconds', () => {
      expect(timeToMilliseconds('00:00:01.000')).toBe(1000);
      expect(timeToMilliseconds('00:01:00.000')).toBe(60000);
      expect(timeToMilliseconds('01:00:00.000')).toBe(3600000);
      expect(timeToMilliseconds('01:30:45.123')).toBe(5445123);
    });

    test('should handle edge cases', () => {
      expect(timeToMilliseconds('00:00:00,000')).toBe(0);
      expect(timeToMilliseconds('23:59:59,999')).toBe(86399999);
    });

    test('should throw error for invalid formats', () => {
      expect(() => timeToMilliseconds('invalid')).toThrow('Invalid time format');
      expect(() => timeToMilliseconds('00:00:00')).toThrow('Invalid time format');
      expect(() => timeToMilliseconds('00:00:00,00')).toThrow('Invalid time format');
      expect(() => timeToMilliseconds('00:00:00.0')).toThrow('Invalid time format');
      expect(() => timeToMilliseconds('25:00:00,000')).toThrow('Invalid time format');
      expect(() => timeToMilliseconds('00:60:00,000')).toThrow('Invalid time format');
      expect(() => timeToMilliseconds('00:00:60,000')).toThrow('Invalid time format');
    });
  });

  describe('millisecondsToSrtTime', () => {
    test('should convert milliseconds to SRT time format', () => {
      expect(millisecondsToSrtTime(0)).toBe('00:00:00,000');
      expect(millisecondsToSrtTime(1000)).toBe('00:00:01,000');
      expect(millisecondsToSrtTime(60000)).toBe('00:01:00,000');
      expect(millisecondsToSrtTime(3600000)).toBe('01:00:00,000');
      expect(millisecondsToSrtTime(5445123)).toBe('01:30:45,123');
    });

    test('should handle large values', () => {
      expect(millisecondsToSrtTime(86399000)).toBe('23:59:59,000');
      expect(millisecondsToSrtTime(12345678)).toBe('03:25:45,678');
    });

    test('should handle fractional milliseconds', () => {
      expect(millisecondsToSrtTime(1234.567)).toBe('00:00:01,234');
    });
  });

  describe('millisecondsToVttTime', () => {
    test('should convert milliseconds to VTT time format', () => {
      expect(millisecondsToVttTime(0)).toBe('00:00:00.000');
      expect(millisecondsToVttTime(1000)).toBe('00:00:01.000');
      expect(millisecondsToVttTime(60000)).toBe('00:01:00.000');
      expect(millisecondsToVttTime(3600000)).toBe('01:00:00.000');
      expect(millisecondsToVttTime(5445123)).toBe('01:30:45.123');
    });

    test('should handle large values', () => {
      expect(millisecondsToVttTime(86399000)).toBe('23:59:59.000');
      expect(millisecondsToVttTime(12345678)).toBe('03:25:45.678');
    });
  });

  describe('isValidTimeFormat', () => {
    test('should validate correct time formats', () => {
      expect(isValidTimeFormat('00:00:01,000')).toBe(true);
      expect(isValidTimeFormat('00:00:01.000')).toBe(true);
      expect(isValidTimeFormat('23:59:59,999')).toBe(true);
      expect(isValidTimeFormat('23:59:59.999')).toBe(true);
    });

    test('should reject invalid time formats', () => {
      expect(isValidTimeFormat('invalid')).toBe(false);
      expect(isValidTimeFormat('00:00:00')).toBe(false);
      expect(isValidTimeFormat('00:00:00,00')).toBe(false);
      expect(isValidTimeFormat('00:00:00.0')).toBe(false);
      expect(isValidTimeFormat('')).toBe(false);
      expect(isValidTimeFormat('00:00:00,0000')).toBe(false);
      expect(isValidTimeFormat('00:00:00.0000')).toBe(false);
    });
  });

  describe('calculateDuration', () => {
    test('should calculate duration between two times', () => {
      expect(calculateDuration('00:00:01,000', '00:00:02,000')).toBe(1000);
      expect(calculateDuration('00:00:01.000', '00:00:02.000')).toBe(1000);
      expect(calculateDuration('00:00:00,000', '01:00:00,000')).toBe(3600000);
      expect(calculateDuration('00:00:00.000', '00:01:00.000')).toBe(60000);
    });

    test('should handle cross-format calculations', () => {
      expect(calculateDuration('00:00:01,000', '00:00:02.000')).toBe(1000);
      expect(calculateDuration('00:00:01.000', '00:00:02,000')).toBe(1000);
    });

    test('should handle zero duration', () => {
      expect(calculateDuration('00:00:01,000', '00:00:01,000')).toBe(0);
    });

    test('should throw error for invalid times', () => {
      expect(() => calculateDuration('invalid', '00:00:02,000')).toThrow();
      expect(() => calculateDuration('00:00:01,000', 'invalid')).toThrow();
    });
  });

  describe('addMilliseconds', () => {
    test('should add milliseconds to SRT time', () => {
      expect(addMilliseconds('00:00:01,000', 1000)).toBe('00:00:02,000');
      expect(addMilliseconds('00:00:01,000', 500)).toBe('00:00:01,500');
      expect(addMilliseconds('00:00:01,000', 60000)).toBe('00:01:01,000');
    });

    test('should add milliseconds to VTT time', () => {
      expect(addMilliseconds('00:00:01.000', 1000)).toBe('00:00:02.000');
      expect(addMilliseconds('00:00:01.000', 500)).toBe('00:00:01.500');
      expect(addMilliseconds('00:00:01.000', 60000)).toBe('00:01:01.000');
    });

    test('should handle negative milliseconds', () => {
      expect(addMilliseconds('00:00:02,000', -1000)).toBe('00:00:01,000');
      expect(addMilliseconds('00:00:01.000', -500)).toBe('00:00:00.500');
    });

    test('should preserve original format', () => {
      expect(addMilliseconds('00:00:01,000', 1000)).toBe('00:00:02,000');
      expect(addMilliseconds('00:00:01.000', 1000)).toBe('00:00:02.000');
    });

    test('should throw error for negative result', () => {
      expect(() => addMilliseconds('00:00:01,000', -2000)).toThrow('Resulting time cannot be negative');
      expect(() => addMilliseconds('00:00:00,500', -1000)).toThrow('Resulting time cannot be negative');
    });

    test('should handle edge cases', () => {
      expect(addMilliseconds('00:00:00,000', 0)).toBe('00:00:00,000');
      expect(addMilliseconds('23:59:59,999', 1)).toBe('24:00:00,000');
    });
  });

  describe('compareTimes', () => {
    test('should compare times correctly', () => {
      expect(compareTimes('00:00:01,000', '00:00:02,000')).toBe(-1);
      expect(compareTimes('00:00:02,000', '00:00:01,000')).toBe(1);
      expect(compareTimes('00:00:01,000', '00:00:01,000')).toBe(0);
    });

    test('should handle cross-format comparison', () => {
      expect(compareTimes('00:00:01,000', '00:00:02.000')).toBe(-1);
      expect(compareTimes('00:00:02.000', '00:00:01,000')).toBe(1);
      expect(compareTimes('00:00:01,000', '00:00:01.000')).toBe(0);
    });

    test('should handle complex comparisons', () => {
      expect(compareTimes('01:00:00,000', '00:59:59,999')).toBe(1);
      expect(compareTimes('23:59:59,999', '24:00:00,000')).toBe(-1);
    });
  });

  describe('doTimeRangesOverlap', () => {
    test('should detect overlapping ranges', () => {
      expect(doTimeRangesOverlap('00:00:01,000', '00:00:03,000', '00:00:02,000', '00:00:04,000')).toBe(true);
      expect(doTimeRangesOverlap('00:00:02,000', '00:00:04,000', '00:00:01,000', '00:00:03,000')).toBe(true);
      expect(doTimeRangesOverlap('00:00:01,000', '00:00:04,000', '00:00:02,000', '00:00:03,000')).toBe(true);
    });

    test('should detect non-overlapping ranges', () => {
      expect(doTimeRangesOverlap('00:00:01,000', '00:00:02,000', '00:00:03,000', '00:00:04,000')).toBe(false);
      expect(doTimeRangesOverlap('00:00:03,000', '00:00:04,000', '00:00:01,000', '00:00:02,000')).toBe(false);
    });

    test('should handle adjacent ranges (non-overlapping)', () => {
      expect(doTimeRangesOverlap('00:00:01,000', '00:00:02,000', '00:00:02,000', '00:00:03,000')).toBe(false);
    });

    test('should handle identical ranges', () => {
      expect(doTimeRangesOverlap('00:00:01,000', '00:00:03,000', '00:00:01,000', '00:00:03,000')).toBe(true);
    });

    test('should handle cross-format ranges', () => {
      expect(doTimeRangesOverlap('00:00:01,000', '00:00:03,000', '00:00:02.000', '00:00:04.000')).toBe(true);
      expect(doTimeRangesOverlap('00:00:01.000', '00:00:03.000', '00:00:02,000', '00:00:04,000')).toBe(true);
    });
  });
});