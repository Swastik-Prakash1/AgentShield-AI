/**
 * AuditTrail — Scrollable table of all audit events with severity coloring.
 */

import React from 'react';
import { getSeverityColor, formatTimestamp } from '../lib/threatColors';

export default function AuditTrail({ events }) {
  // Filter to only show tool-related events (SAFE and THREAT)
  const auditEvents = events.filter(
    (e) => e.type === 'SAFE_CALL' || e.type === 'THREAT_DETECTED'
  );

  if (auditEvents.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-shield-400">📋</span>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Audit Trail
          </h2>
        </div>
        <span className="text-gray-500 text-xs font-mono">{auditEvents.length} entries</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-surface-800/50 sticky top-0">
            <tr className="text-gray-500 uppercase tracking-wider">
              <th className="text-left px-4 py-2 font-semibold">Time</th>
              <th className="text-left px-4 py-2 font-semibold">Tool</th>
              <th className="text-left px-4 py-2 font-semibold">Status</th>
              <th className="text-left px-4 py-2 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {auditEvents.map((event) => {
              const data = event.event || {};
              const isThreat = event.type === 'THREAT_DETECTED';
              const severity = data.threat_severity;
              const colors = severity ? getSeverityColor(severity) : null;

              return (
                <tr
                  key={event._id}
                  className={`border-t border-white/[0.03] ${
                    isThreat ? 'bg-red-900/10' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-gray-500 whitespace-nowrap">
                    {formatTimestamp(event._localTime)}
                  </td>
                  <td className="px-4 py-2 text-gray-300 font-medium">
                    {data.tool_name || '—'}
                  </td>
                  <td className="px-4 py-2">
                    {isThreat ? (
                      <span className={colors?.badge || 'badge-critical'}>
                        {data.threat_type?.split('::')[1] || 'THREAT'}
                      </span>
                    ) : (
                      <span className="badge-safe">SAFE</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-400 max-w-[200px] truncate">
                    {data.explanation || 'Allowed'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
