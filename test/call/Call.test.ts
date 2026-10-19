import { expect, test } from "bun:test";
import { Call } from "../../src/call/Call.ts";
import { InvalidBodyError } from "../../src/call/InvalidBodyError.ts";
import { InvalidCallError } from "../../src/call/InvalidCallError.ts";
import { SessionRequiredError } from "../../src/session/SessionRequiredError.ts";

test("reads the body", () => {
	const raw = { header: { callId: "abc-1" }, body: { name: "x" } };

	const call = Call.from(raw);

	expect(call.body.requireText("name")).toBe("x");
});

test("rejects a call without call id", () => {
	const raw = { header: {}, body: {} };

	expect(() => Call.from(raw)).toThrow(InvalidCallError);
});

test("rejects a call without header", () => {
	const raw = { body: {} };

	expect(() => Call.from(raw)).toThrow(InvalidCallError);
});

test("rejects a call id that is not text", () => {
	const raw = { header: { callId: 7 }, body: {} };

	expect(() => Call.from(raw)).toThrow(InvalidCallError);
});

test("rejects an empty call id", () => {
	const raw = { header: { callId: "" }, body: {} };

	expect(() => Call.from(raw)).toThrow(InvalidCallError);
});

test("rejects a payload that is not an object", () => {
	expect(() => Call.from("hello")).toThrow(InvalidCallError);
	expect(() => Call.from(null)).toThrow(InvalidCallError);
});

test("defaults a missing body to an empty object", () => {
	const raw = { header: { callId: "abc-1" } };

	const call = Call.from(raw);

	expect(() => call.body.requireText("name")).toThrow(InvalidBodyError);
});

test("answers with its call id", () => {
	const raw = { header: { callId: "abc-1" } };

	const call = Call.from(raw);

	expect(call.ok({ n: 1 }).toJSON()).toEqual({
		header: { callId: "abc-1", status: "ok" },
		body: { n: 1 },
	});
});

test("fails with its call id", () => {
	const raw = { header: { callId: "abc-1" } };

	const call = Call.from(raw);

	expect(call.failure("INVALID_BODY", "bad").toJSON()).toEqual({
		header: { callId: "abc-1", status: "error" },
		body: { code: "INVALID_BODY", message: "bad" },
	});
});

test("requires the session id of its header", () => {
	const raw = { header: { callId: "abc-1", sessionId: "s-1" } };

	const call = Call.from(raw);

	expect(call.requireSession().pathIn("/data")).toBe("/data/s-1");
});

test("fails when the header has no session id", () => {
	const raw = { header: { callId: "abc-1" } };

	const call = Call.from(raw);

	expect(() => call.requireSession()).toThrow(SessionRequiredError);
});

test("fails with the code of a call error", () => {
	const raw = { header: { callId: "abc-1" } };
	const call = Call.from(raw);

	const reply = call.failureFrom(new SessionRequiredError("session required"));

	expect(reply.toJSON()).toEqual({
		header: { callId: "abc-1", status: "error" },
		body: { code: "SESSION_REQUIRED", message: "session required" },
	});
});

test("fails as internal error when the error is not a call error", () => {
	const raw = { header: { callId: "abc-1" } };
	const call = Call.from(raw);

	const reply = call.failureFrom(new Error("boom"));

	expect(reply.toJSON()).toEqual({
		header: { callId: "abc-1", status: "error" },
		body: { code: "INTERNAL_ERROR", message: "internal error" },
	});
});
