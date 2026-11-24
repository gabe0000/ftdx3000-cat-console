import test from "node:test";
import assert from "node:assert/strict";
import { isLocalConsoleClient, isLocalConsoleHost } from "../src/localAccess.js";

const request = (headers) => ({ headers, socket: { localPort: 3030 } });

test("the console accepts only loopback hosts on its listening port", () => {
  for (const host of ["localhost:3030", "127.0.0.1:3030"]) {
    assert.ok(isLocalConsoleHost(request({ host })));
  }
  for (const host of ["radio.example:3030", "localhost:3040", "localhost:3030@example.com", "", undefined]) {
    assert.equal(isLocalConsoleHost(request({ host })), false);
  }
});

test("browser API and CAT traffic must be same-origin", () => {
  const host = "localhost:3030";
  assert.ok(isLocalConsoleClient(request({ host })));
  assert.ok(isLocalConsoleClient(request({ host, origin: "http://localhost:3030", "sec-fetch-site": "same-origin" })));
  for (const origin of ["https://example.com", "http://localhost:3040", "http://127.0.0.1:3030", "null"]) {
    assert.equal(isLocalConsoleClient(request({ host, origin })), false);
  }
  assert.equal(isLocalConsoleClient(request({ host, "sec-fetch-site": "cross-site" })), false);
  assert.equal(isLocalConsoleClient(request({ host, "sec-fetch-site": "same-site" })), false);
});
