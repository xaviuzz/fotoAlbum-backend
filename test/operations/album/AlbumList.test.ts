import { beforeEach, expect, test } from "bun:test";
import { Catalogue } from "../../../src/album/Catalogue.ts";
import { AlbumList } from "../../../src/operations/album/AlbumList.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named album.list", () => {
	expect(sut.operationName()).toBe("album.list");
});

test("answers every album of the catalogue", async () => {
	await sut.list("l-1");

	expect(sut.status()).toBe(200);
	expect(await sut.isOk()).toBe(true);
	expect(await sut.references()).toEqual(["SQ-210", "PT-150", "LD-297"]);
});

test("answers each album with its orientation", async () => {
	await sut.list("l-2");

	expect(await sut.orientations()).toEqual(["square", "portrait", "landscape"]);
});

class SUT {
	private readonly operation = new AlbumList(Catalogue.seeded());
	private response = new Response();

	async list(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		const request = new Request("http://x/album.list", {
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

	async isOk(): Promise<boolean> {
		const reply = await this.response.clone().json();
		return reply.header.status === "ok";
	}

	async references(): Promise<string[]> {
		const albums = await this.albums();
		const references: string[] = [];
		for (const album of albums) {
			references.push(album.reference);
		}
		return references;
	}

	async orientations(): Promise<string[]> {
		const albums = await this.albums();
		const orientations: string[] = [];
		for (const album of albums) {
			orientations.push(album.orientation);
		}
		return orientations;
	}

	private async albums(): Promise<
		{ reference: string; orientation: string }[]
	> {
		const reply = await this.response.clone().json();
		return reply.body.albums;
	}
}
