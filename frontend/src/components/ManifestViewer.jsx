/**
 * ManifestViewer — Visual representation of the YAML permission manifest.
 *
 * Shows allowed/denied tools, domain lists, and restrictions in a
 * human-readable card format.
 */

import React, { useState, useEffect } from 'react';

export default function ManifestViewer() {
  const [manifest, setManifest] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/manifest')
      .then((res) => res.json())
      .then(setManifest)
      .catch((err) => console.error('Failed to load manifest:', err));
  }, []);

  if (!manifest) return null;

  const tools = manifest.allowed_tools || {};
  const denied = manifest.denied_actions || [];

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-shield-400">📜</span>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Permission Manifest
          </h2>
        </div>
        <span className="text-gray-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 animate-slide-in-up">
          {/* Agent info */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/5">
            <span className="text-lg">🤖</span>
            <div>
              <div className="text-sm font-semibold text-white">{manifest.agent_name}</div>
              <div className="text-xs text-gray-500">{manifest.description}</div>
            </div>
            <span className="ml-auto text-xs text-gray-600 font-mono">v{manifest.version}</span>
          </div>

          {/* Tools */}
          <div className="space-y-2">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Tool Permissions
            </h3>
            {Object.entries(tools).map(([toolName, config]) => (
              <div key={toolName} className="bg-surface-800/30 rounded-lg p-3 border border-white/[0.03]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-gray-300">{toolName}</span>
                  {config.allowed === false ? (
                    <span className="badge-critical">DENIED</span>
                  ) : (
                    <span className="badge-safe">ALLOWED</span>
                  )}
                </div>
                {config.allowed_domains && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {config.allowed_domains.map((d) => (
                      <span key={d} className="px-1.5 py-0.5 bg-surface-600/50 rounded text-[10px] text-gray-400 font-mono">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
                {config.allowed_recipients && (
                  <div className="mt-1 text-[10px] text-gray-500">
                    Recipients: {config.allowed_recipients.join(', ')}
                  </div>
                )}
                {config.max_per_session && (
                  <div className="mt-1 text-[10px] text-gray-500">
                    Rate limit: {config.max_per_session}/session
                  </div>
                )}
                {config.note && (
                  <div className="mt-1 text-[10px] text-gray-600 italic">
                    {config.note}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Denied actions */}
          {denied.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Denied Actions
              </h3>
              <div className="space-y-1">
                {denied.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-red-400/70">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    {action}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
