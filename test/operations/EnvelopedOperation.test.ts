import { expect, test } from "bun:test";
import { EnvelopedOperation } from "../../src/operations/EnvelopedOperation.ts";
import { InvalidRequestError } from "../../src/operations/InvalidRequestError.ts";

class EchoOperation extends EnvelopedOperation {
	readonly name = "test.echo";

	protected validate(body: Record<string, unknown>): void {
		if (typeof body.text !== "string") {
			throw new InvalidRequestError("text is required");
		}
	}

	protected async execute(body: Record<string, unknown>): Promise<unknown> {
		if (body.text === "crash") {
			throw new Error("boom");
		}
		return { text: body.text };
	}
}

function post(payload: string): Request {
	return new Request("http://x/test.echo", { method: "POST", body: payload });
}

test("answers 200 ok echoing the request id", async () => {
	const payload = JSON.stringify({
		header: { requestId: "r-1" },
		body: { text: "hi" },
	});

	const response = await new EchoOperation().serve(post(payload));

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		header: { requestId: "r-1", status: "ok" },
		body: { text: "hi" },
	});
});

test("answers 400 when the JSON is unreadable", async () => {
	const response = await new EchoOperation().serve(post("{not json"));

	expect(response.status).toBe(400);
});

test("answers 400 when the request id is missing", async () => {
	const payload = JSON.stringify({ header: {}, body: { text: "hi" } });

	const response = await new EchoOperation().serve(post(payload));

	expect(response.status).toBe(400);
});

test("answers 200 INVALID_REQUEST when the body is invalid", async () => {
	const payload = JSON.stringify({ header: { requestId: "r-2" }, body: {} });

	const response = await new EchoOperation().serve(post(payload));

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		header: { requestId: "r-2", status: "error" },
		body: { code: "INVALID_REQUEST", message: "text is required" },
	});
});

test("answers 200 INTERNAL_ERROR when execution fails", async () => {
	const payload = JSON.stringify({
		header: { requestId: "r-3" },
		body: { text: "crash" },
	});

	const response = await new EchoOperation().serve(post(payload));

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		header: { requestId: "r-3", status: "error" },
		body: { code: "INTERNAL_ERROR", message: "internal error" },
	});
});
