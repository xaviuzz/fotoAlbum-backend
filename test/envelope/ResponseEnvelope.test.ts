import { expect, test } from "bun:test";
import { ResponseEnvelope } from "../../src/envelope/ResponseEnvelope.ts";

test("an ok response echoes the request id and carries the body", () => {
	const response = ResponseEnvelope.ok("abc-1", { status: "ok" });

	expect(response.toJSON()).toEqual({
		header: { requestId: "abc-1", status: "ok" },
		body: { status: "ok" },
	});
});

test("an error response replaces the body with code and message", () => {
	const response = ResponseEnvelope.failure(
		"abc-1",
		"INVALID_REQUEST",
		"name is required",
	);

	expect(response.toJSON()).toEqual({
		header: { requestId: "abc-1", status: "error" },
		body: { code: "INVALID_REQUEST", message: "name is required" },
	});
});

test("serializes as JSON text", () => {
	const response = ResponseEnvelope.failure("r", "INTERNAL_ERROR", "boom");

	const text = JSON.stringify(response);

	expect(JSON.parse(text).header.status).toBe("error");
});
