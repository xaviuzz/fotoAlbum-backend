import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
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

test("a photo uploaded to a session is listed and its thumbnail is served", async () => {
	await sut.uploadPhoto("e-2", "s-1");
	const address = await sut.firstThumbnailAddress("e-3", "s-1");

	await sut.getThumbnail(address);

	expect(sut.status()).toBe(200);
	expect(sut.contentType()).toBe("image/jpeg");
});

class SUT {
	private readonly dataDir = mkdtempSync(join(tmpdir(), "server-"));
	private readonly server = Server.start(0, this.dataDir);
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

	async uploadPhoto(callId: string, session: string): Promise<void> {
		const blank = sharp({
			create: { width: 600, height: 300, channels: 3, background: "red" },
		});
		const bytes = await blank.png().toBuffer();
		const form = new FormData();
		form.set("callId", callId);
		form.set("sessionId", session);
		form.append("files", new File([bytes], "red.png"));
		this.response = await fetch(`${this.server.url}photo.upload`, {
			method: "POST",
			body: form,
		});
	}

	async firstThumbnailAddress(
		callId: string,
		session: string,
	): Promise<string> {
		const payload = JSON.stringify({
			header: { callId, sessionId: session },
		});
		await this.post("photo.list", payload);
		const reply = await this.response.json();
		return reply.body.photos[0].thumbnailUrl;
	}

	async getThumbnail(address: string): Promise<void> {
		this.response = await fetch(`${this.server.url}${address.slice(1)}`);
	}

	contentType(): string | null {
		return this.response.headers.get("content-type");
	}

	stop(): void {
		this.server.stop();
		rmSync(this.dataDir, { recursive: true, force: true });
	}

	private async post(path: string, payload: string): Promise<void> {
		this.response = await fetch(`${this.server.url}${path}`, {
			method: "POST",
			body: payload,
		});
	}
}
