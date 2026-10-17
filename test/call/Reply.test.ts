import { expect, test } from "bun:test";
import { Reply } from "../../src/call/Reply.ts";

test("an ok reply echoes the call id and carries the body", () => {
	const reply = Reply.ok("abc-1", { status: "ok" });

	expect(reply.toJSON()).toEqual({
		header: { callId: "abc-1", status: "ok" },
		body: { status: "ok" },
	});
});

test("an error reply replaces the body with code and message", () => {
	const reply = Reply.failure("abc-1", "INVALID_BODY", "name is required");

	expect(reply.toJSON()).toEqual({
		header: { callId: "abc-1", status: "error" },
		body: { code: "INVALID_BODY", message: "name is required" },
	});
});

test("serializes as JSON text", () => {
	const reply = Reply.failure("r", "INTERNAL_ERROR", "boom");

	const text = JSON.stringify(reply);

	expect(JSON.parse(text).header.status).toBe("error");
});
