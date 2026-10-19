import { InvalidAlbumError } from "./InvalidAlbumError.ts";

export class Reference {
	private constructor(private readonly text: string) {}

	static of(text: string): Reference {
		const isValid = /^[A-Za-z0-9-]+$/.test(text);
		if (!isValid) {
			throw new InvalidAlbumError(
				"reference holds letters, digits and hyphens",
			);
		}
		return new Reference(text);
	}

	matches(text: string): boolean {
		const mine = this.text.toLowerCase();
		const theirs = text.toLowerCase();
		return mine === theirs;
	}

	toString(): string {
		return this.text;
	}
}
