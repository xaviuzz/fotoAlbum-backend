import { beforeEach, expect, test } from "bun:test";
import { AlbumNotFoundError } from "../../../src/domain/album/AlbumNotFoundError.ts";
import { Catalogue } from "../../../src/domain/album/Catalogue.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("starts with a square, a portrait and a landscape album", () => {
	expect(sut.references()).toEqual(["SQ-210", "PT-150", "LD-297"]);
	expect(sut.orientations()).toEqual(["square", "portrait", "landscape"]);
});

test("finds an album by its reference", () => {
	expect(sut.commercialNameOf("PT-150")).toBe("Retrato de bolsillo");
});

test("finds an album whatever the capitals", () => {
	expect(sut.commercialNameOf("pt-150")).toBe("Retrato de bolsillo");
});

test("answers the reference as the catalogue holds it", () => {
	expect(sut.referenceFoundFor("ld-297")).toBe("LD-297");
});

test("fails to find a reference that is not well formed", () => {
	expect(() => sut.commercialNameOf("bad ref!")).toThrow(AlbumNotFoundError);
});

test("fails to find an unknown reference", () => {
	expect(() => sut.commercialNameOf("NOPE-1")).toThrow(AlbumNotFoundError);
});

class SUT {
	private readonly catalogue = Catalogue.seeded();

	references(): string[] {
		const references: string[] = [];
		for (const album of this.catalogue.list()) {
			references.push(album.toJSON().reference);
		}
		return references;
	}

	orientations(): string[] {
		const orientations: string[] = [];
		for (const album of this.catalogue.list()) {
			orientations.push(album.toJSON().orientation);
		}
		return orientations;
	}

	commercialNameOf(reference: string): string {
		return this.catalogue.find(reference).toJSON().commercialName;
	}

	referenceFoundFor(reference: string): string {
		return this.catalogue.find(reference).toJSON().reference;
	}
}
