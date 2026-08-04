# Forja App and Landing Improvement Plan

## Executive outcome

Forja should move from a pilot-capable product to a safer, recoverable production operation while replacing its public landing with a shorter, more persuasive demonstration of the product's actual coaching loop.

This work has **two independent delivery lanes**:

- **Lane A: Production and product hardening** proves persistence, reduces security and operational risk, and strengthens coach workflows.
- **Lane B: Public landing replacement** presents the real coaching loop through editorial photography, product evidence, and a semantic five-stage narrative.

> **Release boundary:** the two lanes must not ship as one mixed release. Database, dependency, mutation, and operational-control changes carry a different risk profile from a motion-heavy public redesign. Each lane requires its own change set, verification evidence, release decision, and rollback path.

## Current verified baseline

| Area | Verified state | Implication |
|---|---|---|
| Production landing | Reachable in production | The replacement must preserve availability, truthful content, and the access path. |
| Landing behavior | Corrective redesign implemented locally with a static semantic narrative | The landing now prioritizes image fidelity, product evidence, and native reading order over decorative motion. |
| Mobile composition | Natural single-column flow with full-width 16:9 imagery | Page height is no longer an optimization target when it would damage hierarchy or image quality. |
| Visual evidence | Original 1672 × 941 PNG masters are served through `next/image` | Rendered frames and responsive requests must preserve the source ratio and avoid visible upscaling. |
| Build and tests | Production build passes; 28 tests pass | Existing behavior has a useful regression baseline. |
| TypeScript | Standalone TypeScript has one pre-existing test typing failure | Resolve or explicitly isolate this failure before making type-checking a hard release gate. |
| Dependencies | Audit reports 5 high and 1 moderate advisories | Security remediation is an immediate production priority, especially the authenticated `xlsx`/upload path. |
| Database | Migration `0006` remains unverified in production | Access-request persistence must not be treated as proven until schema and write evidence are captured. |
| Product maturity | Pilot-capable; athlete execution is strong | Preserve the athlete path and its historical execution evidence. |
| Coach experience | Authoring, mutation failure recovery, and decision-queue prioritization are weaker | Product hardening should focus on safe coach decisions rather than broad feature expansion. |

## Roadmap at a glance

Effort bands are relative engineering estimates: **S** is a focused change, **M** spans several connected surfaces, and **L** is a cross-cutting or high-risk work unit requiring broader verification.

| Order | Phase | Lane | Effort | Depends on | Release gate |
|---:|---|---|:---:|---|---|
| 1 | A1. Prove production persistence | A | S | Production access and backup confirmation | Migration and write evidence captured |
| 2 | A2. Remediate dependency and upload risk | A | L | A1 evidence available | Advisories removed or explicitly accepted with controls |
| 3 | A3. Establish release and recovery controls | A | L | A1; remediation plan from A2 | CI, observability, rollback, and restore evidence |
| 4 | A4. Make coach mutations failure-safe | A | L | A3 release controls | No destructive partial state; recovery is actionable |
| 5 | A5. Prioritize the coach decision queue deterministically | A | M | Stable mutation/data contracts from A4 | Same inputs always produce the same actionable order |
| 6 | A6. Reduce program-authoring friction safely | A | L | Published-version protections from A4 | Faster draft work without mutating published history |
| 7 | Corrective visual composition | B | M | Original image masters and product truth | Implemented locally; final verification pending |
| 8 | Product evidence and five-stage narrative | B | M | Corrective composition | Implemented locally; final verification pending |
| 9 | Accessibility, responsive, and performance hardening | B | M | Corrective implementation | Automated and bounded visual verification pending |

Lane B discovery and storyboard work may proceed while Lane A is being implemented, but Lane B must remain a separate branch/change set and release. The recommended production order is to release and observe Lane A before releasing Lane B.

---

## Lane A: Production and product hardening

### A1. Prove production persistence

**Outcome:** migration `0006` is verified and, if absent, applied through the controlled production migration path; access requests are proven to persist.

**Dependencies:** confirmed production target, current schema inventory, recent backup or recovery point, and an authorized maintenance window.

**Effort:** S

**Work**

- Inspect the production migration ledger and schema; do not infer state from repository files alone.
- Verify the exact scope and idempotency of `0006` before applying it.
- Capture a recovery point, apply the migration only if it is absent, and record the migration result.
- Submit a controlled access request through the production form and verify the expected row in the production database.
- Verify duplicate-email behavior and confirm that failed writes return a truthful, non-destructive error.
- Remove or redact test data after proof when policy requires it, without deleting legitimate requests.

