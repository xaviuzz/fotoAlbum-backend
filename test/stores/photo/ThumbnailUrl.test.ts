import { expect, test } from "bun:test";
import { SessionId } from "../../../src/session/SessionId.ts";
import { SessionRequiredError } from "../../../src/session/SessionRequiredError.ts";
import { InvalidPhotoIdError } from "../../../src/stores/photo/InvalidPhotoIdError.ts";
import { InvalidThumbnailUrlError } from "../../../src/stores/photo/InvalidThumbnailUrlError.ts";
import { PhotoId } from "../../../src/stores/photo/PhotoId.ts";
import { ThumbnailUrl } from "../../../src/stores/photo/ThumbnailUrl.ts";

test("addresses the thumbnail of a photo inside its session", () => {
	const photoId = PhotoId.generate();

	const url = ThumbnailUrl.of(SessionId.from("s-1"), photoId);

	expect(url.toString()).toBe(`/photos/s-1/${photoId}/thumbnail`);
});

test("reads back the session and the photo it addresses", () => {
	const photoId = PhotoId.generate();
	const address = ThumbnailUrl.of(SessionId.from("s-1"), photoId).toString();

	const url = ThumbnailUrl.parse(address);

	expect(url.toString()).toBe(address);
});

test("refuses a path that is not a thumbnail path", () => {
	expect(() => ThumbnailUrl.parse("/album.list")).toThrow(
		InvalidThumbnailUrlError,
	);
});

test("refuses a session that is not safe as a folder", () => {
	const address = `/photos/%2e%2e/${PhotoId.generate()}/thumbnail`;

	expect(() => ThumbnailUrl.parse(address)).toThrow(SessionRequiredError);
});

test("refuses a photo id that is not well formed", () => {
	expect(() => ThumbnailUrl.parse("/photos/s-1/nope/thumbnail")).toThrow(
		InvalidPhotoIdError,
	);
});
