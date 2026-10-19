import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PhotoId } from "../../src/photo/PhotoId.ts";
import { PhotoNotFoundError } from "../../src/photo/PhotoNotFoundError.ts";
import { PhotoStore } from "../../src/photo/PhotoStore.ts";
import { SessionId } from "../../src/session/SessionId.ts";
import { aPicture } from "./Pictures.ts";

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

test("fails to list when the session folder cannot be read", async () => {
	await sut.blockFolderOf("s-1");

	await expect(sut.photosOf("s-1")).rejects.toThrow();
});

test("lists the stored photos oldest first", async () => {
	await sut.store("s-1", 50);
	await sut.store("s-1", 100);
	await sut.store("s-1", 150);

	expect(await sut.shadesOf("s-1")).toEqual([50, 100, 150]);
});

test("lists nothing for a session that only keeps a user album", async () => {
	await sut.keepUserAlbum("s-1");

	expect(await sut.photosOf("s-1")).toEqual([]);
});

test("lists only the photos of a session that also keeps a user album", async () => {
	const photo = await sut.store("s-1", 50);
	await sut.keepUserAlbum("s-1");

	const photos = await sut.photosOf("s-1");
	expect(photos.map((listed) => listed.id)).toEqual([photo.id]);
});

test("answers each photo with its thumbnail address", async () => {
	await sut.store("s-1", 50);

	const photos = await sut.photosOf("s-1");

	expect(photos[0]?.thumbnailUrl).toBe(
		`/photos/s-1/${photos[0]?.id}/thumbnail`,
	);
});

test("keeps the photos of each session apart", async () => {
	await sut.store("s-1", 50);
	await sut.store("s-2", 100);

	expect(await sut.shadesOf("s-1")).toEqual([50]);
	expect(await sut.shadesOf("s-2")).toEqual([100]);
});

test("keeps photos after a restart", async () => {
	await sut.store("s-1", 50);

	sut.restart();

	expect(await sut.shadesOf("s-1")).toEqual([50]);
});

test("refuses the thumbnail of an unknown photo", async () => {
	await expect(sut.thumbnailById("s-1", PhotoId.generate())).rejects.toThrow(
		PhotoNotFoundError,
	);
});

test("refuses the thumbnail of a photo to another session", async () => {
	const photo = await sut.store("s-1", 50);

	await expect(sut.thumbnailById("s-2", photo.id)).rejects.toThrow(
		PhotoNotFoundError,
	);
});

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "photo-store-"));
		return new SUT(root);
	}

	private readonly shadesByThumbnail = new Map<string, number>();
	private photoStore: PhotoStore;

	private constructor(private readonly root: string) {
		this.photoStore = new PhotoStore(root);
	}

	async store(session: string, shade: number) {
		const picture = await aPicture(shade);
		this.shadesByThumbnail.set(this.keyOf(picture.thumbnail()), shade);
		const photo = await this.photoStore.add(SessionId.from(session), picture);
		return photo;
	}

	async keepUserAlbum(session: string) {
		const folder = SessionId.from(session).pathIn(this.root);
		await mkdir(folder, { recursive: true });
		await writeFile(join(folder, "user-album.json"), "{}");
	}

	async blockFolderOf(session: string) {
		await writeFile(SessionId.from(session).pathIn(this.root), "not a folder");
	}

	async photosOf(session: string) {
		const photos = await this.photoStore.list(SessionId.from(session));
		return photos;
	}

	async shadesOf(session: string): Promise<number[]> {
		const photos = await this.photosOf(session);
		const shades: number[] = [];
		for (const photo of photos) {
			const thumbnail = await this.thumbnailById(session, photo.id);
			shades.push(this.shadesByThumbnail.get(this.keyOf(thumbnail)) as number);
		}
		return shades;
	}

	async thumbnailById(session: string, photoId: PhotoId): Promise<Uint8Array> {
		return this.photoStore.thumbnailOf(SessionId.from(session), photoId);
	}

	private keyOf(thumbnail: Uint8Array): string {
		return Buffer.from(thumbnail).toString("base64");
	}

	restart(): void {
		this.photoStore = new PhotoStore(this.root);
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}
}
