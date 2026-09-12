import { describe, expect, it } from 'vitest';
import {
  EVENT_FIXTURES,
  INVALID_FIXTURES,
  VALID_FIXTURES,
  loadEventFixture,
  type EventFixtureName,
} from '../../fixtures/events/index.js';
import { validateNormalizedEvent } from '../../../src/normalization/schema.js';
import { eventId } from '../../../src/normalization/event-identity.js';
import type { NormalizedEvent } from '../../../src/normalization/types.js';

describe('event fixtures', () => {
  it('loads every catalogued fixture', () => {
    for (const name of Object.keys(EVENT_FIXTURES) as EventFixtureName[]) {
      expect(loadEventFixture(name)).toBeDefined();
    }
  });

  // A fixture that changes between runs cannot prove a parser is
  // deterministic, which is most of what these exist for.
  it('returns identical content on repeated loads', () => {
    expect(loadEventFixture('validTransfer')).toEqual(loadEventFixture('validTransfer'));
  });

  // Read fresh each call, so a test that mutates what it receives cannot leak
  // that mutation into the next one.
  it('does not share mutable state between loads', () => {
    const first = loadEventFixture<NormalizedEvent>('validTransfer');
    (first as { eventType: string }).eventType = 'mutated';

    expect(loadEventFixture<NormalizedEvent>('validTransfer').eventType).toBe('transfer');
  });
});

describe('fixtures expected to validate', () => {
  it.each(VALID_FIXTURES)('%s passes validation', (name) => {
    const result = validateNormalizedEvent(loadEventFixture(name));

    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('accepts every event in the multi-event transaction', () => {
    const events = loadEventFixture<NormalizedEvent[]>('multipleEventsOneTransaction');

    expect(events).toHaveLength(2);
    for (const event of events) {
      expect(validateNormalizedEvent(event).valid).toBe(true);
    }
  });

  // An unrecognised event type is a mapping gap, not a malformed event; the
  // schema's job is shape rather than vocabulary.
  it('accepts a structurally valid event whose type nothing maps yet', () => {
    const event = loadEventFixture<NormalizedEvent>('unknownEventType');

    expect(event.eventType).toBe('liquidity_rebalanced_v3');
    expect(validateNormalizedEvent(event).valid).toBe(true);
  });
});

describe('fixtures expected to be rejected', () => {
  it.each(INVALID_FIXTURES)('%s fails validation', (name) => {
    expect(validateNormalizedEvent(loadEventFixture(name)).valid).toBe(false);
  });

  it('names every bad field in the malformed payload', () => {
    const fields = validateNormalizedEvent(loadEventFixture('malformedPayload')).issues.map(
      (issue) => issue.field,
    );

    expect(fields).toEqual(
      expect.arrayContaining([
        'id',
        'chain',
        'blockNumber',
        'transactionHash',
        'logIndex',
        'eventType',
        'data',
      ]),
    );
  });

  it('names the absent fields in the incomplete payload', () => {
    const fields = validateNormalizedEvent(loadEventFixture('missingFields')).issues.map(
      (issue) => issue.field,
    );

    expect(fields).toEqual(
      expect.arrayContaining(['id', 'blockNumber', 'logIndex', 'timestamp', 'data']),
    );
  });

  it('catches the seconds-based timestamp and says so', () => {
    const issues = validateNormalizedEvent(loadEventFixture('secondsTimestamp')).issues;

    expect(issues).toHaveLength(1);
    expect(issues[0].field).toBe('timestamp');
    expect(issues[0].message).toMatch(/seconds/);
  });
});

describe('fixture identities', () => {
  // Ties the fixtures to the identity function: if someone edits a fixture's
  // coordinates without recomputing its id, this fails rather than letting a
  // quietly inconsistent fixture sit in the suite.
  const withRealIds: EventFixtureName[] = ['validTransfer', 'stellarPayment', 'unknownEventType'];

  it.each(withRealIds)('%s carries the id its own coordinates produce', (name) => {
    const event = loadEventFixture<NormalizedEvent>(name);

    expect(event.id).toBe(
      eventId({
        chain: event.chain,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
      }),
    );
  });

  // Two logs of one transaction are separate events; sharing an id would make
  // duplicate protection drop one of them.
  it('gives the two events of one transaction distinct ids', () => {
    const [first, second] = loadEventFixture<NormalizedEvent[]>('multipleEventsOneTransaction');

    expect(first.transactionHash).toBe(second.transactionHash);
    expect(first.logIndex).not.toBe(second.logIndex);
    expect(first.id).not.toBe(second.id);
  });

  it('gives every valid fixture a distinct id', () => {
    const ids = withRealIds.map((name) => loadEventFixture<NormalizedEvent>(name).id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
