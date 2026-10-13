import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workflowPath = path.join(__dirname, '..', 'workflows', 'tickets-create-handoff.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

function getCodeNode(name) {
  const node = workflow.nodes.find(n => n.name === name);
  assert.ok(node, `Node ${name} must exist in workflow`);
  assert.equal(node.type, 'n8n-nodes-base.code', `Node ${name} must be a code node`);
  return node.parameters.jsCode;
}

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));
}

function executeInVm(code, contextVariables) {
  const sandbox = {
    ...contextVariables,
    console: console
  };

  const wrappedScript = `
    function __runNodeCode() {
      ${code}
    }
    __runNodeCode();
  `;

  const script = new vm.Script(wrappedScript);
  const context = vm.createContext(sandbox);
  return script.runInContext(context);
}

test('VM Runner: Validate and Normalize Code node executes with n8n stubs', () => {
  const code = getCodeNode('Validate and Normalize');
  const validFixture = loadFixture('valid-request.json');

  const stubs = {
    $input: {
      first: () => ({ json: validFixture })
    },
    $json: validFixture,
    $: (nodeName) => {
      if (nodeName === 'Config') {
        return {
          first: () => ({
            json: {
              SUPABASE_URL: 'https://test-project.supabase.co',
              TRANSCRIPT_MAX_CHARS: 20000,
              FETCH_ATTEMPTS: 3
            }
          })
        };
      }
      return { first: () => ({ json: {} }) };
    }
  };

  const output = executeInVm(code, stubs);
  assert.ok(Array.isArray(output), 'Code node must return an array');
  assert.equal(output.length, 1);
  const result = output[0].json;

  assert.equal(result.valid, true);
  assert.equal(result.customer_name, 'Jordan Reed');
  assert.equal(result.priority, 'high');
  assert.ok(result.dedupe_key.includes('conv_3501m4qzyw53ek9azb78a357cwfp'));
});

test('VM Runner: Validate and Normalize handles invalid input inside VM', () => {
  const code = getCodeNode('Validate and Normalize');
  const badFixture = loadFixture('missing-contact.json');

  const stubs = {
    $input: {
      first: () => ({ json: badFixture })
    },
    $json: badFixture,
    $: () => ({ first: () => ({ json: {} }) })
  };

  const output = executeInVm(code, stubs);
  const result = output[0].json;

  assert.equal(result.valid, false);
  assert.match(result.validation_message, /contact method/i);
});

test('VM Runner: Verify Identity Code node executes with order lookup in VM', () => {
  const code = getCodeNode('Verify Identity');
  const fixture = loadFixture('order-matched-email.json');

  const stubs = {
    $input: {
      first: () => ({ json: fixture.ticket })
    },
    $json: fixture.ticket,
    $: (nodeName) => {
      if (nodeName === 'Validate and Normalize') {
        return { first: () => ({ json: fixture.ticket }) };
      }
      if (nodeName === 'Lookup Order') {
        return {
          all: () => fixture.orders.map(o => ({ json: o }))
        };
      }
      return { first: () => ({ json: {} }), all: () => [] };
    }
  };

  const output = executeInVm(code, stubs);
  assert.ok(Array.isArray(output));
  const result = output[0].json;

  assert.equal(result.order_uuid, 'e0000005-ebcd-4354-ab66-c94d2f958742');
  assert.equal(result.identity_verified, true);
  assert.equal(result.is_handoff, true);
});

test('VM Runner: Build Transcript Code node executes and formats conversation in VM', () => {
  const code = getCodeNode('Build Transcript');
  const fixture = loadFixture('transcript-normal.json');

  const stubs = {
    $input: {
      first: () => ({ json: fixture })
    },
    $json: fixture,
    $: (nodeName) => {
      if (nodeName === 'Config') {
        return {
          first: () => ({
            json: {
              TRANSCRIPT_MAX_CHARS: 20000,
              FETCH_ATTEMPTS: 3
            }
          })
        };
      }
      if (nodeName === 'Init Attempt') {
        return { first: () => ({ json: { attempt: 1 } }) };
      }
      return { first: () => ({ json: {} }) };
    }
  };

  const output = executeInVm(code, stubs);
  assert.ok(Array.isArray(output));
  const result = output[0].json;

  assert.equal(result.should_retry, false);
  assert.equal(result.has_user_message, true);
  assert.match(result.transcript_text, /Customer: Hi, my cargo arrived/);
  assert.match(result.transcript_text, /Agent: Thank you for contacting/);
});
