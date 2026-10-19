import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { MultipartOperation } from "../../../src/operations/MultipartOperation.ts";
import type { Operation } from "../../../src/operations/Operation.ts";
import { PhotoUpload } from "../../../src/operations/photo/PhotoUpload.ts";
import { SessionId } from "../../../src/session/SessionId.ts";
import { PhotoStore } from "../../../src/stores/photo/PhotoStore.ts";

let sut: SUT;

beforeEach(async () => {
	sut = await SUT.create();
});

afterEach(async () => {
	await sut.discard();
});

test("is named photo.upload", () => {
	expect(sut.operationName()).toBe("photo.upload");
});

test("stores the photos in the order they were sent", async () => {
	await sut.attachImage("one.jpg", 600, 300, "jpeg");
	await sut.attachImage("two.png", 300, 600, "png");

	await sut.upload("u-1", "s-1");

	expect(sut.status()).toBe(200);
	expect(await sut.callId()).toBe("u-1");
	expect(await sut.rejected()).toEqual([]);
	expect(await sut.answeredPhotoIds()).toEqual(await sut.storedPhotoIds("s-1"));
	expect((await sut.answeredPhotoIds()).length).toBe(2);
});

test("answers each photo with the address of its thumbnail", async () => {
	await sut.attachImage("one.jpg", 600, 300, "jpeg");

	await sut.upload("u-2", "s-1");

	const [id] = await sut.answeredPhotoIds();
	expect(await sut.answeredPhotos()).toEqual([
		{ id, thumbnailUrl: `/photos/s-1/${id}/thumbnail` },
	]);
});

test("rejects what it cannot store and keeps the rest", async () => {
	await sut.attachBytes("notes.txt", new TextEncoder().encode("hello"));
	await sut.attachImage("good.webp", 600, 300, "webp");
	await sut.attachImage("moving.gif", 60, 30, "gif");
	await sut.attachBytes("big.jpg", new Uint8Array(26 * 1024 * 1024));

	await sut.upload("u-3", "s-1");

	expect(await sut.rejected()).toEqual([
		{ name: "notes.txt", code: "UNREADABLE_IMAGE" },
		{ name: "moving.gif", code: "UNSUPPORTED_FORMAT" },
		{ name: "big.jpg", code: "TOO_LARGE" },
	]);
	expect((await sut.storedPhotoIds("s-1")).length).toBe(1);
});

test("answers INVALID_BODY when there are no files", async () => {
	await sut.upload("u-4", "s-1");

	expect(sut.status()).toBe(200);
	expect(await sut.errorCode()).toBe("INVALID_BODY");
});

test("answers SESSION_REQUIRED without a session", async () => {
	await sut.attachImage("one.jpg", 600, 300, "jpeg");

	await sut.uploadWithoutSession("u-5");

	expect(sut.status()).toBe(200);
	expect(await sut.errorCode()).toBe("SESSION_REQUIRED");
});

test("answers 400 when the call id is missing", async () => {
	await sut.attachImage("one.jpg", 600, 300, "jpeg");

	await sut.uploadWithoutCallId("s-1");

	expect(sut.status()).toBe(400);
});

test("answers 400 when the form is unreadable", async () => {
	await sut.sendUnreadableForm();

	expect(sut.status()).toBe(400);
});

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "photo-upload-"));
		return new SUT(root);
	}

	private readonly store: PhotoStore;
	private readonly operation: Operation;
	private readonly files: File[] = [];
	private response = new Response();

	private constructor(private readonly root: string) {
		this.store = new PhotoStore(root);
		this.operation = new MultipartOperation(new PhotoUpload(this.store));
	}

	async attachImage(
		name: string,
		width: number,
		height: number,
		format: "jpeg" | "png" | "webp" | "gif",
	): Promise<void> {
		const blank = sharp({
			create: { width, height, channels: 3, background: "red" },
		});
		const bytes = await blank.toFormat(format).toBuffer();
		await this.attachBytes(name, bytes);
	}

	async attachBytes(name: string, bytes: BlobPart): Promise<void> {
		this.files.push(new File([bytes], name));
	}

	async upload(callId: string, session: string): Promise<void> {
		const form = this.form();
		form.set("callId", callId);
		form.set("sessionId", session);
		await this.send(form);
	}

	async uploadWithoutSession(callId: string): Promise<void> {
		const form = this.form();
		form.set("callId", callId);
		await this.send(form);
	}

	async uploadWithoutCallId(session: string): Promise<void> {
		const form = this.form();
		form.set("sessionId", session);
		await this.send(form);
	}

	async sendUnreadableForm(): Promise<void> {
		const request = new Request("http://x/photo.upload", {
			method: "POST",
			headers: { "content-type": "text/plain" },
			body: "not a form",
		});
		this.response = await this.operation.serve(request);
	}

	operationName(): string {
		return this.operation.name;
	}

	status(): number {
		return this.response.status;
	}

	async callId(): Promise<string> {
		const reply = await this.response.clone().json();
		return reply.header.callId;
	}

	async answeredPhotos(): Promise<{ id: string; thumbnailUrl: string }[]> {
		const reply = await this.response.clone().json();
		return reply.body.photos;
	}

	async answeredPhotoIds(): Promise<string[]> {
		const photos = await this.answeredPhotos();
		return photos.map((photo) => photo.id);
	}

	async rejected(): Promise<unknown> {
		const reply = await this.response.clone().json();
		return reply.body.rejected;
	}

	async errorCode(): Promise<string> {
		const reply = await this.response.clone().json();
		return reply.body.code;
	}

	async storedPhotoIds(session: string): Promise<string[]> {
		const photos = await this.store.list(SessionId.from(session));
		return photos.map((photo) => photo.id.toString());
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}

	private form(): FormData {
		const form = new FormData();
		for (const file of this.files) {
			form.append("files", file);
		}
		return form;
	}

	private async send(form: FormData): Promise<void> {
		const request = new Request("http://x/photo.upload", {
			method: "POST",
			body: form,
		});
		this.response = await this.operation.serve(request);
	}
}
