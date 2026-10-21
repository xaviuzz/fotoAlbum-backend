import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Catalogue } from "../../../src/domain/album/Catalogue.ts";
import { SessionId } from "../../../src/domain/session/SessionId.ts";
import { PhotoStore } from "../../../src/infrastructure/stores/photo/PhotoStore.ts";
import { UserAlbumStore } from "../../../src/infrastructure/stores/userAlbum/UserAlbumStore.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import type { Operation } from "../../../src/operations/Operation.ts";
import { SlotPlace } from "../../../src/operations/slot/SlotPlace.ts";
import { UserAlbumCreate } from "../../../src/operations/userAlbum/UserAlbumCreate.ts";
import { UserAlbumGet } from "../../../src/operations/userAlbum/UserAlbumGet.ts";
import { aPicture } from "../../infrastructure/imaging/Pictures.ts";

let sut: SUT;

beforeEach(async () => {
	sut = await SUT.create();
});

afterEach(async () => {
	await sut.discard();
});

test("is named slot.place", () => {
	expect(sut.operationName()).toBe("slot.place");
});

test("answers the user album with the photo on the face", async () => {
	await sut.createFor("s-1");
	const photoId = await sut.keepPhoto("s-1");

	await sut.place("p-1", "s-1", 3, photoId);

	expect(sut.status()).toBe(200);
	expect(await sut.occupants()).toEqual({ 3: photoId });
});

test("keeps the placement for the next read", async () => {
	await sut.createFor("s-1");
	const photoId = await sut.keepPhoto("s-1");
	await sut.place("p-2", "s-1", 3, photoId);

	expect(await sut.occupantsRead("s-1")).toEqual({ 3: photoId });
});

test("replaces the photo of an occupied slot", async () => {
	await sut.createFor("s-1");
	const first = await sut.keepPhoto("s-1");
	const second = await sut.keepPhoto("s-1");
	await sut.place("p-3", "s-1", 3, first);

	await sut.place("p-4", "s-1", 3, second);

	expect(await sut.occupants()).toEqual({ 3: second });
});

test("answers USER_ALBUM_NOT_FOUND for a session without one", async () => {
	const photoId = await sut.keepPhoto("s-1");

	await sut.place("p-5", "s-1", 1, photoId);

	expect(await sut.errorCode()).toBe("USER_ALBUM_NOT_FOUND");
});

test("answers FACE_NOT_FOUND for a face outside the album", async () => {
	await sut.createFor("s-1");
	const photoId = await sut.keepPhoto("s-1");

	await sut.place("p-6", "s-1", 21, photoId);
	expect(await sut.errorCode()).toBe("FACE_NOT_FOUND");

	await sut.place("p-7", "s-1", 0, photoId);
	expect(await sut.errorCode()).toBe("FACE_NOT_FOUND");
});

test("answers PHOTO_NOT_FOUND for an unknown photo", async () => {
	await sut.createFor("s-1");

	await sut.place("p-8", "s-1", 1, "00000000-0000-0000-0000-00000000000a");

	expect(await sut.errorCode()).toBe("PHOTO_NOT_FOUND");
});

test("answers PHOTO_NOT_FOUND for a photo id that is not well formed", async () => {
	await sut.createFor("s-1");

	await sut.place("p-9", "s-1", 1, "nope");

	expect(await sut.errorCode()).toBe("PHOTO_NOT_FOUND");
});

test("answers PHOTO_NOT_FOUND for a photo of another session", async () => {
	await sut.createFor("s-1");
	const photoId = await sut.keepPhoto("s-2");

	await sut.place("p-10", "s-1", 1, photoId);

	expect(await sut.errorCode()).toBe("PHOTO_NOT_FOUND");
});

test("leaves the slots as they were when it refuses", async () => {
	await sut.createFor("s-1");

	await sut.place("p-11", "s-1", 1, "nope");

	expect(await sut.occupantsRead("s-1")).toEqual({});
});

test("answers FACE_NOT_FOUND before PHOTO_NOT_FOUND", async () => {
	await sut.createFor("s-1");

	await sut.place("p-12", "s-1", 99, "nope");

	expect(await sut.errorCode()).toBe("FACE_NOT_FOUND");
});

