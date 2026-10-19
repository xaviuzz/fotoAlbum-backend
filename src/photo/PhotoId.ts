import { InvalidPhotoIdError } from "./InvalidPhotoIdError.ts";

const PHOTO_ID_FORMAT = /^[0-9a-f-]{36}$/;

export class PhotoId {
	private constructor(private readonly text: string) {}

	static generate(): PhotoId {
		return new PhotoId(Bun.randomUUIDv7());
	}

	static from(raw: unknown): PhotoId {
		const isText = typeof raw === "string";
		const isWellFormed = isText && PHOTO_ID_FORMAT.test(raw);
		if (!isWellFormed) {
			throw new InvalidPhotoIdError("photo id is not well formed");
		}
		return new PhotoId(raw);
	}

	toString(): string {
		return this.text;
	}

	toJSON(): string {
		return this.text;
	}
}
