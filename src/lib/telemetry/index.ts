/**
 * src/lib/telemetry/index.ts
 * Session telemetry helpers.
 * Events are stored in the Zustand appStore and can be flushed to an endpoint.
 */

import type { TelemetryEvent } from '../../types';

/** Build a typed telemetry event. */
export function mkEvent(
  type: TelemetryEvent['type'],
  payload: Record<string, unknown>,
  storyId?: string,
): TelemetryEvent {
  return { type, payload, timestamp: Date.now(), storyId };
}

/** Serialise the event log to a JSON blob for upload. */
export function serialiseTelemetry(events: TelemetryEvent[]): string {
  return JSON.stringify({ session: Date.now(), events }, null, 2);
}
