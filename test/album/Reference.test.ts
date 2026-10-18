import { expect, test } from "bun:test";
import { InvalidAlbumError } from "../../src/album/InvalidAlbumError.ts";
import { Reference } from "../../src/album/Reference.ts";

test("keeps the capitals it was typed with", () => {
	expect(Reference.of("Fam-2025").toString()).toBe("Fam-2025");
});

test("ignores capitals when compared", () => {
	const typed = Reference.of("fam-2025");

	expect(typed.matches("FAM-2025")).toBe(true);
});

test("tells different references apart", () => {
	const first = Reference.of("fam-2025");

	expect(first.matches("fam-2026")).toBe(false);
});

test("rejects an empty reference", () => {
	expect(() => Reference.of("")).toThrow(InvalidAlbumError);
});

test("rejects spaces and signs", () => {
	expect(() => Reference.of("fam 2025")).toThrow(InvalidAlbumError);
	expect(() => Reference.of("fam_2025")).toThrow(InvalidAlbumError);
});
