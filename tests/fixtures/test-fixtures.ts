/**
 * Shared test fixtures for subtitle format testing
 */

import type { SubtitleCue } from '../../src/types.js';

/**
 * Common subtitle cues used across multiple test files
 */
export const commonCues: SubtitleCue[] = [
  {
    startTime: '00:00:01,000',
    endTime: '00:00:03,000',
    text: 'Hello world'
  },
  {
    startTime: '00:00:04,000',
    endTime: '00:00:06,000',
    text: 'This is a test subtitle'
  },
  {
    startTime: '00:00:07,000',
    endTime: '00:00:09,000',
    text: 'Testing subtitle format'
  }
];

/**
 * Cues with multiline text
 */
export const multilineCues: SubtitleCue[] = [
  {
    startTime: '00:00:01,000',
    endTime: '00:00:03,000',
    text: 'Line 1\nLine 2\nLine 3'
  }
];

/**
 * Overlapping cues for validation tests
 */
export const overlappingCues: SubtitleCue[] = [
  {
    startTime: '00:00:01,000',
    endTime: '00:00:05,000',
    text: 'First subtitle'
  },
  {
    startTime: '00:00:03,000',
    endTime: '00:00:07,000',
    text: 'Overlapping subtitle'
  }
];

/**
 * Template builder for SRT format
 */
export class SrtBuilder {
  private cues: SubtitleCue[] = [];

  addCue(cue: SubtitleCue): this {
    this.cues.push(cue);
    return this;
  }

  addCues(cues: SubtitleCue[]): this {
    this.cues.push(...cues);
    return this;
  }

  build(): string {
    return this.cues
      .map((cue, index) => {
        const cueNumber = (index + 1).toString();
        const timeRange = `${cue.startTime} --> ${cue.endTime}`;
        return `${cueNumber}\n${timeRange}\n${cue.text}`;
      })
      .join('\n\n');
  }

  reset(): this {
    this.cues = [];
    return this;
  }
}

/**
 * Template builder for VTT format
 */
export class VttBuilder {
  private cues: SubtitleCue[] = [];
  private header: string = 'WEBVTT';
  private metadata: string[] = [];

  addCue(cue: SubtitleCue): this {
    // Convert SRT time format to VTT if needed
    const convertedCue = {
      ...cue,
      startTime: cue.startTime.replace(',', '.'),
      endTime: cue.endTime.replace(',', '.')
    };
    this.cues.push(convertedCue);
    return this;
  }

  addCues(cues: SubtitleCue[]): this {
    cues.forEach(cue => this.addCue(cue));
    return this;
  }

  addMetadata(key: string, value: string): this {
    this.metadata.push(`${key}: ${value}`);
    return this;
  }

  withoutHeader(): this {
    this.header = '';
    return this;
  }

  build(): string {
    const parts: string[] = [];
    
    if (this.header) {
      parts.push(this.header);
    }

    if (this.metadata.length > 0) {
      parts.push(this.metadata.join('\n'));
    }

    if (this.cues.length > 0) {
      const cuesStr = this.cues
        .map(cue => `${cue.startTime} --> ${cue.endTime}\n${cue.text}`)
        .join('\n\n');
      parts.push(cuesStr);
    }

    return parts.join('\n\n');
  }

  reset(): this {
    this.cues = [];
    this.header = 'WEBVTT';
    this.metadata = [];
    return this;
  }
}

/**
 * Template builder for ASS format
 */
export class AssBuilder {
  private cues: SubtitleCue[] = [];
  private title: string = 'Sample ASS Subtitle';
  private hasScriptInfo: boolean = true;
  private hasStyles: boolean = true;
  private hasEvents: boolean = true;

  addCue(cue: SubtitleCue): this {
    this.cues.push(cue);
    return this;
  }

  addCues(cues: SubtitleCue[]): this {
    this.cues.push(...cues);
    return this;
  }

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  withoutScriptInfo(): this {
    this.hasScriptInfo = false;
    return this;
  }

  withoutStyles(): this {
    this.hasStyles = false;
    return this;
  }

  withoutEvents(): this {
    this.hasEvents = false;
    return this;
  }

  build(): string {
    const parts: string[] = [];

    // Script Info section
    if (this.hasScriptInfo) {
      parts.push(
        '[Script Info]',
        `Title: ${this.title}`,
        'ScriptType: v4.00+',
        'Collisions: Normal',
        'PlayDepth: 0',
        ''
      );
    }

    // Styles section
    if (this.hasStyles) {
      parts.push(
        '[V4+ Styles]',
        'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
        'Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1',
        ''
      );
    }

    // Events section
    if (this.hasEvents) {
      parts.push(
        '[Events]',
        'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
      );

      if (this.cues.length > 0) {
        const dialogues = this.cues.map(cue => {
          const startTime = this.convertToAssTime(cue.startTime);
          const endTime = this.convertToAssTime(cue.endTime);
          const assText = cue.text.replace(/\n/g, '\\N');
          return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${assText}`;
        });
        parts.push(...dialogues);
      }
    }

    return parts.join('\n');
  }

  private convertToAssTime(time: string): string {
    // Convert HH:MM:SS,mmm to H:MM:SS.cc
    const match = time.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
    if (!match) return '0:00:00.00';

    const hours = parseInt(match[1]!, 10);
    const minutes = match[2];
    const seconds = match[3];
    const milliseconds = parseInt(match[4]!, 10);
    const centiseconds = Math.floor(milliseconds / 10).toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}.${centiseconds}`;
  }

  reset(): this {
    this.cues = [];
    this.title = 'Sample ASS Subtitle';
    this.hasScriptInfo = true;
    this.hasStyles = true;
    this.hasEvents = true;
    return this;
  }
}

/**
 * Helper to create invalid test cases
 */
export const invalidCases = {
  srt: {
    invalidTimeFormat: `1
00:00:01.000 --> 00:00:03,000
Invalid time format`,
    
    emptyCue: `1
00:00:01,000 --> 00:00:03,000

2
00:00:04,000 --> 00:00:06,000
Valid subtitle`,
    
    missingCueNumber: `
00:00:01,000 --> 00:00:03,000
Missing cue number`
  },
  
  vtt: {
    missingHeader: `00:00:01.000 --> 00:00:03.000
Hello world`,
    
    invalidTimeFormat: `WEBVTT

00:00:01,000 --> 00:00:03.000
Invalid time format`,
    
    emptyCue: `WEBVTT

00:00:01.000 --> 00:00:03.000

00:00:04.000 --> 00:00:06.000
Valid subtitle`
  },
  
  ass: {
    missingSection: (section: 'Script Info' | 'Styles' | 'Events') => {
      const builder = new AssBuilder().addCues(commonCues);
      
      if (section === 'Script Info') builder.withoutScriptInfo();
      if (section === 'Styles') builder.withoutStyles();
      if (section === 'Events') builder.withoutEvents();
      
      return builder.build();
    },
    
    invalidTimeFormat: `[Script Info]
Title: Invalid Time
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,invalid_time,0:00:03.00,Default,,0,0,0,,Invalid time format`
  }
};