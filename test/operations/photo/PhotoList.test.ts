import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SessionId } from "../../../src/domain/session/SessionId.ts";
import { PhotoStore } from "../../../src/infrastructure/stores/photo/PhotoStore.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import type { Operation } from "../../../src/operations/Operation.ts";
import { PhotoList } from "../../../src/operations/photo/PhotoList.ts";
import { aPicture } from "../../infrastructure/imaging/Pictures.ts";

let sut: SUT;

beforeEach(async () => {
	sut = await SUT.create();
});

afterEach(async () => {
	await sut.discard();
});

test("is named photo.list", () => {
	expect(sut.operationName()).toBe("photo.list");
});

test("answers no photos for a new session", async () => {
	await sut.list("l-1", "s-1");

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "l-1", status: "ok" },
		body: { photos: [] },
	});
});

test("answers the photos of the session, oldest first", async () => {
	const first = await sut.keepPhoto("s-1");
	const second = await sut.keepPhoto("s-1");
	await sut.keepPhoto("s-2");

	await sut.list("l-2", "s-1");

	expect(await sut.photos()).toEqual([
		{ id: first, thumbnailUrl: `/photos/s-1/${first}/thumbnail` },
		{ id: second, thumbnailUrl: `/photos/s-1/${second}/thumbnail` },
	]);
});

test("answers SESSION_REQUIRED without a session", async () => {
	await sut.listWithoutSession("l-3");

	expect(await sut.errorCode()).toBe("SESSION_REQUIRED");
});

test("answers SESSION_REQUIRED for a session that is not safe as a folder", async () => {
	await sut.list("l-4", "../other");

	expect(await sut.errorCode()).toBe("SESSION_REQUIRED");
});

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "photo-list-"));
		return new SUT(root);
	}

	private readonly store: PhotoStore;
	private readonly operation: Operation;
	private response = new Response();

	private constructor(private readonly root: string) {
		this.store = new PhotoStore(root);
		this.operation = new JsonOperation(new PhotoList(this.store));
	}

	async keepPhoto(session: string): Promise<string> {
		const picture = await aPicture(100);
		const photo = await this.store.add(SessionId.from(session), picture);
		return photo.id.toString();
	}

	async list(callId: string, session: string): Promise<void> {
		await this.send({ header: { callId, sessionId: session } });
	}

	async listWithoutSession(callId: string): Promise<void> {
		await this.send({ header: { callId } });
	}

	operationName(): string {
		return this.operation.name;
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<unknown> {
		const reply = await this.response.clone().json();
		return reply;
	}

	async photos(): Promise<unknown> {
		const reply = await this.response.clone().json();
		return reply.body.photos;
	}

	async errorCode(): Promise<string> {
		const reply = await this.response.clone().json();
		return reply.body.code;
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}

	private async send(message: object): Promise<void> {
		const request = new Request("http://x/photo.list", {
			method: "POST",
			body: JSON.stringify(message),
		});
		this.response = await this.operation.serve(request);
	}
}
