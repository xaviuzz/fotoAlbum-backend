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
import { SlotEmpty } from "../../../src/operations/slot/SlotEmpty.ts";
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

test("is named slot.empty", () => {
	expect(sut.operationName()).toBe("slot.empty");
});

test("answers the user album with the face empty", async () => {
	await sut.createFor("s-1");
	await sut.placeOn("s-1", 3);

	await sut.empty("e-1", "s-1", 3);

	expect(sut.status()).toBe(200);
	expect(await sut.occupiedFaces()).toEqual([]);
});

test("keeps the other faces occupied", async () => {
	await sut.createFor("s-1");
	await sut.placeOn("s-1", 3);
	await sut.placeOn("s-1", 4);

	await sut.empty("e-2", "s-1", 3);

	expect(await sut.occupiedFaces()).toEqual([4]);
});

test("keeps the emptying for the next read", async () => {
	await sut.createFor("s-1");
	await sut.placeOn("s-1", 3);
	await sut.empty("e-3", "s-1", 3);

	expect(await sut.occupiedFacesRead("s-1")).toEqual([]);
});

test("accepts emptying a slot that is already empty", async () => {
	await sut.createFor("s-1");

	await sut.empty("e-4", "s-1", 3);

	expect(sut.status()).toBe(200);
	expect(await sut.occupiedFaces()).toEqual([]);
});

test("answers USER_ALBUM_NOT_FOUND for a session without one", async () => {
	await sut.empty("e-5", "s-1", 1);

	expect(await sut.errorCode()).toBe("USER_ALBUM_NOT_FOUND");
});

test("answers FACE_NOT_FOUND for a face outside the album", async () => {
	await sut.createFor("s-1");

	await sut.empty("e-6", "s-1", 21);
	expect(await sut.errorCode()).toBe("FACE_NOT_FOUND");

	await sut.empty("e-7", "s-1", 0);
	expect(await sut.errorCode()).toBe("FACE_NOT_FOUND");
});

test("answers USER_ALBUM_NOT_FOUND before FACE_NOT_FOUND", async () => {
	await sut.empty("e-8", "s-1", 99);

	expect(await sut.errorCode()).toBe("USER_ALBUM_NOT_FOUND");
});

test("answers SESSION_REQUIRED without a session", async () => {
	await sut.emptyWithoutSession("e-9");

	expect(await sut.errorCode()).toBe("SESSION_REQUIRED");
});

test("answers INVALID_BODY without a face", async () => {
	await sut.emptyWithoutFace("e-10", "s-1");

	expect(await sut.errorCode()).toBe("INVALID_BODY");
});

class SUT {
	static async create(): Promise<SUT> {
		const root = await mkdtemp(join(tmpdir(), "slot-empty-"));
		return new SUT(root);
	}

	private readonly photos: PhotoStore;
	private readonly creation: Operation;
	private readonly reading: Operation;
	private readonly placing: Operation;
	private readonly operation: Operation;
	private response = new Response();

	private constructor(private readonly root: string) {
		const userAlbums = new UserAlbumStore(root);
		this.photos = new PhotoStore(root);
		this.creation = new JsonOperation(
			new UserAlbumCreate(Catalogue.seeded(), userAlbums),
		);
		this.reading = new JsonOperation(new UserAlbumGet(userAlbums));
		this.placing = new JsonOperation(new SlotPlace(userAlbums, this.photos));
		this.operation = new JsonOperation(new SlotEmpty(userAlbums));
	}

	async createFor(session: string): Promise<void> {
		const request = this.requestTo("userAlbum.create", {
			header: { callId: "c", sessionId: session },
			body: { reference: "PT-150" },
		});
		await this.creation.serve(request);
	}

	async placeOn(session: string, face: number): Promise<void> {
		const picture = await aPicture(100);
		const photo = await this.photos.add(SessionId.from(session), picture);
		const request = this.requestTo("slot.place", {
			header: { callId: "p", sessionId: session },
			body: { face, photoId: photo.id.toString() },
		});
		await this.placing.serve(request);
	}

	async empty(callId: string, session: string, face: number): Promise<void> {
		await this.send({
			header: { callId, sessionId: session },
			body: { face },
		});
	}

	async emptyWithoutSession(callId: string): Promise<void> {
		await this.send({ header: { callId }, body: { face: 1 } });
	}

	async emptyWithoutFace(callId: string, session: string): Promise<void> {
		await this.send({ header: { callId, sessionId: session }, body: {} });
	}

	operationName(): string {
		return this.operation.name;
	}

	status(): number {
		return this.response.status;
	}

	async occupiedFaces(): Promise<number[]> {
		const reply = await this.response.clone().json();
		return this.occupiedFacesOf(reply.body.userAlbum);
	}

	async occupiedFacesRead(session: string): Promise<number[]> {
		const request = this.requestTo("userAlbum.get", {
			header: { callId: "g", sessionId: session },
		});
		const response = await this.reading.serve(request);
		const reply = await response.json();
		return this.occupiedFacesOf(reply.body.userAlbum);
	}

	async errorCode(): Promise<string> {
		const reply = await this.response.clone().json();
		return reply.body.code;
	}

	async discard(): Promise<void> {
		await rm(this.root, { recursive: true, force: true });
	}

	private occupiedFacesOf(userAlbum: {
		slots: { face: number; photoId: string | null }[];
	}): number[] {
		const faces: number[] = [];
		for (const slot of userAlbum.slots) {
			if (slot.photoId !== null) {
				faces.push(slot.face);
			}
		}
		return faces;
	}

	private requestTo(name: string, message: object): Request {
		return new Request(`http://x/${name}`, {
			method: "POST",
			body: JSON.stringify(message),
		});
	}

	private async send(message: object): Promise<void> {
		const request = this.requestTo("slot.empty", message);
		this.response = await this.operation.serve(request);
	}
}
