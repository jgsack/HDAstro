import assert from "node:assert/strict";
import handler, { validReading, validateContext } from "../api/reading.mjs";

const now = new Date("2026-09-15T12:00:00Z");
const context = { date: "2026-09-15", asOf: now.toISOString(), timeZone: "America/Los_Angeles", strategy: "Wait for the Invitation", authority: "Emotional", items: [{ type: "aspect", headline: "Sun opposite natal Sun", detail: "Orb 1 degree" }], birthDate: "must not pass through" };
assert.ok(!("birthDate" in validateContext(context, now.getTime())));
assert.throws(() => validateContext({ ...context, date: "2026-09-14" }, now.getTime()));
assert.throws(() => validateContext({ ...context, timeZone: "not-a-zone" }, now.getTime()));
assert.throws(() => validateContext({ ...context, items: Array(25).fill(context.items[0]) }, now.getTime()));
assert.equal(validReading({ headline: "Incomplete" }), false);
const oldKey = process.env.OPENAI_API_KEY;
const oldCode = process.env.READING_ACCESS_CODE;
const originalFetch = globalThis.fetch;
function response() {
  return { code: 0, value: null, setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.value = value; return this; } };
}
try {
  delete process.env.OPENAI_API_KEY;
  let res = response();
  await handler({ method: "POST", headers: {}, body: context }, res);
  assert.equal(res.code, 503);
  process.env.OPENAI_API_KEY = "test-only-not-a-real-key";
  process.env.READING_ACCESS_CODE = "test-only-access";
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("Unexpected upstream call"); };
  res = response();
  await handler({ method: "POST", headers: {}, body: context }, res);
  assert.equal(res.code, 401);
  assert.equal(calls, 0);
  res = response();
  await handler({ method: "POST", headers: { "x-reading-access-code": "test-only-access" }, body: { ...context, date: "2000-01-01" } }, res);
  assert.equal(res.code, 400);
  assert.equal(calls, 0);
  const time = new Date();
  const fresh = { ...context, date: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(time), asOf: time.toISOString() };
  const reading = { headline: "A concrete reading", focus: "A concrete question for today", summary: ["a".repeat(60), "b".repeat(60)], sections: Array.from({ length: 3 }, () => ({ title: "A title", evidence: "Named contact", meaning: "Interpretation", practice: "Ask a question" })) };
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    assert.ok(!JSON.parse(body.input).birthDate);
    return { ok: true, json: async () => ({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(reading) }] }] }) };
  };
  res = response();
  await handler({ method: "POST", headers: { "x-reading-access-code": "test-only-access" }, body: fresh }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.value.reading, reading);
  globalThis.fetch = async () => ({ ok: false, status: 429 });
  res = response();
  await handler({ method: "POST", headers: { "x-reading-access-code": "test-only-access" }, body: fresh }, res);
  assert.equal(res.code, 429);
} finally {
  globalThis.fetch = originalFetch;
  if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  if (oldCode === undefined) delete process.env.READING_ACCESS_CODE; else process.env.READING_ACCESS_CODE = oldCode;
}
console.log("Reading API validation, authorization, data minimization, success and provider error checks passed.");
