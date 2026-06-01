/**
 * AgentActivityFeed — Terminal-like live feed of agent actions.
 *
 * Shows a scrolling log with timestamps, emoji indicators, and
 * color-coded entries for tool calls, thinking, threats, and results.
 */

import React, { useEffect, useRef } from 'react';
import { EVENT_TYPE_ICONS, formatTimestamp } from '../lib/threatColors';

function FeedEntry({ event }) {
  const time = formatTimestamp(event._localTime);
  const type = event.type;
  const icon = EVENT_TYPE_ICONS[type] || '📌';

  const renderContent = () => {
    switch (type) {
      case 'DEMO_START':
        return (
          <span className="text-shield-400">
            Demo started: <span className="text-white font-medium">{event.scenario_id}</span>
            {event.shield_active ? (
              <span className="text-green-400 ml-2">[Shield ON]</span>
            ) : (
              <span className="text-red-400 ml-2">[Shield OFF]</span>
            )}
          </span>
        );

      case 'AGENT_START':
        return (
          <span className="text-shield-300">
            Agent started task: <span className="text-white italic">"{event.task}"</span>
          </span>
        );

      case 'TOOL_CALL':
        return (
          <span className="text-blue-300">
            Tool call: <span className="text-yellow-300 font-semibold">{event.tool}</span>
            {event.input?.url && (
              <span className="text-gray-400"> → {event.input.url}</span>
            )}
            {event.input?.to && (
              <span className="text-gray-400"> → to: {event.input.to}</span>
            )}
            {event.tool === 'get_calendar' && (
              <span className="text-gray-400"> → fetching user calendar</span>
            )}
          </span>
        );

      case 'SAFE_CALL':
        return (
          <span className="text-green-400">
            AgentShield: <span className="font-semibold">SAFE</span>
            <span className="text-gray-400 ml-1">
              ({event.event?.tool_name}
              {event.event?.tool_input?.url && `, ${new URL(event.event.tool_input.url).hostname}`}
              )
            </span>
          </span>
        );

      case 'THREAT_DETECTED':
        return (
          <span className="text-red-400 font-bold">
            AgentShield: THREAT BLOCKED — {event.event?.threat_type}
            <span className="text-red-300 font-normal ml-1">
              ({Math.round((event.event?.threat_confidence || 0) * 100)}% confidence)
            </span>
          </span>
        );

      case 'AGENT_THINKING':
        return (
          <span className="text-gray-300">
            Thinking: <span className="text-gray-400 italic">"{event.text}"</span>
          </span>
        );

      case 'AGENT_DONE':
        return (
          <span className="text-green-300">
            Task complete: <span className="text-gray-300 italic">"{event.result?.slice(0, 150)}"</span>
          </span>
        );

      case 'SHIELD_TOGGLE':
        return (
          <span className={event.active ? 'text-green-400' : 'text-red-400'}>
            Shield toggled: <span className="font-bold">{event.active ? 'ON' : 'OFF'}</span>
          </span>
        );

      case 'RESET':
        return <span className="text-gray-400">System reset — all state cleared</span>;

      default:
        return <span className="text-gray-400">{JSON.stringify(event).slice(0, 100)}</span>;
    }
  };

  const isThreats = type === 'THREAT_DETECTED';

  return (
    <div
      className={`flex gap-3 py-1.5 px-3 rounded transition-colors ${
        isThreats ? 'bg-red-900/20 border-l-2 border-red-500' : 'hover:bg-white/[0.02]'
      }`}
    >
      <span className="text-gray-500 font-mono text-xs whitespace-nowrap pt-0.5 select-none min-w-[70px]">
        [{time}]
      </span>
      <span className="select-none text-sm">{icon}</span>
      <div className="terminal-text flex-1 min-w-0 break-words">{renderContent()}</div>
    </div>
  );
}

export default function AgentActivityFeed({ events }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="glass-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Agent Activity Feed
          </h2>
        </div>
        <span className="text-gray-500 text-xs font-mono">{events.length} events</span>
      </div>

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="text-center">
              <div className="text-4xl mb-3">🛡️</div>
              <p className="text-sm">Waiting for demo to start...</p>
              <p className="text-xs text-gray-700 mt-1">Click "Run Demo" to begin</p>
            </div>
          </div>
        ) : (
          events.map((event) => <FeedEntry key={event._id} event={event} />)
        )}
      </div>
    </div>
  );
}
