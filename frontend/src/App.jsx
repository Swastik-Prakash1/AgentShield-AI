/**
 * App.jsx — AgentShield Dashboard
 *
 * Three-column layout:
 * - Left: Demo controls + Manifest viewer
 * - Center: Agent activity feed + Audit trail
 * - Right: Threat alerts
 *
 * Premium dark theme with glassmorphism, gradients, and micro-animations.
 */

import React from 'react';
import { useAgentSocket } from './hooks/useAgentSocket';
import DemoControls from './components/DemoControls';
import AgentActivityFeed from './components/AgentActivityFeed';
import ThreatDashboard from './components/ThreatDashboard';
import AuditTrail from './components/AuditTrail';
import ManifestViewer from './components/ManifestViewer';

export default function App() {
  const { events, threats, stats, isConnected, resetEvents } = useAgentSocket();

  return (
    <div className="min-h-screen bg-surface-900 text-white">
      {/* Top gradient bar */}
      <div className="h-1 bg-gradient-to-r from-shield-600 via-cyan-500 to-shield-600" />

      {/* Header */}
      <header className="border-b border-white/5 bg-surface-800/50 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-shield-pulse">🛡️</span>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-tight">
                AgentShield
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
                Security Middleware for AI Agents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-500 font-mono">
                {isConnected ? 'LIVE' : 'DISCONNECTED'}
              </span>
            </div>

            {/* Quick stats in header */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-center">
                <div className="text-sm font-bold text-shield-400 font-mono">{stats.callsInspected}</div>
                <div className="text-[9px] text-gray-600 uppercase">Inspected</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-red-400 font-mono">{stats.threatsCaught}</div>
                <div className="text-[9px] text-gray-600 uppercase">Threats</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-green-400 font-mono">{stats.safeCalls}</div>
                <div className="text-[9px] text-gray-600 uppercase">Safe</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-[1920px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-4 h-[calc(100vh-88px)]">
          {/* Left Sidebar — Controls */}
          <div className="flex flex-col gap-4 overflow-y-auto">
            <DemoControls stats={stats} onResetEvents={resetEvents} />
            <ManifestViewer />
          </div>

          {/* Center — Activity Feed + Audit */}
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-0">
              <AgentActivityFeed events={events} />
            </div>
            <AuditTrail events={events} />
          </div>

          {/* Right Panel — Threats */}
          <div className="min-h-0">
            <ThreatDashboard threats={threats} />
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 h-8 bg-surface-900/80 backdrop-blur-sm border-t border-white/5 flex items-center justify-between px-4">
        <span className="text-[10px] text-gray-600">
          AgentShield v1.0 — Microsoft Build AI Hackathon 2025
        </span>
        <span className="text-[10px] text-gray-600">
          Powered by Gemini 3 Flash • FastAPI • React
        </span>
      </div>
    </div>
  );
}