**Acceptance criteria**

- [ ] Production has the schema expected by `0006`, with migration status recorded.
- [ ] A uniquely identifiable test request reaches persistent storage exactly once.
- [ ] Duplicate submission behavior matches the intended data contract.
- [ ] The access form still exposes success and failure states correctly.
- [ ] Backup/recovery evidence predates any schema mutation.

**Verification**

- Compare migration ledger and schema before and after the operation.
- Record the test request identifier, write timestamp, and database query result in the release evidence.
- Run the access-request tests plus a bounded production smoke test.

**Main risks**

- Applying an already-applied or drifted migration.
- Treating a UI success response as persistence proof.
- Polluting production with untracked test records.

### A2. Remediate dependency and upload risk

**Outcome:** known production vulnerabilities are removed or reduced through documented, testable controls, with priority on the `xlsx` import/export surface and untrusted uploads.

**Dependencies:** A1 complete; inventory of runtime dependency paths and current import/export behavior.

**Effort:** L

**Work**

- Trace each of the 5 high and 1 moderate advisories to runtime reachability and affected features.
- Replace, upgrade, patch, or isolate vulnerable dependencies; do not accept audit noise without reachability analysis.
- For spreadsheet uploads, enforce authentication and authorization, file-size limits, accepted type/signature checks, bounded row/cell counts, parsing time limits, and safe error handling.
- Treat workbook content as untrusted. Prevent formula injection in exported values and avoid rendering imported markup or formulas as trusted content.
- Keep uploaded files out of public paths and avoid retaining source files unless the product requires it.
- Add adversarial fixtures for malformed, oversized, mislabeled, and formula-bearing workbooks.

**Acceptance criteria**

- [ ] The production dependency audit has no unresolved high-severity advisory on a reachable path.
- [ ] Any residual advisory has a named owner, reachability evidence, compensating control, and review date.
- [ ] Upload validation rejects unsupported, malformed, oversized, and excessive-content files before unsafe processing.
- [ ] Import/export regression tests preserve legitimate workflows.
- [ ] Logs reveal rejected uploads without storing sensitive workbook content.

**Verification**

- Run the package audit and archive the machine-readable result.
- Execute import/export tests against valid and adversarial fixtures.
- Review server-side authorization and limits at the upload boundary, not only in the browser.

**Main risks**

- A dependency upgrade changing workbook interpretation or exports.
- Resource exhaustion occurring before application-level validation.
- Security controls blocking legitimate coach spreadsheets without useful recovery guidance.

### A3. Establish release and recovery controls

**Outcome:** releases become repeatable, observable, and reversible rather than dependent on manual confidence.

**Dependencies:** A1 complete; A2 remediation path known; deployment platform and database recovery capabilities documented.

**Effort:** L

**Work**

- Add CI gates for install integrity, linting, production build, the 28-test baseline, and TypeScript.
- Fix the pre-existing test typing failure or isolate it with a time-bounded owner before TypeScript becomes a blocking gate; do not normalize a permanently ignored failure.
- Require migration review, environment validation, deployed commit/SHA proof, smoke tests, and an explicit release approval record.
- Add security headers appropriate to the deployed application, including a tested Content Security Policy strategy, anti-sniffing, framing protection, referrer policy, and permissions policy.
- Add structured error reporting and operational signals for authentication, access-request persistence, imports, coach mutations, athlete sync conflicts, and release health.
- Define service health checks that test critical dependencies without exposing sensitive data.
- Document and exercise application rollback plus database backup/restore. Prove the procedure with a controlled drill, not only a written checklist.

**Acceptance criteria**

- [ ] CI blocks release when required checks fail.
- [ ] A release can be traced from source SHA to deployed artifact and migration set.
- [ ] Security headers are present and tested without breaking authentication, forms, or required assets.
- [ ] Critical failures produce actionable, privacy-safe telemetry and an owner can locate them.
- [ ] A rollback drill and a backup/restore drill have timestamped evidence and measured recovery results.
- [ ] Runbooks name decision owners, stop conditions, and escalation paths.

**Verification**

- Exercise one successful and one intentionally failed CI run.
- Inspect deployed headers and health endpoints.
- Trigger safe synthetic failures for persistence, upload, and mutation paths and confirm observability.
- Restore a backup into an isolated environment and validate representative records.

**Main risks**

- CI appearing green while omitting production-only configuration or migrations.
- An untested CSP breaking required application behavior.
- Assuming application rollback can reverse an incompatible database migration.

### A4. Make coach mutations failure-safe

