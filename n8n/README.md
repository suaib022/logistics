# Ciketo Support Ticket Handoff Workflow (ElevenLabs to Supabase)

An enterprise n8n workflow for **Ciketo** logistics that receives support ticket requests from an ElevenLabs conversational AI agent webhook tool, verifies the customer's identity against existing orders in Supabase, persists the ticket via an RPC function, and asynchronously attaches the full call transcript.

---

## 1. Import Steps

You can import this workflow into n8n either via the web UI or automated script:

### Option A: Via n8n Web UI
1. Open your n8n workspace.
2. In the left navigation, click **Workflows**.
3. In the top-right menu (`...`), select **Import from File...**.
4. Select `n8n/workflows/tickets-create-handoff.json`.
5. The workflow will appear as **"Tickets - Create Handoff (ElevenLabs)"** with the tag `ciketo`. It is imported **Inactive** by default.

### Option B: Via Automated CLI Script
If you have your n8n instance API access configured:
```bash
export N8N_API_URL="https://your-n8n-instance.com"
export N8N_API_KEY="your-n8n-api-key"
node n8n/import-via-api.mjs
```
*(If the environment variables are not set, the script exits silently without error).*

---

## 2. Credentials Setup

In your n8n workspace, navigate to **Credentials** -> **New Credential** and create the following **three credentials** using these **exact names**:

### 1. `Ciketo Webhook Secret`
- **Credential Type:** `Header Auth`
- **Name:** `Ciketo Webhook Secret`
- **Header Name:** `x-ciketo-secret`
- **Header Value:** `<your-chosen-secret-token>`
- *Used by:* `Webhook` node to authenticate incoming requests from ElevenLabs.

### 2. `Supabase Service Role`
- **Credential Type:** `Custom Auth`
- **Name:** `Supabase Service Role`
- **Custom Headers:**
  - Header 1:
    - **Name:** `apikey`
    - **Value:** `<your-supabase-service-role-key>`
  - Header 2:
    - **Name:** `Authorization`
    - **Value:** `Bearer <your-supabase-service-role-key>`
- *Used by:* `Lookup Order`, `Create Ticket`, and `Add Transcript Note` nodes to query the REST API and RPC functions.

### 3. `ElevenLabs API Key`
- **Credential Type:** `Header Auth`
- **Name:** `ElevenLabs API Key`
- **Header Name:** `xi-api-key`
- **Header Value:** `<your-elevenlabs-api-key>`
- *Used by:* `Get Conversation` node to fetch conversation transcripts from `https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}`.

---

## 3. Configure Workflow Settings

1. Double-click the **Config** node (the Set node directly following the Webhook).
2. Update the values:
   - **`SUPABASE_URL`**: Replace `https://YOUR-PROJECT.supabase.co` with your live Supabase project URL (e.g. `https://xyzabc.supabase.co`).
   - **`TRANSCRIPT_MAX_CHARS`**: `20000` (maximum character length for conversation transcript before truncation).
   - **`FETCH_ATTEMPTS`**: `3` (maximum attempts to retrieve the transcript if ElevenLabs has a processing delay).
3. Click **Save** in the n8n editor.

---

## 4. Activating the Workflow

1. In the top-right header of the workflow canvas, toggle the **Active** switch from `Inactive` to **`Active`**.
2. Click **Save** (`Cmd+S` / `Ctrl+S`).

---

## 5. ElevenLabs Webhook Tool Configuration

In your ElevenLabs Agent configuration, add a Webhook Tool:
- **Method:** `POST`
- **URL (Production):**
  ```
  https://<YOUR-N8N-DOMAIN>/webhook/ciketo/tickets/create
  ```
- **URL (Test / Execution Testing):**
  ```
  https://<YOUR-N8N-DOMAIN>/webhook-test/ciketo/tickets/create
  ```
- **Headers:**
  - `x-ciketo-secret`: `<your-chosen-secret-token>`
  - `Content-Type`: `application/json`
- **Tool Parameters (JSON Schema):**
  - `conversation_id` (string, required): ElevenLabs call ID starting with `conv_`
  - `customer_name` (string, required): Customer's name
  - `email` (string, optional): Customer's email (at least one of email or phone required)
  - `phone` (string, optional): Customer's phone number
  - `order_id` (string, optional): e.g. `CKT-2026-100001`
  - `category` (string, optional): `unanswered_question`, `complaint`, `delay`, `damage_claim`, `billing`, `quote_followup`, `callback_request`, `customs_legal`, `other`
  - `priority` (string, optional): `low`, `normal`, `high`, `urgent`
  - `summary` (string, required): Short summary (3 to 200 characters)
  - `details` (string, required): Comprehensive notes (at least 5 characters)

---

## 6. Testing with cURL

### Valid Support Ticket Request
```bash
curl -X POST "https://<YOUR-N8N-DOMAIN>/webhook/ciketo/tickets/create" \
  -H "Content-Type: application/json" \
  -H "x-ciketo-secret: YOUR_WEBHOOK_SECRET" \
  -d '{
    "conversation_id": "conv_98a7b6c5d4e3f2",
    "customer_name": "Marcus Vance",
    "email": "marcus.vance@example.com",
    "phone": "+49 170 5550199",
    "order_id": "CKT-2026-100001",
    "category": "delay",
    "priority": "normal",
    "summary": "Shipment delayed at Hamburg hub",
    "details": "Customer inquired about delayed machinery shipment. Needs delivery status update ASAP."
  }'
```

**Expected 200 OK Response:**
```json
{
  "success": true,
  "ticket_id": "TKT-2026-1001",
  "duplicate": false,
  "message": "Ticket created."
}
```

### Validation Error Example (Missing Contact Info)
```bash
curl -X POST "https://<YOUR-N8N-DOMAIN>/webhook/ciketo/tickets/create" \
  -H "Content-Type: application/json" \
  -H "x-ciketo-secret: YOUR_WEBHOOK_SECRET" \
  -d '{
    "conversation_id": "conv_98a7b6c5d4e3f2",
    "customer_name": "Marcus Vance",
    "summary": "General inquiry",
    "details": "Customer had a question about routes."
  }'
```

**Expected 400 Bad Request Response:**
```json
{
  "success": false,
  "error": "validation",
  "message": "At least one contact method (email or phone) is required."
}
```

---

## 7. Development, Testing & Verification

All pure logic modules, unit tests, workflow builders, and workflow validators run with Node.js built-ins:

```bash
# Navigate to the n8n directory
cd n8n

# Build the workflow JSON embedding pure logic functions
npm run build

# Validate JSON structure, connections, security, and credentials
npm run validate

# Run unit tests and VM node execution tests (24 tests)
npm run test

# Run full verification (build, validate, test in sequence)
npm run verify
```
