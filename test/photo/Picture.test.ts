import { beforeEach, expect, test } from "bun:test";
import sharp from "sharp";
import { Picture } from "../../src/photo/Picture.ts";
import { TooLargeError } from "../../src/photo/TooLargeError.ts";
import { UnreadableImageError } from "../../src/photo/UnreadableImageError.ts";
import { UnsupportedFormatError } from "../../src/photo/UnsupportedFormatError.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("names the extension of a JPEG", async () => {
	await sut.read(await sut.image(600, 300, "jpeg"));

	expect(sut.extension()).toBe("jpg");
});

test("keeps the bytes it was read from", async () => {
	const bytes = await sut.image(600, 300, "png");

	await sut.read(bytes);

	expect(sut.original()).toEqual(bytes);
});

test("names the extension of a PNG", async () => {
	await sut.read(await sut.image(600, 300, "png"));

	expect(sut.extension()).toBe("png");
});

test("names the extension of a WebP", async () => {
	await sut.read(await sut.image(600, 300, "webp"));

	expect(sut.extension()).toBe("webp");
});

test("refuses an image of another format", async () => {
	const gif = await sut.image(600, 300, "gif");

	await expect(sut.read(gif)).rejects.toThrow(UnsupportedFormatError);
});

test("refuses bytes that are not an image", async () => {
	const text = new TextEncoder().encode("hello");

	await expect(sut.read(text)).rejects.toThrow(UnreadableImageError);
});

test("refuses a damaged image", async () => {
	const damaged = (await sut.image(600, 300, "jpeg")).slice(0, 100);

	await expect(sut.read(damaged)).rejects.toThrow(UnreadableImageError);
});

test("refuses bytes over 25 MB", async () => {
	const big = new Uint8Array(25 * 1024 * 1024 + 1);

	await expect(sut.read(big)).rejects.toThrow(TooLargeError);
});

test("makes a JPEG thumbnail whose longest side is 256 pixels", async () => {
	await sut.read(await sut.image(600, 300, "png"));

	expect(await sut.thumbnailShape()).toEqual({
		format: "jpeg",
		width: 256,
		height: 128,
	});
});

test("keeps the proportions of a portrait photo", async () => {
	await sut.read(await sut.image(300, 600, "jpeg"));

	expect(await sut.thumbnailShape()).toEqual({
		format: "jpeg",
		width: 128,
		height: 256,
	});
});

test("turns a photo the way its camera says", async () => {
	await sut.read(await sut.turnedImage(600, 300));

	expect(await sut.thumbnailShape()).toEqual({
		format: "jpeg",
		width: 128,
		height: 256,
	});
});

class SUT {
	private picture: Picture | undefined;

	async image(
		width: number,
		height: number,
		format: "jpeg" | "png" | "webp" | "gif",
	): Promise<Uint8Array> {
		const blank = sharp({
			create: { width, height, channels: 3, background: "red" },
		});
		const bytes = await blank.toFormat(format).toBuffer();
		return bytes;
	}

	async turnedImage(width: number, height: number): Promise<Uint8Array> {
		const blank = sharp({
			create: { width, height, channels: 3, background: "red" },
		});
		const bytes = await blank
			.jpeg()
			.withMetadata({ orientation: 6 })
			.toBuffer();
		return bytes;
	}

	async read(bytes: Uint8Array): Promise<void> {
		this.picture = await Picture.read(bytes);
	}

	extension(): string {
		return (this.picture as Picture).extension;
	}

	original(): Uint8Array {
		return (this.picture as Picture).original();
	}

	async thumbnailShape(): Promise<object> {
		const thumbnail = (this.picture as Picture).thumbnail();
		const metadata = await sharp(thumbnail).metadata();
		return {
			format: metadata.format,
			width: metadata.width,
			height: metadata.height,
		};
	}
}
