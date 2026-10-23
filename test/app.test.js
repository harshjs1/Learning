import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { after, before } from 'node:test';
import { app } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('protected user endpoint rejects unauthenticated requests', async () => {
  const response = await fetch(`${baseUrl}/users/current-user`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(body.message, 'Unauthorized request');
});

test('login endpoint validates required credentials', async () => {
  const response = await fetch(`${baseUrl}/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, 'Email or username and password are required');
});

test('login endpoint handles requests without a body', async () => {
  const response = await fetch(`${baseUrl}/users/login`, { method: 'POST' });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});
