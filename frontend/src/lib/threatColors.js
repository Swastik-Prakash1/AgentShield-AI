/**
 * Threat severity color and styling mappings.
 * Used across ThreatCard, AuditTrail, and dashboard stats.
 */

export const SEVERITY_COLORS = {
  critical: {
    bg: 'bg-red-600/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: '0 0 20px rgba(220, 38, 38, 0.3)',
    hex: '#DC2626',
    badge: 'badge-critical',
  },
  high: {
    bg: 'bg-orange-600/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    glow: '0 0 20px rgba(234, 88, 12, 0.3)',
    hex: '#EA580C',
    badge: 'badge-high',
  },
  medium: {
    bg: 'bg-amber-600/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: '0 0 20px rgba(217, 119, 6, 0.3)',
    hex: '#D97706',
    badge: 'badge-medium',
  },
  low: {
    bg: 'bg-lime-600/20',
    border: 'border-lime-500/30',
    text: 'text-lime-400',
    glow: '0 0 20px rgba(101, 163, 13, 0.3)',
    hex: '#65A30D',
    badge: 'badge-low',
  },
};

export const EVENT_TYPE_ICONS = {
  AGENT_START: '🚀',
  AGENT_THINKING: '🤖',
  AGENT_DONE: '✅',
  TOOL_CALL: '🔧',
  SAFE_CALL: '✅',
  THREAT_DETECTED: '🚨',
  DEMO_START: '▶️',
  RESET: '🔄',
  SHIELD_TOGGLE: '🛡️',
  HEARTBEAT: '💓',
};

export const THREAT_TYPE_LABELS = {
  'PROMPT_INJECTION::EXFILTRATION': { short: 'EXFILTRATION', color: 'text-red-400' },
  'PROMPT_INJECTION::INSTRUCTION_OVERRIDE': { short: 'INSTRUCTION OVERRIDE', color: 'text-orange-400' },
  'PROMPT_INJECTION::ROLE_ESCALATION': { short: 'ROLE ESCALATION', color: 'text-orange-400' },
  'PROMPT_INJECTION::SOCIAL_ENGINEERING': { short: 'SOCIAL ENGINEERING', color: 'text-amber-400' },
  'PERMISSION_VIOLATION': { short: 'PERMISSION VIOLATION', color: 'text-yellow-400' },
  'IDENTITY_SPOOFING': { short: 'IDENTITY SPOOFING', color: 'text-purple-400' },
  'SAFE': { short: 'SAFE', color: 'text-green-400' },
};

export function getSeverityColor(severity) {
  return SEVERITY_COLORS[severity?.toLowerCase()] || SEVERITY_COLORS.medium;
}

export function getThreatTypeLabel(threatType) {
  return THREAT_TYPE_LABELS[threatType] || { short: threatType, color: 'text-gray-400' };
}

export function formatTimestamp(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatConfidence(confidence) {
  if (confidence == null) return '';
  return `${Math.round(confidence * 100)}%`;
}
