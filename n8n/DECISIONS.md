# Architectural & Design Decisions

This document records ambiguities encountered and resolved during the creation of the Ciketo Support Ticket Handoff workflow (`Tickets - Create Handoff (ElevenLabs)`).

---

### 1. `package.json` Location and Project Isolation
- **Context:** The workspace root hosts an existing Next.js application with established scripts (`build: "next build"`, `test: "vitest run"`, and an extensive root `verify` pipeline). Hard rules stipulated: *"Do not modify, delete or re-use the names of any existing workflow or credential. Only create new files for this workflow."*
- **Decision:** Dedicated `n8n/package.json` was created inside the `n8n/` directory with `build`, `validate`, `test`, and `verify` scripts using standard Node.js built-ins (`node:test`, `node:vm`, `node:fs`). This preserves the root Next.js configuration untouched while fulfilling the requirement that `npm run verify` runs `build`, `validate`, `test` in order without any third-party npm dependencies.

---

### 2. Order Lookup Routing (`order_id` Bypass)
- **Context:** Customers can submit tickets without an `order_id` (e.g. general inquiries, callback requests). The spec requested: *"Lookup Order (HTTP Request, only when order_id is present...)"*.
- **Decision:** Placed an `IF Has Order ID` node (`Boolean($json.order_id)`) between `IF Valid` and `Lookup Order`.
  - When `order_id` is present: executes `Lookup Order` (GET `/rest/v1/orders?order_id=eq.<id>...`), which continues on failure with `alwaysOutputData: true`, then passes into `Verify Identity`.
  - When `order_id` is absent: routes directly to `Verify Identity`. `Verify Identity` gracefully detects the absence of order records and sets `order_uuid: null` and `identity_verified: false` without triggering unnecessary network calls.

---

### 3. Non-Crypto Deduplication Hash
- **Context:** The specification required: *"builds a dedupe_key from conversation_id, category and a simple string hash (no crypto module) of the lower-cased summary"*.
- **Decision:** Implemented a deterministic 32-bit integer polynomial rolling hash (djb2 variant bitwise shift `((hash << 5) - hash) + char`) formatted as an 8-character zero-padded hexadecimal string:
  ```js
  function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }
  ```
  The resulting `dedupe_key` takes the form `${conversation_id}:${category}:${hash}`, ensuring stable idempotency without requiring external dependencies or the `crypto` library.

---

### 4. Phone Number Normalization & Verification Matching
- **Context:** Customer phone inputs may contain international codes, spaces, dashes, or parentheses. The spec required: *"keeps digits and a leading + in phone"*, and for identity verification: *"the last 7 digits of the phones match"*.
- **Decision:**
  - Normalization: Retains digits and any leading `+` (`phone.replace(/(?!^\+)[^\d]/g, '')`).
  - Identity verification: Strips all non-digit characters and compares the trailing 7 digits (`phoneDigits.slice(-7)`). If either the order phone or ticket phone contains fewer than 7 digits, phone verification returns `false` to prevent false positive matches on empty or short inputs.

---

### 5. Transcript Retry Loop & Fallback Note Handling
- **Context:** ElevenLabs call transcripts may have a propagation delay. If the fetch fails or transcript is empty, the workflow must retry up to `FETCH_ATTEMPTS` with a 3-second delay, or fall back to a system note (`"Transcript could not be retrieved."`).
- **Decision:**
  - `Build Transcript` checks if valid transcript lines were found.
  - If empty or errored and `attempt < FETCH_ATTEMPTS`: outputs `should_retry: true` and increments `attempt`. The `IF Should Retry` node directs execution to `Wait 3s` (n8n Wait node configured for 3 seconds), which routes back to `Get Conversation`.
  - If `attempt >= FETCH_ATTEMPTS` or transcript is present: outputs `should_retry: false`. If transcript could not be fetched after max attempts, `note_kind` is set to `"system"` and `transcript_text` to `"Transcript could not be retrieved."`.
  - `Add Transcript Note` is set to `continueOnFail: true`, ensuring any logging failure cannot impact the already-transmitted webhook response.

---

### 6. Credential Naming and Placeholder Standards
- **Context:** No credentials or secrets may be hardcoded or leaked.
- **Decision:** All credentials strictly reference the required names:
  1. `Ciketo Webhook Secret` (Header Auth for incoming webhooks, header: `x-ciketo-secret`)
  2. `Supabase Service Role` (Custom Auth for Supabase REST API and RPC calls, headers: `apikey` and `Authorization: Bearer <key>`)
  3. `ElevenLabs API Key` (Header Auth for ElevenLabs API, header: `xi-api-key`)
- Non-secret environment configs (`SUPABASE_URL`, `TRANSCRIPT_MAX_CHARS`, `FETCH_ATTEMPTS`) are isolated in the `Config` Set node with safe placeholder `https://YOUR-PROJECT.supabase.co`.
