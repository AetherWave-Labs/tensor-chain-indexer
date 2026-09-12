# Test fixtures

## `events/`

Deterministic payloads for the normalized event schema and the parsers that
produce it. Every value is a literal: no generated ids, no `Date.now()`, no
randomness. A fixture that changes between runs cannot be used to prove a
parser is deterministic, which is most of what these exist for.

| Fixture                                | Validates? | Covers                                                    |
| -------------------------------------- | ---------- | --------------------------------------------------------- |
| `valid-transfer.json`                  | yes        | A single well-formed transfer                             |
| `multiple-events-one-transaction.json` | yes        | Two events in one transaction, distinguished by log index |
| `stellar-payment.json`                 | yes        | A well-formed event from a non-EVM chain                  |
| `unknown-event-type.json`              | yes        | Structurally valid, event type nothing maps yet           |
| `malformed-payload.json`               | no         | Every field present but of the wrong type                 |
| `missing-fields.json`                  | no         | Required fields absent entirely                           |
| `seconds-timestamp.json`               | no         | Seconds where milliseconds are required                   |

`unknown-event-type.json` is expected to **validate**: an unrecognised event
type is a mapping gap, not a malformed event, and the schema's job is shape
rather than vocabulary.

Load them through `events/index.ts` rather than reading the files directly, so
there is one place to update when the normalized shape changes:

```ts
import { loadEventFixture } from '../fixtures/events/index.js';

const event = loadEventFixture('validTransfer');
```

The `id` on each fixture is the real `eventId()` of its own coordinates, and a
test asserts that. If you edit a fixture's chain, block, transaction hash or
log index, recompute the id or that test will tell you.