**Outcome:** coach actions preserve data, avoid partial updates, and provide a clear recovery path when a write fails or conflicts.

**Dependencies:** A3 controls and telemetry; current mutation inventory; historical snapshot and versioning contracts.

**Effort:** L

**Work**

- Inventory coach mutations by reversibility, historical impact, and multi-record scope.
- Make multi-record writes atomic where partial state would be invalid.
- Preserve immutable execution evidence and the currently published version while drafts are edited, duplicated, reordered, or abandoned.
- Use idempotency or conflict detection where retries could duplicate work or overwrite newer state.
- Keep user input available after recoverable failures; distinguish validation, conflict, connectivity, authorization, and server errors.
- Provide explicit retry, reload, or conflict-resolution actions rather than generic failure messages.
- Add destructive-action boundaries that explain historical impact and require deliberate confirmation.

**Acceptance criteria**

- [ ] Failed coach mutations leave either the previous valid state or the complete new state, never an invalid partial state.
- [ ] Retrying a mutation cannot silently duplicate or corrupt records.
- [ ] Published programs and historical athlete execution remain unchanged during draft edits and failed publication attempts.
- [ ] Recoverable failures preserve entered work and present a specific next action.
- [ ] Authorization and concurrency failures are covered by tests at the server boundary.

**Verification**

- Add mutation-level tests for success, validation failure, authorization failure, transaction rollback, retry, and concurrent edit conflict.
- Inject failures between multi-step operations and compare pre/post database state.
- Run coach workflow smoke tests with observability enabled.

**Main risks**

- Retrofitting transactions across operations with external side effects.
- Confusing optimistic UI state with committed server state.
- Accidentally allowing draft convenience features to rewrite published or historical evidence.

### A5. Prioritize the coach decision queue deterministically

**Outcome:** the coach sees the most actionable exceptions first, and ordering is explainable and stable.

**Dependencies:** A4 data and mutation contracts; agreed pilot rules for what constitutes a deviation.

**Effort:** M

**Work**

- Define a small, explicit priority model from existing evidence such as incomplete sessions, overdue dates, execution deviations, sync conflicts, pending access, and missing marks.
- Specify stable tie-breakers, for example severity, due/occurrence time, athlete identifier, and record identifier.
- Show why each item is present, the evidence supporting it, and the single next decision.
- Separate actionable exceptions from informational activity; do not rank by accidental database order or client render timing.
- Keep the first pilot rules configurable in code or data without inventing opaque machine scoring.

**Acceptance criteria**

- [ ] Identical inputs produce identical ordering across requests and environments.
- [ ] Every queue item exposes a reason, supporting evidence, age, and next action.
- [ ] Resolved or stale items leave the actionable queue predictably.
- [ ] Empty, tied, delayed, and conflicting-data states are defined.
- [ ] Product owners can explain the ordering without reconstructing implementation details.

**Verification**

- Add table-driven tests for every priority class, tie-breaker, empty state, and resolution transition.
- Seed representative pilot data and compare the resulting order with the written rules.
- Track queue age and action completion after release to validate usefulness without claiming unsupported outcomes.

**Main risks**

- Encoding unapproved coaching policy as product truth.
- Priority churn from unstable timestamps or missing tie-breakers.
- Overloading the queue with informational events that hide decisions.

### A6. Reduce program-authoring friction safely

**Outcome:** coaches can create and revise programs with fewer repetitive steps while published versions remain protected.

**Dependencies:** A4 version and failure-recovery guarantees; observed authoring friction from representative coach tasks.

**Effort:** L

**Work**

- Measure the current high-frequency authoring path before changing it: create draft, structure blocks/weeks/days, enter prescriptions, review, and publish.
- Reduce repeated entry through focused operations such as duplication, sensible carry-forward, batch editing, and clearer navigation only where task evidence supports them.
- Make draft, unsaved, saving, saved, validation, conflict, and published states unambiguous.
- Validate close to the edited context and provide a concise publication review before the explicit publish action.
- Keep the active published version available while a new draft is prepared; never turn background saving into implicit publication.

**Acceptance criteria**

- [ ] Representative authoring tasks require materially fewer repetitive interactions, measured against the baseline flow.
- [ ] Draft work survives recoverable errors and navigation according to a documented persistence rule.
- [ ] Publication remains explicit and identifies the version becoming active.
- [ ] Editing a draft cannot alter the published version or historical execution snapshots.
- [ ] Keyboard and mobile workflows remain usable for supported authoring tasks.

**Verification**

- Run task-based coach walkthroughs before and after implementation and record steps, time, and failure points.
- Add version-transition and publication regression tests.
- Test long programs, validation errors, concurrent edits, interrupted saves, and failed publication.

