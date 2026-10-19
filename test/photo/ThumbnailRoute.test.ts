import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PhotoStore } from "../../src/photo/PhotoStore.ts";
import { ThumbnailRoute } from "../../src/photo/ThumbnailRoute.ts";
import { SessionId } from "../../src/session/SessionId.ts";

let sut: SUT;

beforeEach(async () => {
	sut = await SUT.create();
});

afterEach(async () => {
	await sut.discard();
});

test("serves a thumbnail as an immutable JPEG", async () => {
	const id = await sut.keepPhoto("s-1", "pixels");

	await sut.get(`/photos/s-1/${id}/thumbnail`);

	expect(sut.status()).toBe(200);
	expect(sut.header("content-type")).toBe("image/jpeg");
	expect(sut.header("cache-control")).toBe(
		"public, max-age=31536000, immutable",
	);
	expect(await sut.text()).toBe("pixels");
});

test("answers 404 for an unknown photo", async () => {
	await sut.get("/photos/s-1/0190a000-0000-7000-8000-000000000000/thumbnail");

	expect(sut.status()).toBe(404);
});

test("answers 404 for the photo of another session", async () => {
	const id = await sut.keepPhoto("s-1", "pixels");

	await sut.get(`/photos/s-2/${id}/thumbnail`);

	expect(sut.status()).toBe(404);
});

test("answers 404 for a session that is not safe as a folder", async () => {
	await sut.get("/photos/%2e%2e/x/thumbnail");

	expect(sut.status()).toBe(404);
});

test("recognises only GET requests for its path", () => {
	expect(sut.serves("GET", "/photos/s-1/abc/thumbnail")).toBe(true);
	expect(sut.serves("POST", "/photos/s-1/abc/thumbnail")).toBe(false);
	expect(sut.serves("GET", "/photos/s-1/abc")).toBe(false);
	expect(sut.serves("GET", "/album.list")).toBe(false);
});

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

	async keepPhoto(session: string, thumbnailText: string): Promise<string> {
		const original = new TextEncoder().encode("original");
		const thumbnail = new TextEncoder().encode(thumbnailText);
		const photo = await this.store.add(
			SessionId.from(session),
			{ bytes: original, extension: "jpg" },
			thumbnail,
		);
		return photo.id;
	}

	async get(path: string): Promise<void> {
		this.response = await this.route.serve(new Request(`http://x${path}`));
	}

	serves(method: string, path: string): boolean {
		return this.route.serves(new Request(`http://x${path}`, { method }));
	}

	status(): number {
		return this.response.status;
	}

	header(name: string): string | null {
		return this.response.headers.get(name);
	}

	async text(): Promise<string> {
		return this.response.text();
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}
}
