import { expect, test } from "bun:test";
import { Binding } from "../../../src/domain/album/Binding.ts";
import { InvalidAlbumError } from "../../../src/domain/album/InvalidAlbumError.ts";

test("accepts hardcover and softcover", () => {
	expect(Binding.of("hardcover").toString()).toBe("hardcover");
	expect(Binding.of("softcover").toString()).toBe("softcover");
});

test("rejects any other binding", () => {
	expect(() => Binding.of("spiral")).toThrow(InvalidAlbumError);
});