**Main risks**

- Optimizing an assumed workflow instead of observed coach behavior.
- Bulk operations amplifying mistakes.
- Autosave semantics obscuring whether work is local, saved as draft, or published.

---

## Lane B: Public landing replacement

### Stage UX 0 — Composition, spacing, and responsive separation

**Outcome:** the current approved landing establishes collision-free, readable geometry before any animation narrative, copy polish, or replacement build begins.

**Verified defect baseline**

- At 768 × 1024, absolute story-product overlays enter scene copy by 14.7–47.9 px in scenes 2–4.
- Product overlays obscure 39–86% of story imagery across desktop and tablet; the hero mechanism board obscures 45–65% of the primary hero image.
- The secondary mobile hero inset is approximately 97% covered and adds no meaningful visual evidence.
- The desktop grid remains active at 768 px because stacking begins only below 768 px, forcing the hero into a 448 × 947 portrait crop before the board covers it.
- Showing both paired images at tablet and mobile sizes creates a crowded sequence and pushes mobile page height beyond 10,000 px.
- Story, continuity, roles, and access read as one uninterrupted evidence plane; captions and product evidence lack reliable separation.

**Target viewports**

| Context | Viewport |
|---|---:|
| Desktop | 1440 × 1000 |
| Tablet landscape | 1024 × 768 |
| Tablet portrait | 768 × 1024 |
| Mobile | 390 × 844 |
| Narrow mobile | 360 × 800 |

**Acceptance criteria**

- [ ] Copy, story imagery, product evidence, captions, and scene evidence do not intersect at any target viewport.
- [ ] Hero imagery and the mechanism board occupy separate layout regions; neither hero image is reduced to a covered decorative inset.
- [ ] A content-driven tablet breakpoint between 1100 and 1200 px removes the cramped desktop story and hero composition.
- [ ] Below the full desktop breakpoint, each narrative beat shows one deterministic athlete frame rather than stacking both paired images.
- [ ] All eight approved assets remain meaningfully present across the responsive system, with all pairs available at full desktop and intentional single-frame sequencing below it.
- [ ] Product UI remains the dominant evidence, REG-042 remains continuous, and synthetic-data disclosure stays visible.
- [ ] Story, continuity, roles, and access have perceptible resets and breathing room without materially increasing mobile page height.
- [ ] Semantic SSR/no-JS order, reduced motion, the access form, truthful disclosure, and horizontal containment are preserved.
- [ ] Focused landing E2E checks pass at all five viewports, alongside the production build and access-request tests.

> **Stage gate:** animation narrative changes, animation implementation, and copy polish are explicitly deferred until every UX 0 acceptance criterion passes. UX 0 changes composition and responsive geometry only.

### Stage UX 1 — Grid, optical balance, and narrative choreography

**Outcome:** turn the collision-free landing into an intentionally authored composition across desktop, tablet, and mobile while preserving every Stage UX 0 geometry guarantee.

**Status and priority:** **Passed locally on 2026-08-03.** Stage UX 1 now uses one shared 12-column alignment system, an authored tablet composition, and distinct execution-, comparison-, and decision-led story treatments while retaining the Stage UX 0 collision and overflow guarantees. Animation implementation and copy polish remain deferred to their later stages.

**Verified audit findings**

- The major grids do not share a coherent alignment model: the hero uses approximately 51/49, story 35/65, continuity and access 37.5/62.5, and roles 50/50, with inconsistent gutters between systems.
- The 1180/1179 breakpoint pair is the top P1 issue. A one-pixel change at 1179 px adds **3,076 px (44.4%)** to total page height; the hero grows by **995 px** and the story by **1,502 px**.
- At 1024 px, every major system collapses simultaneously into the weakest visual state, producing an approximately **9,160 px** page with insufficient hierarchy and excessive uniform stacking.
- Stages 2–4 repeat the same template and equal 50/50 image pairs. The repetition reads as modular and pasted rather than as a narrative progression through execution, comparison, and coach decision-making.
- Post-story sections lack differentiated cadence, so continuity, roles, and access converge into one extended evidence plane despite their different narrative jobs.

**Composition direction**

