import { beforeEach, expect, test } from "bun:test";
import { Album, type AlbumData } from "../../src/album/Album.ts";
import { InvalidAlbumError } from "../../src/album/InvalidAlbumError.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("describes itself as the contract does", () => {
	sut.create({});

	expect(sut.description()).toEqual({
		reference: "SQ-210",
		commercialName: "Cuadrado clasico",
		albumSize: { width: 210, height: 210 },
		pageSize: { width: 200, height: 200 },
		pageCount: 24,
		binding: "hardcover",
		orientation: "square",
	});
});

test("derives a portrait orientation from the album size", () => {
	sut.create({
		albumSize: { width: 150, height: 210 },
		pageSize: { width: 140, height: 200 },
	});

	expect(sut.orientation()).toBe("portrait");
});

test("derives a landscape orientation from the album size", () => {
	sut.create({ albumSize: { width: 297, height: 210 } });

	expect(sut.orientation()).toBe("landscape");
});

test("is known by its reference whatever the capitals", () => {
	sut.create({});

	expect(sut.isKnownAs("sq-210")).toBe(true);
	expect(sut.isKnownAs("SQ-211")).toBe(false);
});

test("requires a commercial name", () => {
	expect(() => sut.create({ commercialName: "" })).toThrow(InvalidAlbumError);
});

test("rejects a page wider or taller than the album", () => {
	expect(() => sut.create({ pageSize: { width: 211, height: 200 } })).toThrow(
		InvalidAlbumError,
	);
	expect(() => sut.create({ pageSize: { width: 200, height: 211 } })).toThrow(
		InvalidAlbumError,
	);
});

test("accepts a page as large as the album", () => {
	expect(() =>
		sut.create({ pageSize: { width: 210, height: 210 } }),
	).not.toThrow();
});

test("rejects an odd page count", () => {
	expect(() => sut.create({ pageCount: 23 })).toThrow(InvalidAlbumError);
});

test("rejects a page count of zero or less", () => {
	expect(() => sut.create({ pageCount: 0 })).toThrow(InvalidAlbumError);
	expect(() => sut.create({ pageCount: -2 })).toThrow(InvalidAlbumError);
});

test("rejects a binding other than hardcover or softcover", () => {
	expect(() => sut.create({ binding: "spiral" })).toThrow(InvalidAlbumError);
});

class SUT {
	private album: Album | undefined;

	create(changes: Partial<AlbumData>): void {
		const data: AlbumData = {
			reference: "SQ-210",
			commercialName: "Cuadrado clasico",
			albumSize: { width: 210, height: 210 },
			pageSize: { width: 200, height: 200 },
			pageCount: 24,
			binding: "hardcover",
			...changes,
		};
		this.album = Album.of(data);
	}

	description(): unknown {
		return this.album?.toJSON();
	}

	orientation(): string | undefined {
		return this.album?.toJSON().orientation;
	}

	isKnownAs(text: string): boolean {
		return this.album?.isKnownAs(text) ?? false;
	}
}
