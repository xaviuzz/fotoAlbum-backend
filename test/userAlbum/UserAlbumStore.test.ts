import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Album } from "../../src/album/Album.ts";
import { SessionId } from "../../src/session/SessionId.ts";
import { UserAlbum } from "../../src/userAlbum/UserAlbum.ts";
import { UserAlbumAlreadyExistsError } from "../../src/userAlbum/UserAlbumAlreadyExistsError.ts";
import { UserAlbumNotFoundError } from "../../src/userAlbum/UserAlbumNotFoundError.ts";
import { UserAlbumStore } from "../../src/userAlbum/UserAlbumStore.ts";

let sut: SUT;

beforeEach(async () => {
	sut = await SUT.create();
});

afterEach(async () => {
	await sut.discard();
});

test("finds the user album it saved for a session", async () => {
	await sut.save("s-1");

	expect(await sut.found("s-1")).toEqual(sut.saved());
});

test("finds the user album after a new store instance", async () => {
	await sut.save("s-1");
	sut.restart();

	expect(await sut.found("s-1")).toEqual(sut.saved());
});

test("keeps one user album per session", async () => {
	await sut.save("s-1");
	await sut.save("s-2");

	expect(await sut.found("s-2")).not.toEqual(await sut.found("s-1"));
});

test("does not find a user album for a session without one", async () => {
	await expect(sut.found("s-1")).rejects.toThrow(UserAlbumNotFoundError);
});

test("refuses to save a second user album for the same session", async () => {
	await sut.save("s-1");

	await expect(sut.save("s-1")).rejects.toThrow(UserAlbumAlreadyExistsError);
});

test("keeps the first user album when a second save is refused", async () => {
	await sut.save("s-1");
	const first = sut.saved();
	await sut.save("s-1").catch(() => undefined);

	expect(await sut.found("s-1")).toEqual(first);
});

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "user-album-store-"));
		return new SUT(root);
	}

	private store: UserAlbumStore;
	private lastSaved: UserAlbum | undefined;

	private constructor(private readonly root: string) {
		this.store = new UserAlbumStore(root);
	}

	async save(session: string): Promise<void> {
		this.lastSaved = UserAlbum.from(this.model());
		await this.store.save(SessionId.from(session), this.lastSaved);
	}

	saved(): unknown {
		return this.lastSaved?.toJSON();
	}

	async found(session: string): Promise<unknown> {
		const userAlbum = await this.store.find(SessionId.from(session));
		return userAlbum.toJSON();
	}

	restart(): void {
		this.store = new UserAlbumStore(this.root);
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}

	private model(): Album {
		return Album.of({
			reference: "SQ-210",
			commercialName: "Cuadrado clasico",
			albumSize: { width: 210, height: 210 },
			pageSize: { width: 200, height: 200 },
			pageCount: 24,
			binding: "hardcover",
		});
	}
}
