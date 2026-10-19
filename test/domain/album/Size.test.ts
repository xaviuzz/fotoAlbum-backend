import { expect, test } from "bun:test";
import { InvalidAlbumError } from "../../../src/domain/album/InvalidAlbumError.ts";
import { Size } from "../../../src/domain/album/Size.ts";

test("is square when width and height are equal", () => {
	expect(Size.of(210, 210).orientation()).toBe("square");
});

test("is portrait when the height is larger", () => {
	expect(Size.of(150, 210).orientation()).toBe("portrait");
});

test("is landscape when the width is larger", () => {
	expect(Size.of(297, 210).orientation()).toBe("landscape");
});

test("rejects a measure of zero or less", () => {
	expect(() => Size.of(0, 210)).toThrow(InvalidAlbumError);
	expect(() => Size.of(210, -1)).toThrow(InvalidAlbumError);
});

test("rejects a measure that is not a whole number", () => {
	expect(() => Size.of(210.5, 210)).toThrow(InvalidAlbumError);
});

test("fits within a size at least as wide and tall", () => {
	expect(Size.of(200, 200).fitsWithin(Size.of(210, 210))).toBe(true);
	expect(Size.of(210, 210).fitsWithin(Size.of(210, 210))).toBe(true);
});

test("does not fit within a size narrower or shorter", () => {
	expect(Size.of(211, 200).fitsWithin(Size.of(210, 210))).toBe(false);
	expect(Size.of(200, 211).fitsWithin(Size.of(210, 210))).toBe(false);
});

test("describes itself as width and height", () => {
	expect(Size.of(150, 210).toJSON()).toEqual({ width: 150, height: 210 });
});
