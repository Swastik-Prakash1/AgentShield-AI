/**
 * ThreatCard — Animated threat alert component.
 *
 * Slides in from the right when a threat is detected. Shows:
 * - Threat type badge
 * - Confidence bar
 * - Severity badge
 * - Explanation text
 * - Extracted payload in monospace code block
 * - Action taken with timestamp
 */

import React from 'react';
import { getSeverityColor, getThreatTypeLabel, formatTimestamp, formatConfidence } from '../lib/threatColors';

export default function ThreatCard({ event }) {
  const assessment = event.event || event;
  const severity = assessment.threat_severity || 'high';
  const colors = getSeverityColor(severity);
  const typeLabel = getThreatTypeLabel(assessment.threat_type);
  const confidence = assessment.threat_confidence;

  return (
    <div
      className={`animate-slide-in-right glass-card p-4 border-l-4 ${colors.border} mb-4 relative overflow-hidden`}
      style={{ borderLeftColor: colors.hex }}
    >
      {/* Threat flash overlay */}
      <div className="absolute inset-0 animate-threat-flash pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-lg">🚨</span>
          <span className="text-red-400 font-bold text-sm uppercase tracking-wider">
            Threat Intercepted
          </span>
        </div>
        <span className="text-gray-500 text-xs font-mono">
          {formatTimestamp(assessment.timestamp)}
        </span>
      </div>

      {/* Threat type badge */}
      <div className="mb-3 relative">
        <span
          className={`inline-block px-3 py-1 rounded-md text-xs font-bold tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}
        >
          {assessment.threat_type}
        </span>
      </div>

      {/* Confidence bar */}
      {confidence != null && (
        <div className="mb-3 relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-xs font-medium">Confidence</span>
            <span className={`text-sm font-bold ${colors.text}`}>
              {formatConfidence(confidence)}
            </span>
          </div>
          <div className="w-full h-2 bg-surface-600 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${confidence * 100}%`,
                backgroundColor: colors.hex,
                boxShadow: `0 0 8px ${colors.hex}`,
              }}
            />
          </div>
        </div>
      )}

      {/* Severity */}
      <div className="flex items-center gap-2 mb-3 relative">
        <span className="text-gray-400 text-xs">Severity:</span>
        <span className={colors.badge}>{severity}</span>
      </div>

      {/* Explanation */}
      {assessment.explanation && (
        <p className="text-gray-300 text-sm mb-3 leading-relaxed relative">
          {assessment.explanation}
        </p>
      )}

      {/* Extracted payload */}
      {assessment.extracted_payload && (
        <div className="mb-3 relative">
          <span className="text-gray-400 text-xs font-medium block mb-1">
            Extracted Payload:
          </span>
          <pre className="bg-surface-900/80 border border-red-900/30 rounded-lg p-3 text-xs font-mono text-red-300 whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
            {assessment.extracted_payload}
          </pre>
        </div>
      )}

      {/* Action taken */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 relative">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Action:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600/20 text-red-400 rounded text-xs font-bold uppercase">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {assessment.action_taken || 'BLOCKED'}
          </span>
        </div>
        <span className="text-gray-500 text-xs">
          {assessment.tool_name && `${assessment.tool_name}`}
        </span>
      </div>
    </div>
  );
}
