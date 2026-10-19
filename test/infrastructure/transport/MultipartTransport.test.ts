import { beforeEach, expect, test } from "bun:test";
import type { Call } from "../../../src/call/Call.ts";
import { InvalidBodyError } from "../../../src/call/InvalidBodyError.ts";
import { MultipartTransport } from "../../../src/infrastructure/transport/MultipartTransport.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("hands the files and the session to the handler", async () => {
	sut.attach("one.txt");
	sut.attach("two.txt");

	await sut.send("m-1", "s-1");

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "m-1", status: "ok" },
		body: { session: "s-1", names: ["one.txt", "two.txt"] },
	});
});

test("answers 400 when the call id is missing", async () => {
	sut.attach("one.txt");

	await sut.sendWithoutCallId();

	expect(sut.status()).toBe(400);
	expect(await sut.reply()).toEqual({
		code: "INVALID_BODY",
		message: "call is not a readable form",
	});
});

test("answers 400 when the body is not a form", async () => {
	await sut.sendNotAForm();

	expect(sut.status()).toBe(400);
});

test("answers 200 with the code of a call error", async () => {
	await sut.send("m-2", "s-1");

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "m-2", status: "error" },
		body: { code: "INVALID_BODY", message: "files is required" },
	});
});

test("answers 200 INTERNAL_ERROR when the handler fails", async () => {
	sut.attach("crash");

	await sut.send("m-3", "s-1");

	expect(await sut.reply()).toEqual({
		header: { callId: "m-3", status: "error" },
		body: { code: "INTERNAL_ERROR", message: "internal error" },
	});
});

class SUT {
	private readonly transport = new MultipartTransport();
	private readonly handler = new NamesHandler();
	private readonly form = new FormData();
	private response = new Response();

	attach(name: string): void {
		this.form.append("files", new File(["x"], name));
	}

	async send(callId: string, sessionId: string): Promise<void> {
		this.form.set("callId", callId);
		this.form.set("sessionId", sessionId);
		await this.serve(this.form);
	}

	async sendWithoutCallId(): Promise<void> {
		await this.serve(this.form);
	}

	async sendNotAForm(): Promise<void> {
		const request = new Request("http://x/test.names", {
			method: "POST",
			body: "plain",
		});
		this.response = await this.transport.serve(request, this.handler);
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<unknown> {
		const reply = await this.response.json();
		return reply;
	}

	private async serve(form: FormData): Promise<void> {
		const request = new Request("http://x/test.names", {
			method: "POST",
			body: form,
		});
		this.response = await this.transport.serve(request, this.handler);
	}
}

class NamesHandler {
	readonly name = "test.names";

	async execute(call: Call, files: File[]): Promise<unknown> {
		if (files.length === 0) {
			throw new InvalidBodyError("files is required");
		}
		const names = files.map((file) => file.name);
		if (names.includes("crash")) {
			throw new Error("boom");
		}
		const session = call.requireSession().toString();
		return { session, names };
	}
}