- Establish one shared 12-column alignment and gutter system for the hero, story, continuity, roles, and access sections.
- Design a real tablet composition for 768–1179 px rather than collapsing all desktop systems at one breakpoint.
- Use hierarchical 65/35 imagery only where the narrative benefits from a lead frame and supporting evidence; do not apply asymmetry as a decorative default.
- Give stages 2–4 distinct compositions: execution-led for stage 2, comparison-led for stage 3, and coach-decision-led for stage 4.
- Attach captions to their images within 12–16 px and place related product evidence within 24–32 px so proximity communicates ownership.
- At 360 px, render evidence in a deterministic two-row arrangement rather than allowing incidental wrapping.
- Differentiate post-story section cadence through deliberate changes in density, interval, and grouping while maintaining one coherent page rhythm.

**Intentional asymmetries to preserve**

- Hero copy leads while product evidence supports it.
- The scene index rail remains aligned while imagery may escape the text column.
- The red CTA remains the decisive optical accent.
- Stages 1 and 5 remain image-free so the narrative opens and closes on product state rather than forcing visual symmetry.

**Stage UX 0 guarantees to preserve**

- Product evidence remains in normal flow; no absolute overlays are reintroduced.
- Copy, imagery, captions, and evidence do not intersect, and the page does not create horizontal overflow.
- Native scrolling remains intact with no scroll-jacking.

**Acceptance criteria**

- [ ] Hero, story, continuity, roles, and access align to a documented 12-column grid and shared gutter system at desktop widths.
- [ ] The 1180/1179 transition does not trigger a discontinuous page-height jump or simultaneous collapse of all major composition systems.
- [ ] The 768–1179 range uses an authored tablet composition with clear hierarchy, controlled page length, and no uniform desktop-to-single-column fallback.
- [ ] Stages 2–4 are visually and narratively distinct as execution-led, comparison-led, and coach-decision-led compositions.
- [ ] Hierarchical 65/35 image treatment appears only where one frame genuinely leads; equal image pairs remain only where equivalence is meaningful.
- [ ] Captions remain 12–16 px from their images, related evidence remains 24–32 px from its owning content, and section-level spacing creates perceptible post-story cadence.
- [ ] At 360 px, evidence uses a deterministic two-row layout with stable reading order and no incidental wrapping.
- [ ] Hero copy/evidence asymmetry, the scene index rail/escaped imagery relationship, the red CTA, and image-free stages 1 and 5 remain intact.
- [ ] Normal-flow evidence, zero intersections, horizontal containment, semantic order, reduced-motion support, and native scrolling remain unchanged from UX 0.
- [ ] Animation implementation and copy polish remain out of scope until all Stage UX 1 criteria pass.

**Verification**

- Inspect and capture the complete page at widths **1440**, **1280**, the exact **1180/1179 breakpoint pair**, **1024**, **768**, **390**, and **360**.
- At each viewport, record total page height, hero height, story height, grid columns, gutter values, image hierarchy, caption/evidence proximity, section cadence, intersections, and horizontal overflow.
- Compare 1180 px and 1179 px measurements directly; treat any abrupt structural or page-height discontinuity as a failed P1 gate.
- Verify the complete page with reduced motion enabled and confirm information order, geometry, and access remain equivalent without animation.

**Local implementation evidence (2026-08-03):** focused landing E2E passed at 1440, 1024, 768, 390, and 360 px and directly locked the 1180/1179 pair. Total page heights measured **6,907 px at 1180**, **6,823 px at 1179** (84 px / 1.2% difference), and **6,383 px at 1024**, materially below the 8,200 px target. Automated geometry checks found no copy/image/board/caption/evidence intersections or horizontal overflow, confirmed 14 px caption proximity and 24–32 px evidence proximity, and verified deterministic two-row evidence at 360 px. Build, full landing E2E, access tests, standalone TypeScript, reduced motion, visual QA, and final diff outcomes are recorded in the work-unit handoff rather than promoted here as deployment evidence.

> **Stage gate:** Stage UX 1 follows the current production release and precedes animation work. Do not begin animation implementation or copy polish until this grid, tablet, optical-balance, and narrative-composition contract passes at every verification viewport.

### Selected direction

**Corrective update (2026-08-04):** the previous motion-first, no-photography direction was rejected. The active direction uses the original approved 16:9 athlete images as primary editorial evidence, keeps product UI comparisons explicit, and favors excellent static composition over non-essential animation.

Replace the static hero and five text-heavy scenes with a user-selected interactive scroll story. The story must transform **one persistent record** through this exact choreography:

1. **Program**
2. **Execute**
3. **Detect deviation**
4. **Review**
5. **Adjust**

The record is the protagonist. Its identity and relevant context persist while status, prescribed values, executed values, deviation evidence, review state, and next-version decision change. The interaction should demonstrate Forja's continuity rather than decorate five disconnected feature claims.

### Visual and persuasive language

