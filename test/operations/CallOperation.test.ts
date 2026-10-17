import { beforeEach, expect, test } from "bun:test";
import type { Body } from "../../src/call/Body.ts";
import { CallOperation } from "../../src/operations/CallOperation.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("answers 200 ok echoing the call id", async () => {
	await sut.call("r-1", { text: "hi" });

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "r-1", status: "ok" },
		body: { text: "hi" },
	});
});

test("answers 400 when the JSON is unreadable", async () => {
	await sut.sendUnreadableJson();

	expect(sut.status()).toBe(400);
});

test("answers 400 when the call id is missing", async () => {
	await sut.callWithoutCallId({ text: "hi" });

	expect(sut.status()).toBe(400);
});

test("answers 200 INVALID_BODY when the body is invalid", async () => {
	await sut.call("r-2", {});

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "r-2", status: "error" },
		body: { code: "INVALID_BODY", message: "text is required" },
	});
});

test("answers 200 INTERNAL_ERROR when execution fails", async () => {
	await sut.call("r-3", { text: "crash" });

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "r-3", status: "error" },
		body: { code: "INTERNAL_ERROR", message: "internal error" },
	});
});

class SUT {
	private readonly operation = new EchoOperation();
	private response = new Response();

	async call(callId: string, body: object): Promise<void> {
		const payload = JSON.stringify({ header: { callId }, body });
		await this.send(payload);
	}

	async callWithoutCallId(body: object): Promise<void> {
		const payload = JSON.stringify({ header: {}, body });
		await this.send(payload);
	}

	async sendUnreadableJson(): Promise<void> {
		await this.send("{not json");
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<unknown> {
		const reply = await this.response.json();
		return reply;
	}

	private async send(payload: string): Promise<void> {
		const request = new Request("http://x/test.echo", {
			method: "POST",
			body: payload,
		});
		this.response = await this.operation.serve(request);
	}
}

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
