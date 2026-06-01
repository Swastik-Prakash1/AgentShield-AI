/**
 * DemoControls — Control panel for the AgentShield demo.
 *
 * Contains:
 * - Shield toggle (animated green/red)
 * - Scenario selector dropdown
 * - Run Demo / Reset buttons
 * - Live stats counters
 */

import React, { useState } from 'react';

const SCENARIOS = [
  { id: 'malicious_hotel', label: 'Malicious Hotel (Exfiltration)', icon: '🏨' },
  { id: 'role_escalation', label: 'Flight Deals (Role Escalation)', icon: '✈️' },
  { id: 'safe_booking', label: 'Safe Booking (No Attack)', icon: '✅' },
];

export default function DemoControls({ stats, onResetEvents }) {
  const [shieldActive, setShieldActive] = useState(true);
  const [scenario, setScenario] = useState('malicious_hotel');
  const [isRunning, setIsRunning] = useState(false);

  const handleToggleShield = async () => {
    const newState = !shieldActive;
    setShieldActive(newState);
    try {
      await fetch(`/api/shield/toggle?active=${newState}`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to toggle shield:', err);
    }
  };

  const handleRunDemo = async () => {
    setIsRunning(true);
    onResetEvents();

    try {
      const res = await fetch(
        `/api/run-demo?scenario_id=${scenario}&shield_active=${shieldActive}`,
        { method: 'POST' }
      );
      const data = await res.json();
      console.log('Demo result:', data);
    } catch (err) {
      console.error('Demo failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = async () => {
    onResetEvents();
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  return (
    <div className="glass-card p-5 space-y-6">
      {/* Logo / Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl">🛡️</span>
          <h1 className="text-xl font-bold gradient-text">AgentShield</h1>
        </div>
        <p className="text-gray-500 text-xs tracking-widest uppercase">
          AI Agent Security Middleware
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Shield Toggle */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-3">
          Shield Status
        </label>
        <button
          onClick={handleToggleShield}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 ${
            shieldActive
              ? 'bg-green-900/20 border-green-500/30 glow-green'
              : 'bg-red-900/20 border-red-500/30 glow-red'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full transition-colors duration-300 ${
                shieldActive ? 'bg-green-500 animate-shield-pulse' : 'bg-red-500'
              }`}
            />
            <span
              className={`font-bold text-sm ${
                shieldActive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {shieldActive ? 'SHIELD ACTIVE' : 'SHIELD DISABLED'}
            </span>
          </div>
          {/* Toggle switch visual */}
          <div
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
              shieldActive ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                shieldActive ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Scenario Selector */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-2">
          Demo Scenario
        </label>
        <div className="space-y-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                scenario === s.id
                  ? 'bg-shield-600/20 border border-shield-500/30 text-shield-300'
                  : 'bg-surface-600/30 border border-transparent text-gray-400 hover:bg-surface-600/50 hover:text-gray-300'
              }`}
            >
              <span>{s.icon}</span>
              <span className="font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleRunDemo}
          disabled={isRunning}
          className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
            isRunning
              ? 'bg-surface-600 text-gray-500 cursor-wait'
              : 'bg-gradient-to-r from-shield-600 to-cyan-600 hover:from-shield-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-shield-600/25'
          }`}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Running Demo...
            </span>
          ) : (
            '▶ Run Demo'
          )}
        </button>
        <button
          onClick={handleReset}
          disabled={isRunning}
          className="w-full py-2.5 rounded-xl font-semibold text-sm text-gray-400 bg-surface-600/30 border border-white/5 hover:bg-surface-600/50 hover:text-gray-300 transition-all duration-200"
        >
          ↻ Reset
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Stats */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-3">
          Session Stats
        </label>
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Inspected" value={stats.callsInspected} color="text-shield-400" />
          <StatBox label="Threats" value={stats.threatsCaught} color="text-red-400" />
          <StatBox label="Safe" value={stats.safeCalls} color="text-green-400" />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="bg-surface-800/50 rounded-lg p-3 text-center border border-white/5">
      <div className={`text-2xl font-bold ${color} font-mono`}>{value}</div>
      <div className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
