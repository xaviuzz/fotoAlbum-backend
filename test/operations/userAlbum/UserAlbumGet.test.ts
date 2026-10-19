import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Catalogue } from "../../../src/domain/album/Catalogue.ts";
import { UserAlbumStore } from "../../../src/infrastructure/stores/userAlbum/UserAlbumStore.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import type { Operation } from "../../../src/operations/Operation.ts";
import { UserAlbumCreate } from "../../../src/operations/userAlbum/UserAlbumCreate.ts";
import { UserAlbumGet } from "../../../src/operations/userAlbum/UserAlbumGet.ts";

let sut: SUT;

beforeEach(async () => {
	sut = await SUT.create();
});

afterEach(async () => {
	await sut.discard();
});

test("is named userAlbum.get", () => {
	expect(sut.operationName()).toBe("userAlbum.get");
});

test("answers the user album of the session", async () => {
	await sut.createFor("s-1", "PT-150");

	await sut.get("g-1", "s-1");

	expect(await sut.userAlbum()).toEqual(await sut.created());
});

test("answers USER_ALBUM_NOT_FOUND for a session without one", async () => {
	await sut.get("g-2", "s-1");

	expect(await sut.errorCode()).toBe("USER_ALBUM_NOT_FOUND");
});

test("answers USER_ALBUM_NOT_FOUND for the user album of another session", async () => {
	await sut.createFor("s-1", "PT-150");

	await sut.get("g-3", "s-2");

	expect(await sut.errorCode()).toBe("USER_ALBUM_NOT_FOUND");
});

test("answers SESSION_REQUIRED without a session", async () => {
	await sut.getWithoutSession("g-4");

	expect(await sut.errorCode()).toBe("SESSION_REQUIRED");
});

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "user-album-get-"));
		return new SUT(root);
	}

	private readonly creation: Operation;
	private readonly operation: Operation;
	private response = new Response();
	private createdAlbum: unknown;

	private constructor(private readonly root: string) {
		const store = new UserAlbumStore(root);
		this.creation = new JsonOperation(
			new UserAlbumCreate(Catalogue.seeded(), store),
		);
		this.operation = new JsonOperation(new UserAlbumGet(store));
	}

	async createFor(session: string, reference: string): Promise<void> {
		const request = new Request("http://x/userAlbum.create", {
			method: "POST",
			body: JSON.stringify({
				header: { callId: "c", sessionId: session },
				body: { reference },
			}),
		});
		const response = await this.creation.serve(request);
		const reply = await response.json();
		this.createdAlbum = reply.body.userAlbum;
	}

	async get(callId: string, session: string): Promise<void> {
		await this.send({ header: { callId, sessionId: session } });
	}

	async getWithoutSession(callId: string): Promise<void> {
		await this.send({ header: { callId } });
	}

	operationName(): string {
		return this.operation.name;
	}

	async created(): Promise<unknown> {
		return this.createdAlbum;
	}

	async userAlbum(): Promise<unknown> {
		const reply = await this.response.clone().json();
		return reply.body.userAlbum;
	}

	async errorCode(): Promise<string> {
		const reply = await this.response.clone().json();
		return reply.body.code;
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}

	private async send(message: object): Promise<void> {
		const request = new Request("http://x/userAlbum.get", {
			method: "POST",
			body: JSON.stringify(message),
		});
		this.response = await this.operation.serve(request);
	}
}
