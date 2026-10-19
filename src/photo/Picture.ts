import sharp from "sharp";
import { UnreadableImageError } from "./UnreadableImageError.ts";
import { UnsupportedFormatError } from "./UnsupportedFormatError.ts";

const THUMBNAIL_SIDE = 256;

const EXTENSIONS: Record<string, string> = {
	jpeg: "jpg",
	png: "png",
	webp: "webp",
};

export class Picture {
	private constructor(
		readonly extension: string,
		private readonly originalBytes: Uint8Array,
		private readonly thumbnailBytes: Uint8Array,
	) {}

	static async read(bytes: Uint8Array): Promise<Picture> {
		const format = await Picture.readFormat(bytes);
		const extension = Picture.extensionOf(format);
		const thumbnail = await Picture.makeThumbnail(bytes);
		return new Picture(extension, bytes, thumbnail);
	}

	original(): Uint8Array {
		return this.originalBytes;
	}

	thumbnail(): Uint8Array {
		return this.thumbnailBytes;
	}

	private static async readFormat(bytes: Uint8Array): Promise<string> {
		let format: string | undefined;
		try {
			const metadata = await sharp(bytes).metadata();
			format = metadata.format;
		} catch {
			throw new UnreadableImageError("not an image");
		}
		if (format === undefined) {
			throw new UnreadableImageError("not an image");
		}
		return format;
	}

	private static extensionOf(format: string): string {
		const extension = EXTENSIONS[format];
		if (extension === undefined) {
			throw new UnsupportedFormatError(`${format} is not supported`);
		}
		return extension;
	}

	private static async makeThumbnail(bytes: Uint8Array): Promise<Uint8Array> {
		let thumbnail: Uint8Array;
		try {
			thumbnail = await sharp(bytes)
				.rotate()
				.resize(THUMBNAIL_SIDE, THUMBNAIL_SIDE, { fit: "inside" })
				.jpeg()
				.toBuffer();
		} catch {
			throw new UnreadableImageError("image cannot be decoded");
		}
		return thumbnail;
	}
}
