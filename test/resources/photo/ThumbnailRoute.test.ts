import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SessionId } from "../../../src/domain/session/SessionId.ts";
import { PhotoStore } from "../../../src/infrastructure/stores/photo/PhotoStore.ts";
import { ThumbnailRoute } from "../../../src/resources/photo/ThumbnailRoute.ts";
import { aPicture } from "../../infrastructure/imaging/Pictures.ts";

let sut: SUT;

beforeEach(async () => {
	sut = await SUT.create();
});

afterEach(async () => {
	await sut.discard();
});

test("serves a thumbnail as an immutable JPEG", async () => {
	const kept = await sut.keepPhoto("s-1", 100);

	await sut.get(`/photos/s-1/${kept.id}/thumbnail`);

	expect(sut.status()).toBe(200);
	expect(sut.header("content-type")).toBe("image/jpeg");
	expect(sut.header("cache-control")).toBe(
		"public, max-age=31536000, immutable",
	);
	expect(await sut.bytes()).toEqual(kept.thumbnail);
});

test("answers 404 for an unknown photo", async () => {
	await sut.get("/photos/s-1/0190a000-0000-7000-8000-000000000000/thumbnail");

	expect(sut.status()).toBe(404);
});

test("answers 404 for the photo of another session", async () => {
	const kept = await sut.keepPhoto("s-1", 100);

	await sut.get(`/photos/s-2/${kept.id}/thumbnail`);

	expect(sut.status()).toBe(404);
});

test("answers 404 for a session that is not safe as a folder", async () => {
	await sut.get("/photos/%2e%2e/x/thumbnail");

	expect(sut.status()).toBe(404);
});

test("answers 404 for a photo id that is not well formed", async () => {
	await sut.get("/photos/s-1/nope/thumbnail");

	expect(sut.status()).toBe(404);
});

test("is served under the thumbnail path pattern", () => {
	expect(sut.path()).toBe("/photos/:sessionId/:photoId/thumbnail");
});

type Kept = { id: string; thumbnail: Uint8Array };

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "thumbnail-route-"));
		return new SUT(root);
	}

	private readonly store: PhotoStore;
	private readonly route: ThumbnailRoute;
	private response = new Response();

	private constructor(private readonly root: string) {
		this.store = new PhotoStore(root);
		this.route = new ThumbnailRoute(this.store);
	}

	async keepPhoto(session: string, shade: number): Promise<Kept> {
		const picture = await aPicture(shade);
		const photo = await this.store.add(SessionId.from(session), picture);
		return { id: photo.id.toString(), thumbnail: picture.thumbnail() };
	}

	async get(path: string): Promise<void> {
		this.response = await this.route.serve(new Request(`http://x${path}`));
	}

	path(): string {
		return this.route.path;
	}

	status(): number {
		return this.response.status;
	}

	header(name: string): string | null {
		return this.response.headers.get(name);
	}

	async bytes(): Promise<Uint8Array> {
		return new Uint8Array(await this.response.arrayBuffer());
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}
}