- Use realistic product UI as the primary evidence, clearly labeling synthetic demonstration data where a visitor could mistake it for real customer data.
- Build composition and motion from bar and platform geometry, plates, force lines, competition signals, regulatory numbers, result states, and version markers.
- Make the experience athletic and purchase-worthy through precision, tension, cadence, and consequence.
- Use the original 1672 × 941 athlete photography in reviewed 16:9 frames without portrait coercion, tiny strips, or visible upscaling.
- Avoid generic bodybuilding red/black clichés, glow-heavy gym aesthetics, fake testimonials, invented customers, and unsupported performance or commercial metrics.
- Preserve the established competition-room product truth: evidence, numbers, state, and decisions outrank generic marketing illustration.

### Content target

Reduce landing content by approximately **25–35%** while preserving the complete product proposition, truthful limitations, primary conversion path, and semantic fallback. Measure both visible word count and rendered page length on the agreed mobile viewport; the current page is approximately 8,230 px tall on mobile. Height is a supporting signal, not a reason to hide required content or reduce readability.

### Current landing disposition

| Current section | Decision | Replacement treatment |
|---|---|---|
| Header and navigation | **Preserve** | Keep brand, coach entry, athlete path, theme control, and direct access to the story/form; simplify labels only if comprehension is preserved. |
| Static hero copy and mechanism board | **Replace** | Open with the persistent record already in motion, a concise product thesis, and a visible access action. The first viewport must explain what Forja is and why continuity matters. |
| Five-item cycle ribbon | **Compress** | Convert into lightweight stage orientation/progress within the story; do not duplicate the full narrative. |
| Five text scenes | **Replace** | Use the exact Program → Execute → Detect deviation → Review → Adjust transformation of one record, with semantic text available without JavaScript. |
| Continuity comparison table | **Compress** | Integrate the strongest contrast into the record transformation or one concise proof block instead of restating all five stages. |
| Coach and athlete role sections | **Compress** | Keep only role-specific facts needed to understand who acts at each stage; attach them to the shared record. |
| Partial-offline disclosure | **Preserve** | Retain a concise, truthful statement that offline support is partial and conflicts may require synchronization. |
| Access-request section and form | **Preserve** | Keep all fields, validation, privacy note, success/error behavior, and a clear final conversion point. The story may link to it but must not replace it. |
| Footer and operational links | **Preserve** | Retain activation and coach access with reduced supporting copy where possible. |

### B1. Freeze reduced architecture and storyboard

**Outcome:** content and interaction decisions are fixed before implementation begins.

**Dependencies:** approved direction above; current copy inventory; confirmed access-form contract.

**Effort:** S

**Work**

- Produce a reduced content outline and word-count budget showing the 25–35% reduction.
- Storyboard the persistent record at all five stages, including exact data fields that persist, change, or become newly visible.
- Define first-viewport thesis, stage transitions, final access handoff, mobile composition, and no-JS/reduced-motion alternatives.
- Mark synthetic demonstration data and reject any unsupported claim before coding.

**Acceptance criteria**

- [ ] Every current section has an approved replace/compress/preserve disposition.
- [ ] The five stages use one record with no unexplained reset between scenes.
- [ ] The storyboard includes desktop, mobile, reduced-motion, and no-JS reading orders.
- [ ] The access form remains intact and reachable from the first viewport and final close.
- [ ] The copy budget demonstrates a 25–35% reduction without removing material limitations.

**Verification**

- Review the storyboard against product truth and the current server-rendered page.
- Conduct a content diff for preserved facts, removed repetition, and unsupported claims.

**Main risks**

- Starting animation code before the persistent-record model is coherent.
- Cutting important truth while removing repetition.
- Designing desktop choreography that collapses into a weak mobile stack.

### B2. Build the semantic landing foundation

**Outcome:** the replacement works as a complete, persuasive document before enhancement with scroll-driven motion.

**Dependencies:** B1 approved.

**Effort:** M

**Work**

- Render the thesis, all five stages, truthful disclosures, and access form through SSR-accessible HTML.
- Preserve a logical heading structure, landmarks, links, form labels, status messaging, and source order.
- Make all essential record states visible without JavaScript; enhancement may transform presentation but cannot own the content.
- Preserve metadata and structured data unless a separately verified content decision requires a truthful update.

**Acceptance criteria**

- [ ] With JavaScript disabled, visitors can understand the full five-stage cycle and submit or reach the access form as platform behavior allows.
- [ ] Stage order and record changes are understandable without relying on color, position, or motion alone.
- [ ] Existing access-form validation, privacy, success, and error behavior remain intact.
- [ ] The reduced page meets the approved content budget.

