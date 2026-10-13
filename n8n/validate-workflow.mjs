import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workflowPath = path.join(__dirname, 'workflows', 'tickets-create-handoff.json');

const ALLOWED_CREDENTIAL_NAMES = new Set([
  'Ciketo Webhook Secret',
  'Supabase Service Role',
  'ElevenLabs API Key'
]);

const CODE_NODE_SOURCES = {
  'Validate and Normalize': path.join(__dirname, 'logic', 'normalize.js'),
  'Verify Identity': path.join(__dirname, 'logic', 'verify.js'),
  'Build Transcript': path.join(__dirname, 'logic', 'transcript.js')
};

function fail(message) {
  console.error('VALIDATION FAILED: ' + message);
  process.exit(1);
}

console.log('--- Validating Workflow: ' + workflowPath + ' ---');

if (!fs.existsSync(workflowPath)) {
  fail('Workflow file does not exist at ' + workflowPath);
}

let workflow = null;
try {
  workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
} catch (e) {
  fail('Invalid JSON in workflow file: ' + e.message);
}

const nodes = workflow.nodes || [];
const connections = workflow.connections || {};

// 1. Check for duplicate node names
const nameCounts = {};
for (const n of nodes) {
  if (!n.name) fail('Node missing name property');
  nameCounts[n.name] = (nameCounts[n.name] || 0) + 1;
}
const duplicateNames = Object.keys(nameCounts).filter(k => nameCounts[k] > 1);
if (duplicateNames.length > 0) {
  fail('Duplicate node names found: ' + duplicateNames.join(', '));
}
console.log('✔ Check 1 Passed: No duplicate node names.');

// 2. Check that all connections point to existing nodes
const nodeNameSet = new Set(nodes.map(n => n.name));
for (const [sourceNode, connGroup] of Object.entries(connections)) {
  if (!nodeNameSet.has(sourceNode)) {
    fail(`Connection source node "${sourceNode}" does not exist in workflow nodes.`);
  }
  const mainConns = connGroup.main || [];
  for (const branch of mainConns) {
    for (const target of branch) {
      if (!nodeNameSet.has(target.node)) {
        fail(`Connection target node "${target.node}" (from "${sourceNode}") does not exist.`);
      }
    }
  }
}
console.log('✔ Check 2 Passed: All connection points exist.');

// 3. Check reachability of all execution nodes from Webhook
const executionNodes = nodes
  .filter(n => n.type !== 'n8n-nodes-base.stickyNote')
  .map(n => n.name);

const webhookNode = nodes.find(n => n.name === 'Webhook');
if (!webhookNode) fail('Webhook node not found');

const visited = new Set();
const queue = ['Webhook'];

while (queue.length > 0) {
  const current = queue.shift();
  if (visited.has(current)) continue;
  visited.add(current);

  const connGroup = connections[current];
  if (connGroup && connGroup.main) {
    for (const branch of connGroup.main) {
      for (const target of branch) {
        if (!visited.has(target.node)) {
          queue.push(target.node);
        }
      }
    }
  }
}

const unreachableNodes = executionNodes.filter(name => !visited.has(name));
if (unreachableNodes.length > 0) {
  fail('Unreachable nodes from Webhook: ' + unreachableNodes.join(', '));
}
console.log('✔ Check 3 Passed: All execution nodes are reachable from Webhook.');

// 4. Check Webhook is POST on path ciketo/tickets/create
if (webhookNode.parameters?.httpMethod !== 'POST') {
  fail(`Webhook httpMethod must be POST (found: ${webhookNode.parameters?.httpMethod})`);
}
if (webhookNode.parameters?.path !== 'ciketo/tickets/create') {
  fail(`Webhook path must be ciketo/tickets/create (found: ${webhookNode.parameters?.path})`);
}
console.log('✔ Check 4 Passed: Webhook path is POST ciketo/tickets/create.');

// 5. Check Webhook has Header Auth
if (webhookNode.parameters?.authentication !== 'headerAuth') {
  fail('Webhook must have authentication set to headerAuth');
}
const webhookCred = webhookNode.credentials?.httpHeaderAuth?.name;
if (webhookCred !== 'Ciketo Webhook Secret') {
  fail(`Webhook must reference credential "Ciketo Webhook Secret" (found: "${webhookCred}")`);
}
console.log('✔ Check 5 Passed: Webhook has Header Auth with Ciketo Webhook Secret.');

// 6. Check workflow is inactive
if (workflow.active !== false) {
  fail(`Workflow active status must be false (found: ${workflow.active})`);
}
console.log('✔ Check 6 Passed: Workflow is created INACTIVE.');

// 7. Check for hardcoded secrets
const rawJson = JSON.stringify(workflow);

function scanForSecrets(obj, currentPath = '') {
  if (typeof obj === 'string') {
    // Flag JWT tokens
    if (/eyJ[A-Za-z0-9-_]{20,}/.test(obj)) {
      fail(`Potential JWT token found at ${currentPath}`);
    }
    // Flag API secret keys
    if (/sk_[A-Za-z0-9-_]{20,}/.test(obj)) {
      fail(`Potential API key (sk_...) found at ${currentPath}`);
    }
    // Flag service_role secret strings (allowed in credential name 'Supabase Service Role')
    if (obj.includes('service_role') && obj !== 'Supabase Service Role') {
      fail(`Forbidden secret pattern "service_role" found at ${currentPath}`);
    }
    // Flag raw Bearer tokens
    if (/Bearer\s+[A-Za-z0-9-_]{20,}/i.test(obj)) {
      fail(`Hardcoded Bearer token found at ${currentPath}`);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, idx) => scanForSecrets(item, `${currentPath}[${idx}]`));
  } else if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      scanForSecrets(val, `${currentPath}.${key}`);
    }
  }
}
scanForSecrets(workflow, 'workflow');
console.log('✔ Check 7 Passed: No hardcoded secrets detected.');

// 8. Check that all credential references use only the allowed names
for (const n of nodes) {
  if (n.credentials) {
    for (const [credType, credObj] of Object.entries(n.credentials)) {
      const credName = credObj?.name;
      if (!ALLOWED_CREDENTIAL_NAMES.has(credName)) {
        fail(`Node "${n.name}" references invalid credential name: "${credName}". Only allowed: ${Array.from(ALLOWED_CREDENTIAL_NAMES).join(', ')}`);
      }
    }
  }
}
console.log('✔ Check 8 Passed: All credentials reference allowed names only.');

// 9. Check Code node bodies match source modules
for (const [nodeName, sourcePath] of Object.entries(CODE_NODE_SOURCES)) {
  const codeNode = nodes.find(n => n.name === nodeName);
  if (!codeNode) {
    fail(`Required Code node "${nodeName}" not found in workflow.`);
  }
  const expectedCode = fs.readFileSync(sourcePath, 'utf8');
  if (codeNode.parameters?.jsCode !== expectedCode) {
    fail(`Code node "${nodeName}" body differs from source module ${sourcePath}`);
  }
}
console.log('✔ Check 9 Passed: All Code node bodies match their source modules.');

console.log('\n========================================');
console.log('🎉 ALL WORKFLOW VALIDATION CHECKS PASSED!');
console.log('========================================\n');
process.exit(0);
