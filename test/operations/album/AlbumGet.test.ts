import { beforeEach, expect, test } from "bun:test";
import { Catalogue } from "../../../src/album/Catalogue.ts";
import { AlbumGet } from "../../../src/operations/album/AlbumGet.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named album.get", () => {
	expect(sut.operationName()).toBe("album.get");
});

test("answers the album of a reference", async () => {
	await sut.get("g-1", { reference: "PT-150" });

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "g-1", status: "ok" },
		body: {
			album: {
				reference: "PT-150",
				commercialName: "Retrato de bolsillo",
				albumSize: { width: 150, height: 210 },
				pageSize: { width: 140, height: 200 },
				pageCount: 20,
				binding: "softcover",
				orientation: "portrait",
			},
		},
	});
});

test("finds the album whatever the capitals", async () => {
	await sut.get("g-2", { reference: "pt-150" });

	expect(await sut.albumReference()).toBe("PT-150");
});

test("answers ALBUM_NOT_FOUND for an unknown reference", async () => {
	await sut.get("g-3", { reference: "NOPE-1" });

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "g-3", status: "error" },
		body: { code: "ALBUM_NOT_FOUND", message: "album not found" },
	});
});

test("answers ALBUM_NOT_FOUND for a reference that is not well formed", async () => {
	await sut.get("g-4", { reference: "bad ref!" });

	expect(await sut.errorCode()).toBe("ALBUM_NOT_FOUND");
});

test("answers INVALID_BODY when the reference is missing", async () => {
	await sut.get("g-5", {});

	expect(await sut.errorCode()).toBe("INVALID_BODY");
});

class SUT {
	private readonly operation = new AlbumGet(Catalogue.seeded());
	private response = new Response();

	async get(callId: string, body: object): Promise<void> {
		const payload = JSON.stringify({ header: { callId }, body });
		const request = new Request("http://x/album.get", {
			method: "POST",
			body: payload,
		});
		this.response = await this.operation.serve(request);
	}

	operationName(): string {
		return this.operation.name;
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<unknown> {
		const reply = await this.response.clone().json();
		return reply;
	}

	async albumReference(): Promise<string> {
		const reply = await this.response.clone().json();
		return reply.body.album.reference;
	}

	async errorCode(): Promise<string> {
		const reply = await this.response.clone().json();
		return reply.body.code;
	}
}