**Verification**

- Inspect server output and test with JavaScript disabled.
- Run semantic, keyboard, and screen-reader smoke checks before adding motion.
- Re-run existing build and tests.

**Main risks**

- Client-only rendering hiding the product story from no-JS users or crawlers.
- Visual DOM reordering breaking reading and focus order.
- Redesigning the access form and accidentally changing its persistence contract.

### B3. Implement the interactive transformation

**Outcome:** scrolling reveals the five-stage record transformation with product-specific athletic energy and no loss of user control.

**Dependencies:** B2 semantic foundation.

**Effort:** L

**Work**

- Progressively enhance the server-rendered record into one persistent visual object whose state changes at the five narrative thresholds.
- Use bar/platform geometry, plate loading, force lines, competition signals, and regulatory numerals as structural cues rather than ornamental effects.
- Keep native scrolling. Do not hijack wheel/touch input, force scroll positions, trap users in pinned scenes, or require precise scrolling to reveal content.
- Keep controls and links keyboard reachable, and ensure motion never steals focus or changes semantic reading order.
- Provide a reduced-motion mode that presents stable stage states with direct transitions or no animation.
- Load non-critical animation code and heavy assets lazily; avoid making initial content visibility depend on hydration.

**Acceptance criteria**

- [ ] The exact Program → Execute → Detect deviation → Review → Adjust sequence is apparent on desktop and mobile.
- [ ] One record remains visually and semantically identifiable through all five stages.
- [ ] Native scroll behavior remains uninterrupted; there is no scroll-jacking.
- [ ] Reduced-motion users receive the complete story without parallax, scrubbed animation, or essential timed transitions.
- [ ] No photography, fake proof, unsupported metrics, or generic bodybuilding visual clichés are introduced.

**Verification**

- Test mouse wheel, trackpad, touch, keyboard scrolling, direct-anchor navigation, back/forward navigation, and resize during progression.
- Compare JavaScript, no-JS, and reduced-motion versions for information parity.
- Inspect hydration, console, and runtime errors at every stage threshold.

**Main risks**

- Scroll-linked work causing main-thread jank or layout shifts.
- Motion becoming the message instead of clarifying record continuity.
- Sticky geometry obscuring content on short or narrow viewports.

### B4. Harden accessibility, performance, and release

**Outcome:** the landing replacement is inclusive, fast, observable, and independently releasable.

**Dependencies:** B3 complete; Lane B release controls available without coupling the release to Lane A product changes.

**Effort:** M

**Accessibility requirements**

- No scroll-jacking or mandatory gesture precision.
- Full keyboard operation with visible focus and logical focus order.
- Screen-reader comprehension of stage, state, changed values, deviation, and decision.
- Information is not conveyed by color or motion alone.
- Complete reduced-motion alternative using `prefers-reduced-motion` and an implementation that remains useful when animations are absent.
- Usable at 200% browser zoom without clipped content, overlap, or lost actions.
- Mobile support across representative narrow, short, and touch viewports with at least 44 px interactive targets.

**Performance requirements**

- Lazy-load non-critical animation modules and assets.
- Reserve layout space to avoid cumulative layout shift.
- Keep the initial product thesis, stage-one record, and primary action server-rendered and fast.
- Avoid unbounded scroll listeners, layout thrashing, and continuous work when the story is off-screen.
- Meet the project's agreed Core Web Vitals release thresholds at representative mobile and desktop profiles, with particular attention to LCP, INP, and CLS.

**Acceptance criteria**

- [ ] Keyboard, screen reader, reduced motion, 200% zoom, and mobile checks pass with no blocked content or action.
- [ ] The story preserves content parity with no JavaScript.
- [ ] Core Web Vitals pass the agreed release thresholds under repeatable test conditions.
- [ ] Non-critical visual code is absent from or deferred beyond the critical rendering path.
- [ ] The access form completes success and failure paths after the redesign.
- [ ] Lane B has its own deployed SHA, smoke evidence, monitoring window, and rollback decision.

**Verification**

- Test keyboard and at least one desktop and one mobile screen-reader path.
- Test at 200% zoom and representative mobile viewport sizes/orientations.
- Run automated accessibility checks, then manual checks for reading order, state announcements, and motion.
- Measure lab performance on throttled mobile and desktop profiles and observe field Core Web Vitals after release when traffic permits.
- Run a final structured visual and accessibility QA pass after implementation, plus the production build and full test suite.

**Main risks**

