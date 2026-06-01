/**
 * ThreatDashboard — Right panel showing threat alerts and audit summary.
 *
 * Contains:
 * - Threat alert cards (slide-in animation)
 * - "No threats" placeholder when clean
 */

import React from 'react';
import ThreatCard from './ThreatCard';

export default function ThreatDashboard({ threats }) {
  return (
    <div className="glass-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-lg">⚠️</span>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Threat Alerts
          </h2>
        </div>
        {threats.length > 0 && (
          <span className="badge-critical flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {threats.length}
          </span>
        )}
      </div>

      {/* Threat Cards */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {threats.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-30">🔒</div>
              <p className="text-sm text-gray-500">No threats detected</p>
              <p className="text-xs text-gray-700 mt-1">Threats will appear here in real time</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {threats.map((threat) => (
              <ThreatCard key={threat._id} event={threat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
