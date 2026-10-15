# Delivery Checklist

- [x] **Build an evidence-first underwriting control workspace.**
  - Saved reports appear in a persistent rail with active state, a new-report action, and report details that never imply a manually entered value was extracted.
  - The UI shows `Saving review state…`, `Saved in this browser`, or a browser-storage failure state. Changes restore after a browser reload.
  - Rename and delete actions are available with intentional confirmation behavior.

- [x] **Make manual review and field provenance first-class.**
  - Property/underwriting fields show source, confidence, review status, and editable values.
  - A field override produces one `Typed in` marker and a concise audit entry; continued typing does not create duplicate audit events.
  - A Scenario 4 row override is marked `Typed in` and receives its own audit event.
  - Cypress Cove, Springfield Crossing, and Bluffs at Evergreen are the only immutable fixtures shown in the regression lane, even if a saved report is deleted.

- [x] **Expose Scenario 4 as a reviewable underwriting decision.**
  - The UI explains and calculates `MAX(net LIHTC, Scenario 1)` whenever gross maximum LIHTC exists; otherwise it retains current rent.
  - The same gross-max-LIHTC predicate is used in the generated workbook.
  - Every Scenario 4 UI result carries an explicit reconciliation gate before investment use.

- [x] **Produce an auditable GPC Model Template v5.**
  - Scenario 4 appears directly after Scenario 3 with its own Unit Mix block, own annual output column, and workbook references.
  - Formula validation confirms there are no stale Scenario 3 self-references in Scenario 4, including the principal/balance schedules.
  - All worksheets use normal view and no stored row/column page breaks, eliminating the `Page 1` Page Break Preview overlay.
  - The v5 workbook opens successfully in LibreOffice and is served as a downloadable asset.

- [x] **Validate and hand off.**
  - `pnpm check` and `pnpm build` pass; the route manifest and v5 asset return HTTP 200 from Preview.
  - Desktop and mobile layouts were visually checked. Field and Scenario 4 override behavior, autosave persistence after reload, and the regression-readiness view were exercised in Preview.
  - The delivered interface is explicitly described as a browser-persistence companion control layer—not a production replacement for the live portal’s authenticated extraction system.