- Passing automated accessibility checks while the changing record remains confusing to assistive technology.
- Lab performance hiding low-end mobile or field regressions.
- Releasing the landing together with operational changes and losing rollback clarity.

---

## Recommended execution order

1. Complete A1 and capture production persistence proof.
2. Complete A2 so known high-risk dependency and upload exposure is not carried into broader work.
3. Complete A3 and prove the release, observability, backup, restore, and rollback controls.
4. Release Lane A operational controls independently and observe them.
5. Complete A4, A5, and A6 as reviewable product work units, preserving the published/historical data contract throughout.
6. After the current production release, complete Stage UX 1 as the next landing work unit; preserve UX 0 geometry and keep animation and copy polish deferred.
7. After UX 1 acceptance, complete B1 planning: freeze the reduced architecture and storyboard.
8. After B1 approval, implement B2 and B3 in a Lane B-only change set.
9. Complete B4, release Lane B independently, and monitor conversion-path health, errors, and Core Web Vitals.

## Definition of done

### Lane A release checklist

- [ ] Migration `0006` state and production persistence are proven with evidence.
- [ ] The 5 high and 1 moderate advisories are remediated or formally risk-accepted with compensating controls and owners.
- [ ] The `xlsx`/upload boundary is authorized, bounded, adversarially tested, and observable.
- [ ] CI gates build, tests, linting, and TypeScript after the pre-existing typing failure is resolved or time-bounded.
- [ ] Security headers are deployed and compatibility-tested.
- [ ] Deployed SHA, migrations, smoke results, and release approval are traceable.
- [ ] Critical paths have privacy-safe error reporting and health signals.
- [ ] Backup/restore and application rollback are proven through controlled drills.
- [ ] Coach mutations are atomic or safely recoverable, preserve entered work, and cannot rewrite historical execution or published versions.
- [ ] Decision-queue priority and tie-breakers are deterministic, explainable, and covered by tests.
- [ ] Program-authoring improvements demonstrably reduce repetitive work while publication remains explicit.
- [ ] Lane A is releasable and reversible without any Lane B landing replacement code.

### Lane B release checklist

- [ ] Stage UX 0 remains passed with normal-flow evidence, no intersections, no horizontal overflow, and no scroll-jacking.
- [ ] Stage UX 1 passes its shared-grid, tablet-composition, optical-balance, narrative-variation, and exact-viewport gates before animation or copy polish begins.
- [ ] Landing content is reduced by approximately 25–35% against the recorded baseline.
- [ ] Current sections follow the approved replace/compress/preserve map.
- [ ] The exact five-stage choreography transforms one persistent record.
- [x] Product evidence and original athlete photography carry the story without unsupported claims.
- [ ] Synthetic data is labeled; no testimonials, customers, metrics, or outcomes are invented.
- [ ] SSR/no-JS content communicates the full proposition and truthful partial-offline limitation.
- [ ] The existing access form, validation, persistence contract, success/error states, and privacy note are preserved.
- [ ] There is no scroll-jacking; keyboard, screen reader, reduced motion, 200% zoom, and mobile behavior pass manual verification.
- [ ] Only the dominant hero image is preloaded; below-fold photographs are lazy-loaded. Core Web Vitals remain a release check.
- [ ] Build, tests, TypeScript policy, accessibility checks, visual QA, and production smoke checks pass.
- [ ] Lane B is releasable and reversible without bundling Lane A database, dependency, or coach-workflow changes.

## Cross-lane risks and controls

| Risk | Control |
|---|---|
| A mixed release obscures the cause of persistence, mutation, or landing regressions | Separate change sets, deployed SHAs, verification evidence, release windows, and rollback decisions. |
| New visual claims outrun verified product behavior | Use real product states and labeled synthetic records; prohibit invented proof and unsupported metrics. |
| Authoring convenience damages execution history | Preserve immutable snapshots and explicit published-version boundaries in server-side tests. |
| Security remediation breaks spreadsheet workflows | Use representative valid fixtures alongside adversarial files and provide actionable rejection messages. |
| Motion degrades access or mobile performance | Start from semantic SSR, progressively enhance, honor reduced motion, lazy-load, and test field-relevant devices. |
| Queue ordering embeds unstable or opaque policy | Use explicit pilot rules, stable tie-breakers, and reason labels with table-driven tests. |

## Next concrete work unit

**Verify the corrective landing as an independent release candidate.**

The remaining work is bounded verification: inspect desktop and narrow mobile crops using the original masters, run the landing E2E and focused unit tests, confirm TypeScript/build status, and record any pre-existing unrelated failure without weakening the landing contract.
