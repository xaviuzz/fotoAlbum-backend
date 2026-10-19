import { expect, test } from "bun:test";
import { UnreadableCall } from "../../src/call/UnreadableCall.ts";

test("answers 400 INVALID_BODY with its message", async () => {
	const unreadable = new UnreadableCall("call is not readable JSON");

	const response = unreadable.toResponse();

	expect(response.status).toBe(400);
	expect(await response.json()).toEqual({
		code: "INVALID_BODY",
		message: "call is not readable JSON",
	});
});
