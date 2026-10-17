import { afterAll, beforeAll, expect, test } from "bun:test";
import { Server } from "../src/server.ts";

let sut: SUT;

beforeAll(() => {
	sut = new SUT();
});

afterAll(() => sut.stop());

test("POST /health.check answers 200 ok end to end", async () => {
	await sut.callHealthCheck("e-1");

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "e-1", status: "ok" },
		body: { status: "ok" },
	});
});

test("an unknown URL answers 404", async () => {
	await sut.callUnknownUrl();

	expect(sut.status()).toBe(404);
});

class SUT {
	private readonly server = Server.start(0);
	private response = new Response();

	async callHealthCheck(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		await this.post("health.check", payload);
	}

	async callUnknownUrl(): Promise<void> {
		await this.post("nothing.here", "{}");
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<unknown> {
		const reply = await this.response.json();
		return reply;
	}

	stop(): void {
		this.server.stop();
	}

	private async post(path: string, payload: string): Promise<void> {
		this.response = await fetch(`${this.server.url}${path}`, {
			method: "POST",
			body: payload,
		});
	}
}
