import { expect, test } from "bun:test";
import { InvalidPhotoIdError } from "../../src/photo/InvalidPhotoIdError.ts";
import { PhotoId } from "../../src/photo/PhotoId.ts";

test("generates a different id each time", () => {
	const first = PhotoId.generate();
	const second = PhotoId.generate();

	expect(first.toString()).not.toBe(second.toString());
});

test("generates ids that sort by creation", () => {
	const first = PhotoId.generate().toString();
	const second = PhotoId.generate().toString();

	expect([second, first].sort()).toEqual([first, second]);
});

test("reads its own text back", () => {
	const generated = PhotoId.generate();

	const read = PhotoId.from(generated.toString());

	expect(read.toString()).toBe(generated.toString());
});

test("answers its text as JSON", () => {
	const id = PhotoId.generate();

	expect(JSON.stringify({ id })).toBe(`{"id":"${id}"}`);
});

test("rejects text that is not an id", () => {
	expect(() => PhotoId.from("nope")).toThrow(InvalidPhotoIdError);
});

test("rejects an id that could leave its folder", () => {
	expect(() => PhotoId.from("../s-1")).toThrow(InvalidPhotoIdError);
});

test("rejects a value that is not text", () => {
	expect(() => PhotoId.from(undefined)).toThrow(InvalidPhotoIdError);
});
