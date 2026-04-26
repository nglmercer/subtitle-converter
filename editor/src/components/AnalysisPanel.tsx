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
    <div class="analysis-tip">
      <span class="analysis-tip-trigger">{analysis.totalCues}c · {fmtMs(analysis.totalDuration)}</span>
      <div class="analysis-tip-popup">
        <div class="analysis-tip-row">
          <span>Total Cues</span><span class="analysis-tip-val">{analysis.totalCues}</span>
        </div>
        <div class="analysis-tip-row">
          <span>Duration</span><span class="analysis-tip-val">{fmtMs(analysis.totalDuration)}</span>
        </div>
        <div class="analysis-tip-row">
          <span>Avg Duration</span><span class="analysis-tip-val">{fmtMs(analysis.averageDuration)}</span>
        </div>
        <div class="analysis-tip-row">
          <span>Total Lines</span><span class="analysis-tip-val">{analysis.totalLines}</span>
        </div>
        <div class="analysis-tip-divider" />
        <div class="analysis-tip-row">
          <span>Shortest</span>
          <span class="analysis-tip-val">{fmtMs(analysis.shortestCue.duration)}</span>
        </div>
        <div class="analysis-tip-row analysis-tip-text">
          <span>{analysis.shortestCue.text || '(empty)'}</span>
        </div>
        <div class="analysis-tip-row">
          <span>Longest</span>
          <span class="analysis-tip-val">{fmtMs(analysis.longestCue.duration)}</span>
        </div>
        <div class="analysis-tip-row analysis-tip-text">
          <span>{analysis.longestCue.text || '(empty)'}</span>
        </div>
      </div>
    </div>
  );
}