test("answers USER_ALBUM_NOT_FOUND before FACE_NOT_FOUND", async () => {
	await sut.place("p-13", "s-1", 99, "nope");

	expect(await sut.errorCode()).toBe("USER_ALBUM_NOT_FOUND");
});

test("answers SESSION_REQUIRED without a session", async () => {
	await sut.placeWithoutSession("p-14");

	expect(await sut.errorCode()).toBe("SESSION_REQUIRED");
});

test("answers INVALID_BODY without a face", async () => {
	await sut.placeWithoutFace("p-15", "s-1");

	expect(await sut.errorCode()).toBe("INVALID_BODY");
});

test("answers INVALID_BODY without a photo", async () => {
	await sut.placeWithoutPhoto("p-16", "s-1");

	expect(await sut.errorCode()).toBe("INVALID_BODY");
});

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "slot-place-"));
		return new SUT(root);
	}

	private readonly photos: PhotoStore;
	private readonly creation: Operation;
	private readonly reading: Operation;
	private readonly operation: Operation;
	private response = new Response();

	private constructor(private readonly root: string) {
		const userAlbums = new UserAlbumStore(root);
		this.photos = new PhotoStore(root);
		this.creation = new JsonOperation(
			new UserAlbumCreate(Catalogue.seeded(), userAlbums),
		);
		this.reading = new JsonOperation(new UserAlbumGet(userAlbums));
		this.operation = new JsonOperation(new SlotPlace(userAlbums, this.photos));
	}

	async createFor(session: string): Promise<void> {
		const request = this.requestTo("userAlbum.create", {
			header: { callId: "c", sessionId: session },
			body: { reference: "PT-150" },
		});
		await this.creation.serve(request);
	}

	async keepPhoto(session: string): Promise<string> {
		const picture = await aPicture(100);
		const photo = await this.photos.add(SessionId.from(session), picture);
		return photo.id.toString();
	}

	async place(
		callId: string,
		session: string,
		face: number,
		photoId: string,
	): Promise<void> {
		await this.send({
			header: { callId, sessionId: session },
			body: { face, photoId },
		});
	}

	async placeWithoutSession(callId: string): Promise<void> {
		await this.send({ header: { callId }, body: { face: 1, photoId: "x" } });
	}

	async placeWithoutFace(callId: string, session: string): Promise<void> {
		await this.send({
			header: { callId, sessionId: session },
			body: { photoId: "x" },
		});
	}

	async placeWithoutPhoto(callId: string, session: string): Promise<void> {
		await this.send({
			header: { callId, sessionId: session },
			body: { face: 1 },
		});
	}

	operationName(): string {
		return this.operation.name;
	}

	status(): number {
		return this.response.status;
	}

	async occupants(): Promise<Record<number, string>> {
		const reply = await this.response.clone().json();
		return this.occupantsOf(reply.body.userAlbum);
	}

	async occupantsRead(session: string): Promise<Record<number, string>> {
		const request = this.requestTo("userAlbum.get", {
			header: { callId: "g", sessionId: session },
		});
		const response = await this.reading.serve(request);
		const reply = await response.json();
		return this.occupantsOf(reply.body.userAlbum);
	}

	async errorCode(): Promise<string> {
		const reply = await this.response.clone().json();
		return reply.body.code;
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}

	private occupantsOf(userAlbum: {
		slots: { face: number; photoId: string | null }[];
	}): Record<number, string> {
		const occupants: Record<number, string> = {};
		for (const slot of userAlbum.slots) {
			if (slot.photoId !== null) {
				occupants[slot.face] = slot.photoId;
			}
		}
		return occupants;
	}

	private requestTo(name: string, message: object): Request {
		return new Request(`http://x/${name}`, {
			method: "POST",
			body: JSON.stringify(message),
		});
	}

	private async send(message: object): Promise<void> {
		const request = this.requestTo("slot.place", message);
		this.response = await this.operation.serve(request);
	}
}
