import { expect, test } from "bun:test";
import type { Body } from "../../src/call/Body.ts";
import { CallOperation } from "../../src/operations/CallOperation.ts";

class EchoOperation extends CallOperation {
	readonly name = "test.echo";

	protected validate(body: Body): void {
		body.requireText("text");
	}

	protected async execute(body: Body): Promise<unknown> {
		const text = body.requireText("text");
		if (text === "crash") {
			throw new Error("boom");
		}
		return { text };
	}
}

function post(payload: string): Request {
	return new Request("http://x/test.echo", { method: "POST", body: payload });
}

test("answers 200 ok echoing the call id", async () => {
	const payload = JSON.stringify({
		header: { callId: "r-1" },
		body: { text: "hi" },
	});

	const response = await new EchoOperation().serve(post(payload));

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		header: { callId: "r-1", status: "ok" },
		body: { text: "hi" },
	});
});

test("answers 400 when the JSON is unreadable", async () => {
	const response = await new EchoOperation().serve(post("{not json"));

	expect(response.status).toBe(400);
});

test("answers 400 when the call id is missing", async () => {
	const payload = JSON.stringify({ header: {}, body: { text: "hi" } });

	const response = await new EchoOperation().serve(post(payload));

	expect(response.status).toBe(400);
});

test("answers 200 INVALID_BODY when the body is invalid", async () => {
	const payload = JSON.stringify({ header: { callId: "r-2" }, body: {} });

	const response = await new EchoOperation().serve(post(payload));

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		header: { callId: "r-2", status: "error" },
		body: { code: "INVALID_BODY", message: "text is required" },
	});
});

test("answers 200 INTERNAL_ERROR when execution fails", async () => {
	const payload = JSON.stringify({
		header: { callId: "r-3" },
		body: { text: "crash" },
	});

	const response = await new EchoOperation().serve(post(payload));

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		header: { callId: "r-3", status: "error" },
		body: { code: "INTERNAL_ERROR", message: "internal error" },
	});
});
