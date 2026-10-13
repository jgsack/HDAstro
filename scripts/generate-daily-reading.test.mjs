import test from "node:test";
import assert from "node:assert/strict";
import { dailyDate, generate, validateReading } from "./generate-daily-reading.mjs";

const sentence = "Consider how this specific contact might affect your choices today without assuming it predicts any particular external event or circumstance. ";
const valid = { summary: [sentence.repeat(8)], sourceIds: ["real-contact", "real-gate"] };
const context = { date: dailyDate(), chartFingerprint: "test-chart", astrologyTransits: [{ id: "real-contact", headline: "A real calculated chart contact", detail: "This detail is copied from the calculated chart source." }], humanDesignTransits: [{ id: "real-gate", headline: "A real Human Design activation", detail: "A supplied natal gate is activated today." }] };
test("Pacific date respects midnight boundary", () => assert.equal(dailyDate(new Date("2026-09-16T06:59:00Z")), "2026-09-15"));
test("rejects empty and superficial readings", () => {
  assert.throws(() => validateReading({}));
  assert.throws(() => validateReading({ ...valid, summary: ["vague"] }));
});
test("fails closed without credential or fresh context", async () => {
  await assert.rejects(generate(context, ""), /missing/);
  await assert.rejects(generate({ ...context, date: "2000-01-01" }, "test"), /stale/);
});
test("requires complete successful provider output", async () => {
  await assert.rejects(generate(context, "test", async () => ({ ok: false, status: 429 })), /429/);
  await assert.rejects(generate(context, "test", async () => ({ ok: true, json: async () => ({ choices: [{ finish_reason: "length" }] }) })), /incomplete/);
});
test("validates output and uses trusted chart metadata", async () => {
  const result = await generate(context, "test", async (url, options) => {
    assert.equal(url, "https://api.deepseek.com/chat/completions");
    assert.equal(options.headers.Authorization, "Bearer test");
    assert.equal(JSON.parse(options.body).response_format.type, "json_object");
    return { ok: true, json: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ ...valid, date: "wrong", chartFingerprint: "wrong" }) } }] }) };
  });
  assert.equal(result.date, context.date);
  assert.equal(result.chartFingerprint, context.chartFingerprint);
  assert.match(result.evidence, /copied from the calculated/);
});
test("rejects invented evidence and deterministic claims", async () => {
  const respond = draft => async () => ({ ok: true, json: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(draft) } }] }) });
  await assert.rejects(generate(context, "test", respond({ ...valid, summary: [sentence.repeat(8) + " A fated change in direction."] })), /deterministic/);
  await assert.rejects(generate(context, "test", respond({ ...valid, sourceIds: ["invented", "real-gate"] })), /Unknown chart/);
});
test("repairs missing references with a consistent prompt and bounded feedback", async () => {
  let calls = 0;
  const result = await generate(context, "test", async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.match(body.messages[0].content, /"sourceIds":\[/);
    assert.doesNotMatch(body.messages[0].content, /"evidence":/);
    calls++;
    if (calls === 2) {
      assert.equal(body.messages.at(-2).role, "assistant");
      assert.match(body.messages.at(-1).content, /failed validation.*sourceIds/);
    }
    const draft = calls === 1 ? { summary: valid.summary } : valid;
    return { ok: true, json: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(draft) } }] }) };
  });
  assert.equal(calls, 2);
  assert.match(result.evidence, /calculated chart source/);
});
test("stops after three invalid responses without accepting ungrounded content", async () => {
  let calls = 0;
  await assert.rejects(generate(context, "test", async () => {
    calls++;
    return { ok: true, json: async () => ({ choices: [{ finish_reason: "stop", message: { content: "{invalid" } }] }) };
  }), /after 3 attempts: Response must be valid JSON/);
  assert.equal(calls, 3);
});
test("does not retry provider authentication or billing failures", async () => {
  let calls = 0;
  await assert.rejects(generate(context, "test", async () => {
    calls++;
    return { ok: false, status: 401 };
  }), /HTTP 401/);
  assert.equal(calls, 1);
});

test("rejects multiple paragraphs and separate issue sections", () => {
  assert.throws(() => validateReading({ ...valid, summary: [sentence.repeat(8), sentence.repeat(8)] }));
  assert.throws(() => validateReading({ ...valid, summary: [sentence.repeat(8) + "\nAnother paragraph."] }));
  assert.throws(() => validateReading({ ...valid, sections: [{ title: "Separate issue" }] }));
});

