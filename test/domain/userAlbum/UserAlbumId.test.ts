import { expect, test } from "bun:test";
import { UserAlbumId } from "../../../src/domain/userAlbum/UserAlbumId.ts";

test("generates a different id each time", () => {
	const first = UserAlbumId.generate();
	const second = UserAlbumId.generate();

	expect(first.toString()).not.toBe(second.toString());
});

test("reads its own text back", () => {
	const generated = UserAlbumId.generate();

	const read = UserAlbumId.from(generated.toString());

	expect(read.toString()).toBe(generated.toString());
});

test("answers its text as JSON", () => {
	const id = UserAlbumId.generate();

	expect(JSON.stringify({ id })).toBe(`{"id":"${id}"}`);
});
