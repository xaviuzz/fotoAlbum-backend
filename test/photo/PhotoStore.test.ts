import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PhotoStore } from "../../src/photo/PhotoStore.ts";
import { SessionId } from "../../src/session/SessionId.ts";

let sut: SUT;

beforeEach(async () => {
	sut = await SUT.create();
});

afterEach(async () => {
	await sut.discard();
});

test("lists nothing for a session without photos", async () => {
	expect(await sut.photosOf("s-1")).toEqual([]);
});

test("lists the stored photos oldest first", async () => {
	await sut.store("s-1", "first");
	await sut.store("s-1", "second");
	await sut.store("s-1", "third");

	expect(await sut.thumbnailsOf("s-1")).toEqual(["first", "second", "third"]);
});

test("answers each photo with its thumbnail address", async () => {
	await sut.store("s-1", "first");

	const photos = await sut.photosOf("s-1");

	expect(photos[0]?.thumbnailUrl).toBe(
		`/photos/s-1/${photos[0]?.id}/thumbnail`,
	);
});

test("keeps the photos of each session apart", async () => {
	await sut.store("s-1", "mine");
	await sut.store("s-2", "yours");

	expect(await sut.thumbnailsOf("s-1")).toEqual(["mine"]);
	expect(await sut.thumbnailsOf("s-2")).toEqual(["yours"]);
});

test("keeps photos after a restart", async () => {
	await sut.store("s-1", "kept");

	sut.restart();

	expect(await sut.thumbnailsOf("s-1")).toEqual(["kept"]);
});

test("gives no thumbnail for an unknown photo", async () => {
	expect(await sut.thumbnailById("s-1", "nope")).toBeUndefined();
});

test("gives no thumbnail for an id that could leave its folder", async () => {
	await sut.store("s-1", "first");

	expect(await sut.thumbnailById("s-1", "../s-1")).toBeUndefined();
});

test("gives no thumbnail of a photo to another session", async () => {
	const photo = await sut.store("s-1", "mine");

	expect(await sut.thumbnailById("s-2", photo.id)).toBeUndefined();
});

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "photo-store-"));
		return new SUT(root);
	}

	private photoStore: PhotoStore;

	private constructor(private readonly root: string) {
		this.photoStore = new PhotoStore(root);
	}

	async store(session: string, thumbnailText: string) {
		const original = new TextEncoder().encode(`original of ${thumbnailText}`);
		const thumbnail = new TextEncoder().encode(thumbnailText);
		const photo = await this.photoStore.add(
			SessionId.from(session),
			{ bytes: original, extension: "jpg" },
			thumbnail,
		);
		return photo;
	}

	async photosOf(session: string) {
		const photos = await this.photoStore.list(SessionId.from(session));
		return photos;
	}

	async thumbnailsOf(session: string): Promise<string[]> {
		const photos = await this.photosOf(session);
		const texts: string[] = [];
		for (const photo of photos) {
			const text = await this.thumbnailById(session, photo.id);
			texts.push(text as string);
		}
		return texts;
	}

	async thumbnailById(
		session: string,
		photoId: string,
	): Promise<string | undefined> {
		const bytes = await this.photoStore.thumbnailOf(
			SessionId.from(session),
			photoId,
		);
		let text: string | undefined;
		if (bytes !== undefined) {
			text = new TextDecoder().decode(bytes);
		}
		return text;
	}

	restart(): void {
		this.photoStore = new PhotoStore(this.root);
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}
}
