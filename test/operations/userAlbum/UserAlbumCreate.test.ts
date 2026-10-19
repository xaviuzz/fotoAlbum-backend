import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Catalogue } from "../../../src/domain/album/Catalogue.ts";
import { SessionId } from "../../../src/domain/session/SessionId.ts";
import { UserAlbumStore } from "../../../src/infrastructure/stores/userAlbum/UserAlbumStore.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import type { Operation } from "../../../src/operations/Operation.ts";
import { UserAlbumCreate } from "../../../src/operations/userAlbum/UserAlbumCreate.ts";

let sut: SUT;

beforeEach(async () => {
	sut = await SUT.create();
});

afterEach(async () => {
	await sut.discard();
});

test("is named userAlbum.create", () => {
	expect(sut.operationName()).toBe("userAlbum.create");
});

test("answers a user album copied from the model", async () => {
	await sut.create("c-1", "s-1", "PT-150");

	expect(sut.status()).toBe(200);
	expect(await sut.userAlbum()).toMatchObject({
		reference: "PT-150",
		commercialName: "Retrato de bolsillo",
		albumSize: { width: 150, height: 210 },
		pageSize: { width: 140, height: 200 },
		pageCount: 20,
		binding: "softcover",
		orientation: "portrait",
	});
});

test("keeps the user album for the session", async () => {
	await sut.create("c-2", "s-1", "PT-150");

	expect(await sut.kept("s-1")).toEqual(await sut.userAlbum());
});

test("accepts the reference whatever the capitals", async () => {
	await sut.create("c-3", "s-1", "pt-150");

	expect(((await sut.userAlbum()) as { reference: string }).reference).toBe(
		"PT-150",
	);
});

test("answers ALBUM_NOT_FOUND for an unknown model", async () => {
	await sut.create("c-4", "s-1", "XX-000");

	expect(await sut.errorCode()).toBe("ALBUM_NOT_FOUND");
});

test("answers USER_ALBUM_ALREADY_EXISTS for a session that has one", async () => {
	await sut.create("c-5", "s-1", "PT-150");

	await sut.create("c-6", "s-1", "SQ-210");

	expect(await sut.errorCode()).toBe("USER_ALBUM_ALREADY_EXISTS");
	expect(await sut.keptReference("s-1")).toBe("PT-150");
});

test("lets another session create its own", async () => {
	await sut.create("c-7", "s-1", "PT-150");

	await sut.create("c-8", "s-2", "SQ-210");

	expect(sut.status()).toBe(200);
});

test("answers ALBUM_NOT_FOUND before USER_ALBUM_ALREADY_EXISTS", async () => {
	await sut.create("c-9", "s-1", "PT-150");

	await sut.create("c-10", "s-1", "XX-000");

	expect(await sut.errorCode()).toBe("ALBUM_NOT_FOUND");
});

test("answers SESSION_REQUIRED without a session", async () => {
	await sut.createWithoutSession("c-11", "PT-150");

	expect(await sut.errorCode()).toBe("SESSION_REQUIRED");
});

test("answers INVALID_BODY without a reference", async () => {
	await sut.createWithoutReference("c-12", "s-1");

	expect(await sut.errorCode()).toBe("INVALID_BODY");
});

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "user-album-create-"));
		return new SUT(root);
	}

	private readonly store: UserAlbumStore;
	private readonly operation: Operation;
	private response = new Response();

	private constructor(private readonly root: string) {
		this.store = new UserAlbumStore(root);
		this.operation = new JsonOperation(
			new UserAlbumCreate(Catalogue.seeded(), this.store),
		);
	}

	async create(
		callId: string,
		session: string,
		reference: string,
	): Promise<void> {
		await this.send({
			header: { callId, sessionId: session },
			body: { reference },
		});
	}

	async createWithoutSession(callId: string, reference: string): Promise<void> {
		await this.send({ header: { callId }, body: { reference } });
	}

	async createWithoutReference(callId: string, session: string): Promise<void> {
		await this.send({ header: { callId, sessionId: session }, body: {} });
	}

	operationName(): string {
		return this.operation.name;
	}

	status(): number {
		return this.response.status;
	}

	async userAlbum(): Promise<unknown> {
		const reply = await this.response.clone().json();
		return reply.body.userAlbum;
	}

	async errorCode(): Promise<string> {
		const reply = await this.response.clone().json();
		return reply.body.code;
	}

	async kept(session: string): Promise<unknown> {
		const userAlbum = await this.store.find(SessionId.from(session));
		return userAlbum.toJSON();
	}

	async keptReference(session: string): Promise<string> {
		const kept = (await this.kept(session)) as { reference: string };
		return kept.reference;
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}

	private async send(message: object): Promise<void> {
		const request = new Request("http://x/userAlbum.create", {
			method: "POST",
			body: JSON.stringify(message),
		});
		this.response = await this.operation.serve(request);
	}
}
