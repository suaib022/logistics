import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiUrl = process.env.N8N_API_URL?.trim();
const apiKey = process.env.N8N_API_KEY?.trim();

// Skip silently if environment variables are not configured
if (!apiUrl || !apiKey) {
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workflowPath = path.join(__dirname, 'workflows', 'tickets-create-handoff.json');

if (!fs.existsSync(workflowPath)) {
  console.error(`Workflow file not found at: ${workflowPath}`);
  process.exit(1);
}

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Hard rule: Must be imported inactive
const payload = {
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: workflow.settings || { executionOrder: 'v1' }
};

const normalizedBaseUrl = apiUrl.replace(/\/+$/, '');
const endpoint = `${normalizedBaseUrl}/api/v1/workflows`;

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': apiKey,
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`n8n API import failed (HTTP ${response.status} ${response.statusText}):`, errorBody);
    process.exit(1);
  }

  const result = await response.json();
  console.log(`Successfully imported workflow "${result.name}" (ID: ${result.id}, active: ${result.active})`);
} catch (err) {
  console.error('Error connecting to n8n API:', err.message);
  process.exit(1);
}
