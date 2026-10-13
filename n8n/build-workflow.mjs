import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const normalizeCode = fs.readFileSync(path.join(__dirname, 'logic', 'normalize.js'), 'utf8');
const verifyCode = fs.readFileSync(path.join(__dirname, 'logic', 'verify.js'), 'utf8');
const transcriptCode = fs.readFileSync(path.join(__dirname, 'logic', 'transcript.js'), 'utf8');

const workflow = {
  name: 'Tickets - Create Handoff (ElevenLabs)',
  nodes: [
    // --- STICKY NOTES ---
    {
      parameters: {
        content: '## Phase 1: Receive & Validate\n- Authenticate ElevenLabs tool call with **Ciketo Webhook Secret**\n- Centralize non-secret environment configs in **Config**\n- Normalize phone/email, sanitize fields, compute `dedupe_key`\n- Return 400 validation error if required fields are missing',
        height: 380,
        width: 320,
        color: 4
      },
      id: 'sticky-receive',
      name: 'Sticky Note: Receive',
      type: 'n8n-nodes-base.stickyNote',
      typeVersion: 1,
      position: [-60, 40]
    },
    {
      parameters: {
        content: '## Phase 2: Verify Identity\n- Check if `order_id` is present\n- If present, query Supabase `orders` table\n- Match email or last 7 digits of phone number\n- Sets `order_uuid` and `identity_verified` flag',
        height: 380,
        width: 320,
        color: 5
      },
      id: 'sticky-verify',
      name: 'Sticky Note: Verify',
      type: 'n8n-nodes-base.stickyNote',
      typeVersion: 1,
      position: [920, 40]
    },
    {
      parameters: {
        content: '## Phase 3: Save & Respond\n- Call Supabase RPC `create_ticket(p)`\n- Auto-retry 2x on transient database failure\n- Immediate 200 response (ticket_id, duplicate)\n- Immediate 500 response if save fails (no customer data leaked)',
        height: 380,
        width: 320,
        color: 6
      },
      id: 'sticky-save',
      name: 'Sticky Note: Save',
      type: 'n8n-nodes-base.stickyNote',
      typeVersion: 1,
      position: [1640, 40]
    },
    {
      parameters: {
        content: '## Phase 4: Transcript Attachment\n- If not duplicate, retrieve conversation from ElevenLabs\n- Retry up to FETCH_ATTEMPTS with 3s wait\n- Format Customer & Agent lines, truncate at TRANSCRIPT_MAX_CHARS\n- Attach note via Supabase RPC `add_ticket_note`',
        height: 380,
        width: 320,
        color: 2
      },
      id: 'sticky-transcript',
      name: 'Sticky Note: Transcript',
      type: 'n8n-nodes-base.stickyNote',
      typeVersion: 1,
      position: [2360, 40]
    },

    // --- PHASE 1 NODES ---
    {
      parameters: {
        httpMethod: 'POST',
        path: 'ciketo/tickets/create',
        responseMode: 'responseNode',
        authentication: 'headerAuth',
        options: {}
      },
      id: 'node-webhook',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [0, 240],
      webhookId: 'ciketo-tickets-create',
      credentials: {
        httpHeaderAuth: {
          id: 'cred-webhook-secret',
          name: 'Ciketo Webhook Secret'
        }
      }
    },
    {
      parameters: {
        assignments: {
          assignments: [
            {
              id: 'cfg-supabase-url',
              name: 'SUPABASE_URL',
              value: 'https://YOUR-PROJECT.supabase.co',
              type: 'string'
            },
            {
              id: 'cfg-transcript-chars',
              name: 'TRANSCRIPT_MAX_CHARS',
              value: 20000,
              type: 'number'
            },
            {
              id: 'cfg-fetch-attempts',
              name: 'FETCH_ATTEMPTS',
              value: 3,
              type: 'number'
            }
          ]
        },
        options: {}
      },
      id: 'node-config',
      name: 'Config',
      type: 'n8n-nodes-base.set',
      typeVersion: 3.4,
      position: [240, 240]
    },
    {
      parameters: {
        jsCode: normalizeCode
      },
      id: 'node-validate-normalize',
      name: 'Validate and Normalize',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [480, 240]
    },
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict'
          },
          conditions: [
            {
              id: 'cond-valid',
              leftValue: '={{ $json.valid }}',
              rightValue: true,
              operator: {
                type: 'boolean',
                operation: 'true',
                singleValue: true
              }
            }
          ],
          combinator: 'and'
        },
        options: {}
      },
      id: 'node-if-valid',
      name: 'IF Valid',
      type: 'n8n-nodes-base.if',
      typeVersion: 2.2,
      position: [720, 240]
    },
    {
      parameters: {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ "success": false, "error": "validation", "message": $json.validation_message }) }}',
        responseCode: 400,
        options: {}
      },
      id: 'node-respond-400',
      name: 'Respond 400',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.4,
      position: [960, 440]
    },

    // --- PHASE 2 NODES ---
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict'
          },
          conditions: [
            {
              id: 'cond-has-order-id',
              leftValue: '={{ Boolean($json.order_id) }}',
              rightValue: true,
              operator: {
                type: 'boolean',
                operation: 'true',
                singleValue: true
              }
            }
          ],
          combinator: 'and'
        },
        options: {}
      },
      id: 'node-if-has-order-id',
      name: 'IF Has Order ID',
      type: 'n8n-nodes-base.if',
      typeVersion: 2.2,
      position: [960, 240]
    },
    {
      parameters: {
        method: 'GET',
        url: "={{ $('Config').first().json.SUPABASE_URL + '/rest/v1/orders?order_id=eq.' + encodeURIComponent($json.order_id) + '&select=id,order_id,email,phone' }}",
        authentication: 'genericCredentialType',
        genericAuthType: 'customAuth',
        options: {
          alwaysOutputData: true
        }
      },
      id: 'node-lookup-order',
      name: 'Lookup Order',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1200, 160],
      continueOnFail: true,
      credentials: {
        customAuth: {
          id: 'cred-supabase-service-role',
          name: 'Supabase Service Role'
        }
      }
    },
    {
      parameters: {
        jsCode: verifyCode
      },
      id: 'node-verify-identity',
      name: 'Verify Identity',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1440, 240]
    },

    // --- PHASE 3 NODES ---
    {
      parameters: {
        method: 'POST',
        url: "={{ $('Config').first().json.SUPABASE_URL + '/rest/v1/rpc/create_ticket' }}",
        authentication: 'genericCredentialType',
        genericAuthType: 'customAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ { "p": { "customer_name": $json.customer_name, "email": $json.email, "phone": $json.phone, "order_id": $json.order_id, "order_uuid": $json.order_uuid, "category": $json.category, "priority": $json.priority, "summary": $json.summary, "details": $json.details, "source": "chat_agent", "is_handoff": true, "identity_verified": $json.identity_verified, "conversation_id": $json.conversation_id, "dedupe_key": $json.dedupe_key } } } }',
        options: {
          retry: {
            retry: {
              maxTries: 2,
              waitBetweenTries: 1000
            }
          }
        }
      },
      id: 'node-create-ticket',
      name: 'Create Ticket',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1680, 240],
      onError: 'continueErrorOutput',
      credentials: {
        customAuth: {
          id: 'cred-supabase-service-role',
          name: 'Supabase Service Role'
        }
      }
    },
    {
      parameters: {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ "success": false, "error": "save_failed", "message": "Could not create the ticket." }) }}',
        responseCode: 500,
        options: {}
      },
      id: 'node-respond-500',
      name: 'Respond 500',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.4,
      position: [1920, 360]
    },
    {
      parameters: {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ "success": true, "ticket_id": $json.ticket_id || $json.ticketId || "TKT-CREATED", "duplicate": Boolean($json.duplicate), "message": "Ticket created." }) }}',
        responseCode: 200,
        options: {}
      },
      id: 'node-respond-200',
      name: 'Respond 200',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.4,
      position: [1920, 160]
    },

    // --- PHASE 4 NODES ---
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict'
          },
          conditions: [
            {
              id: 'cond-is-duplicate',
              leftValue: '={{ Boolean($json.duplicate) }}',
              rightValue: true,
              operator: {
                type: 'boolean',
                operation: 'true',
                singleValue: true
              }
            }
          ],
          combinator: 'and'
        },
        options: {}
      },
      id: 'node-if-duplicate',
      name: 'IF Duplicate',
      type: 'n8n-nodes-base.if',
      typeVersion: 2.2,
      position: [2160, 160]
    },
    {
      parameters: {
        assignments: {
          assignments: [
            {
              id: 'assign-attempt',
              name: 'attempt',
              value: 1,
              type: 'number'
            }
          ]
        },
        options: {}
      },
      id: 'node-init-attempt',
      name: 'Init Attempt',
      type: 'n8n-nodes-base.set',
      typeVersion: 3.4,
      position: [2400, 240]
    },
    {
      parameters: {
        method: 'GET',
        url: "={{ 'https://api.elevenlabs.io/v1/convai/conversations/' + encodeURIComponent($('Validate and Normalize').first().json.conversation_id) }}",
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        options: {
          retry: {
            retry: {
              maxTries: 2,
              waitBetweenTries: 1000
            }
          }
        }
      },
      id: 'node-get-conversation',
      name: 'Get Conversation',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [2640, 240],
      continueOnFail: true,
      credentials: {
        httpHeaderAuth: {
          id: 'cred-elevenlabs-api-key',
          name: 'ElevenLabs API Key'
        }
      }
    },
    {
      parameters: {
        jsCode: transcriptCode
      },
      id: 'node-build-transcript',
      name: 'Build Transcript',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [2880, 240]
    },
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict'
          },
          conditions: [
            {
              id: 'cond-should-retry',
              leftValue: '={{ Boolean($json.should_retry) }}',
              rightValue: true,
              operator: {
                type: 'boolean',
                operation: 'true',
                singleValue: true
              }
            }
          ],
          combinator: 'and'
        },
        options: {}
      },
      id: 'node-if-should-retry',
      name: 'IF Should Retry',
      type: 'n8n-nodes-base.if',
      typeVersion: 2.2,
      position: [3120, 240]
    },
    {
      parameters: {
        amount: 3,
        unit: 'seconds'
      },
      id: 'node-wait-3s',
      name: 'Wait 3s',
      type: 'n8n-nodes-base.wait',
      typeVersion: 1.1,
      position: [3120, 420],
      webhookId: 'wait-transcript-settle'
    },
    {
      parameters: {
        method: 'POST',
        url: "={{ $('Config').first().json.SUPABASE_URL + '/rest/v1/rpc/add_ticket_note' }}",
        authentication: 'genericCredentialType',
        genericAuthType: 'customAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ { "p_ticket_uuid": $(\'Create Ticket\').first().json.id, "p_author": "system", "p_kind": $json.note_kind || "transcript", "p_body": $json.transcript_text } }}',
        options: {}
      },
      id: 'node-add-transcript-note',
      name: 'Add Transcript Note',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [3360, 240],
      continueOnFail: true,
      credentials: {
        customAuth: {
          id: 'cred-supabase-service-role',
          name: 'Supabase Service Role'
        }
      }
    }
  ],
  connections: {
    Webhook: {
      main: [
        [
          {
            node: 'Config',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    Config: {
      main: [
        [
          {
            node: 'Validate and Normalize',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Validate and Normalize': {
      main: [
        [
          {
            node: 'IF Valid',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'IF Valid': {
      main: [
        [
          {
            node: 'IF Has Order ID',
            type: 'main',
            index: 0
          }
        ],
        [
          {
            node: 'Respond 400',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'IF Has Order ID': {
      main: [
        [
          {
            node: 'Lookup Order',
            type: 'main',
            index: 0
          }
        ],
        [
          {
            node: 'Verify Identity',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Lookup Order': {
      main: [
        [
          {
            node: 'Verify Identity',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Verify Identity': {
      main: [
        [
          {
            node: 'Create Ticket',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Create Ticket': {
      main: [
        [
          {
            node: 'Respond 200',
            type: 'main',
            index: 0
          }
        ],
        [
          {
            node: 'Respond 500',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Respond 200': {
      main: [
        [
          {
            node: 'IF Duplicate',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'IF Duplicate': {
      main: [
        [],
        [
          {
            node: 'Init Attempt',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Init Attempt': {
      main: [
        [
          {
            node: 'Get Conversation',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Get Conversation': {
      main: [
        [
          {
            node: 'Build Transcript',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Build Transcript': {
      main: [
        [
          {
            node: 'IF Should Retry',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'IF Should Retry': {
      main: [
        [
          {
            node: 'Wait 3s',
            type: 'main',
            index: 0
          }
        ],
        [
          {
            node: 'Add Transcript Note',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Wait 3s': {
      main: [
        [
          {
            node: 'Get Conversation',
            type: 'main',
            index: 0
          }
        ]
      ]
    }
  },
  active: false,
  settings: {
    executionOrder: 'v1'
  },
  versionId: '1',
  meta: {
    templateCredsSetupCompleted: true
  },
  tags: [
    {
      name: 'ciketo'
    }
  ]
};

const outputPath = path.join(__dirname, 'workflows', 'tickets-create-handoff.json');
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2), 'utf8');

console.log('Successfully built workflow JSON at: ' + outputPath);
