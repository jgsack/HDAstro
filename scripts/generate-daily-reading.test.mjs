import test from "node:test";
import assert from "node:assert/strict";
import { dailyDate, generate, validateReading } from "./generate-daily-reading.mjs";

const sentence = "Consider how this specific contact might affect your choices today without assuming it predicts any particular external event or circumstance. ";
const valid = { headline: "A specific daily interpretation", summary: [sentence.repeat(2), sentence.repeat(2)], focus: sentence, sections: Array.from({ length: 3 }, () => ({ title: "A concrete chart theme", evidence: sentence, meaning: sentence.repeat(3), practice: sentence })) };
const context = { date: dailyDate(), chartFingerprint: "test-chart", astrologyTransits: [{ id: "real-contact", headline: "A real calculated chart contact", detail: "This detail is copied from the calculated chart source." }], humanDesignTransits: [{}] };
test("Pacific date respects midnight boundary", () => assert.equal(dailyDate(new Date("2026-09-16T06:59:00Z")), "2026-09-15"));
test("rejects empty and superficial readings", () => {
  assert.throws(() => validateReading({}));
  assert.throws(() => validateReading({ ...valid, sections: [{ title: "vague" }] }));
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
    return { ok: true, json: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ ...valid, sections: valid.sections.map(s => ({ ...s, sourceIds: ["real-contact"] })), date: "wrong", chartFingerprint: "wrong" }) } }] }) };
  });
  assert.equal(result.date, context.date);
  assert.equal(result.chartFingerprint, context.chartFingerprint);
  assert.match(result.sections[0].evidence, /copied from the calculated/);
});
test("rejects invented evidence and deterministic claims", async () => {
  const respond = draft => async () => ({ ok: true, json: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(draft) } }] }) });
  await assert.rejects(generate(context, "test", respond({ ...valid, headline: "A fated change in direction" })), /deterministic/);
  await assert.rejects(generate(context, "test", respond({ ...valid, sections: valid.sections.map(s => ({ ...s, sourceIds: ["invented"] })) })), /Unknown chart/);
});
