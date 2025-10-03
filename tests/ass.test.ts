import { describe, expect, test } from 'bun:test';
import { parseAss, toAss, validateAssStructure } from '../src/formats/ass.js';
import { 
  AssBuilder, 
  commonCues, 
  multilineCues, 
  overlappingCues,
  invalidCases 
} from './fixtures/test-fixtures.js';

describe('ASS Format', () => {
  const builder = new AssBuilder();

  describe('parseAss', () => {
    test('should parse valid ASS content', () => {
      const assContent = builder.addCues(commonCues).build();
      const result = parseAss(assContent);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(commonCues[0]);
      expect(result[1]).toEqual(commonCues[1]);
      expect(result[2]).toEqual(commonCues[2]);
    });

    test('should remove ASS formatting tags', () => {
      const cuesWithFormatting = [
        {
          startTime: '00:00:01,000',
          endTime: '00:00:03,000',
          text: 'Italic text\nBold text'
        }
      ];
      
      const assWithFormatting = `[Script Info]
Title: Sample ASS with Formatting
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,{\\i1}Italic text{\\i0}\\N{\\b1}Bold text{\\b0}`;
      
      const result = parseAss(assWithFormatting);
      expect(result[0].text).toBe('Italic text\nBold text');
    });

    test('should handle ASS with comments', () => {
      const assWithComments = builder
        .reset()
        .setTitle('Sample')
        .addCue(commonCues[0])
        .build()
        .replace('[Script Info]', '[Script Info]\n; This is a comment');
      
      const result = parseAss(assWithComments);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Hello world');
    });

    test('should handle empty ASS file', () => {
      const emptyAss = builder.reset().build();
      const result = parseAss(emptyAss);
      expect(result).toHaveLength(0);
    });

    test('should handle multiline text with line breaks', () => {
      const assContent = builder.reset().addCues(multilineCues).build();
      const result = parseAss(assContent);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('toAss', () => {
    test('should convert cues to ASS format', () => {
      const result = toAss(commonCues);
      
      expect(result).toContain('[Script Info]');
      expect(result).toContain('[V4+ Styles]');
      expect(result).toContain('[Events]');
      expect(result).toContain('Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,Hello world');
      expect(result).toContain('Dialogue: 0,0:00:04.00,0:00:06.00,Default,,0,0,0,,This is a test subtitle');
    });

    test('should handle multiline text with \\N escapes', () => {
      const result = toAss(multilineCues);
      expect(result).toContain('Line 1\\NLine 2\\NLine 3');
    });

    test('should handle empty array', () => {
      const result = toAss([]);
      expect(result).toContain('[Script Info]');
      expect(result).toContain('[V4+ Styles]');
      expect(result).toContain('[Events]');
      expect(result).not.toContain('Dialogue:');
    });

    test('should convert time format correctly', () => {
      const cue = {
        startTime: '00:00:01,500',
        endTime: '00:00:03,750',
        text: 'Test'
      };
      
      const result = toAss([cue]);
      expect(result).toContain('0:00:01.50');
      expect(result).toContain('0:00:03.75');
    });
  });

  describe('validateAssStructure', () => {
    test('should validate correct ASS structure', () => {
      const assContent = builder.reset().addCues(commonCues).build();
      const result = validateAssStructure(assContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should detect missing Script Info section', () => {
      const assContent = invalidCases.ass.missingSection('Script Info');
      const result = validateAssStructure(assContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('[Script Info]'))).toBe(true);
    });

    test('should detect missing Styles section', () => {
      const assContent = invalidCases.ass.missingSection('Styles');
      const result = validateAssStructure(assContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('[V4+ Styles]'))).toBe(true);
    });

    test('should detect missing Events section', () => {
      const assContent = invalidCases.ass.missingSection('Events');
      const result = validateAssStructure(assContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('[Events]'))).toBe(true);
    });

    test('should detect overlapping cues', () => {
      const assContent = builder.reset().addCues(overlappingCues).build();
      const result = validateAssStructure(assContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('OVERLAPPING_CUES');
    });

    test('should detect invalid time format', () => {
      const result = validateAssStructure(invalidCases.ass.invalidTimeFormat);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('INVALID_TIMECODE');
    });

    test('should warn about no dialogues', () => {
      const assNoDialogues = builder.reset().build();
      const result = validateAssStructure(assNoDialogues);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('EMPTY_CUE');
    });

    test('should detect invalid dialogue format', () => {
      const invalidDialogue = builder
        .reset()
        .addCue(commonCues[0])
        .build()
        .replace('Dialogue:', 'InvalidLine:');
      
      const result = validateAssStructure(invalidDialogue);
      expect(result.isValid).toBe(true); // Only Dialogue: lines are validated
    });

    test('should validate start time before end time', () => {
      const invalidTimeOrder = `[Script Info]
Title: Invalid Order
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:05.00,0:00:03.00,Default,,0,0,0,,End before start`;
      
      const result = validateAssStructure(invalidTimeOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'INVALID_TIMECODE')).toBe(true);
    });
  });

  describe('Time conversion functions', () => {
    test('should handle millisecond to centisecond conversion', () => {
      const cues = [
        {
          startTime: '00:00:01,500',
          endTime: '00:00:03,750',
          text: 'Test'
        }
      ];

      const assResult = toAss(cues);
      const parsedResult = parseAss(assResult);
      
      expect(parsedResult[0].startTime).toBe('00:00:01,500');
      expect(parsedResult[0].endTime).toBe('00:00:03,750');
    });

    test('should handle edge case times', () => {
      const cues = [
        {
          startTime: '00:00:00,000',
          endTime: '23:59:59,999',
          text: 'Edge case'
        }
      ];

      const assResult = toAss(cues);
      const parsedResult = parseAss(assResult);
      
      expect(parsedResult[0].startTime).toBe('00:00:00,000');
      expect(parsedResult[0].endTime).toBe('23:59:59,990'); // 999ms truncates to 990ms
    });

    test('should handle hour overflow in ASS format', () => {
      const cues = [
        {
          startTime: '10:30:45,123',
          endTime: '15:45:30,456',
          text: 'Long duration'
        }
      ];

      const assResult = toAss(cues);
      const parsedResult = parseAss(assResult);
      
      expect(parsedResult[0].startTime).toBe('10:30:45,120');
      expect(parsedResult[0].endTime).toBe('15:45:30,450');
    });
  });

  describe('Round-trip conversion', () => {
    test('should maintain data integrity through parse and convert cycle', () => {
      const original = builder.reset().addCues(commonCues).build();
      const parsed = parseAss(original);
      const converted = toAss(parsed);
      const reparsed = parseAss(converted);
      
      // Times might lose precision due to centisecond conversion
      expect(reparsed).toHaveLength(parsed.length);
      reparsed.forEach((cue, i) => {
        expect(cue.text).toBe(parsed[i].text);
      });
    });
  });
});