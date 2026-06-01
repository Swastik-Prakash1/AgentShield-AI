/**
 * useAgentSocket — WebSocket hook for real-time AgentShield dashboard updates.
 *
 * Connects to the backend WebSocket endpoint and manages all event state:
 * threats, safe calls, agent activity, connection status.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = `ws://${window.location.hostname}:8000/ws/events`;

export function useAgentSocket() {
  const [events, setEvents] = useState([]);
  const [threats, setThreats] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    callsInspected: 0,
    threatsCaught: 0,
    safeCalls: 0,
  });
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const addEvent = useCallback((event) => {
    const timestamped = {
      ...event,
      _localTime: new Date().toISOString(),
      _id: Math.random().toString(36).slice(2, 10),
    };

    setEvents((prev) => [...prev, timestamped]);

    // Update stats based on event type
    if (event.type === 'SAFE_CALL') {
      setStats((prev) => ({
        ...prev,
        callsInspected: prev.callsInspected + 1,
        safeCalls: prev.safeCalls + 1,
      }));
    } else if (event.type === 'THREAT_DETECTED') {
      setThreats((prev) => [...prev, timestamped]);
      setStats((prev) => ({
        ...prev,
        callsInspected: prev.callsInspected + 1,
        threatsCaught: prev.threatsCaught + 1,
      }));
    } else if (event.type === 'RESET') {
      setEvents([]);
      setThreats([]);
      setStats({ callsInspected: 0, threatsCaught: 0, safeCalls: 0 });
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[AgentShield WS] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== 'HEARTBEAT') {
            addEvent(data);
          }
        } catch (err) {
          console.error('[AgentShield WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[AgentShield WS] Disconnected — reconnecting in 3s');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[AgentShield WS] Error:', err);
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[AgentShield WS] Connection failed:', err);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [addEvent]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const resetEvents = useCallback(() => {
    setEvents([]);
    setThreats([]);
    setStats({ callsInspected: 0, threatsCaught: 0, safeCalls: 0 });
  }, []);

  return {
    events,
    threats,
    stats,
    isConnected,
    resetEvents,
  };
}
