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
      <div class="analysis-row">
        <span>Total Cues</span><span class="analysis-val">{analysis.totalCues}</span>
      </div>
      <div class="analysis-row">
        <span>Duration</span><span class="analysis-val">{fmtMs(analysis.totalDuration)}</span>
      </div>
      <div class="analysis-row">
        <span>Avg Duration</span><span class="analysis-val">{fmtMs(analysis.averageDuration)}</span>
      </div>
      <div class="analysis-row">
        <span>Total Lines</span><span class="analysis-val">{analysis.totalLines}</span>
      </div>
      <div class="analysis-divider" />
      <div class="analysis-row">
        <span>Shortest</span>
        <span class="analysis-val">{fmtMs(analysis.shortestCue.duration)}</span>
      </div>
      <div class="analysis-row analysis-text">
        <span>{analysis.shortestCue.text || '(empty)'}</span>
      </div>
      <div class="analysis-row">
        <span>Longest</span>
        <span class="analysis-val">{fmtMs(analysis.longestCue.duration)}</span>
      </div>
      <div class="analysis-row analysis-text">
        <span>{analysis.longestCue.text || '(empty)'}</span>
      </div>
    </div>
  );
}
