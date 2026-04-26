import type { SubtitleAnalysis } from 'subs-converter';
import './AnalysisPanel.css';

interface Props {
  analysis: SubtitleAnalysis;
}

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AnalysisPanel({ analysis }: Props) {
  return (
    <div class="analysis-panel">
      <h3>Analysis</h3>
      <div class="analysis-grid">
        <div class="analysis-item">
          <span class="analysis-label">Total Cues</span>
          <span class="analysis-value">{analysis.totalCues}</span>
        </div>
        <div class="analysis-item">
          <span class="analysis-label">Duration</span>
          <span class="analysis-value">{fmtMs(analysis.totalDuration)}</span>
        </div>
        <div class="analysis-item">
          <span class="analysis-label">Avg Duration</span>
          <span class="analysis-value">{fmtMs(analysis.averageDuration)}</span>
        </div>
        <div class="analysis-item">
          <span class="analysis-label">Lines</span>
          <span class="analysis-value">{analysis.totalLines}</span>
        </div>
        <div class="analysis-item" style={{ gridColumn: '1 / -1' }}>
          <span class="analysis-label">Shortest Cue</span>
          <span class="analysis-text">
            {analysis.shortestCue.text || '(empty)'} — {fmtMs(analysis.shortestCue.duration)}
          </span>
        </div>
        <div class="analysis-item" style={{ gridColumn: '1 / -1' }}>
          <span class="analysis-label">Longest Cue</span>
          <span class="analysis-text">
            {analysis.longestCue.text || '(empty)'} — {fmtMs(analysis.longestCue.duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
