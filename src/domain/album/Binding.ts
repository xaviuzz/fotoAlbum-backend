import { InvalidAlbumError } from "./InvalidAlbumError.ts";

const KNOWN = ["hardcover", "softcover"];

export class Binding {
	private constructor(private readonly text: string) {}

	static of(text: string): Binding {
		if (!KNOWN.includes(text)) {
			throw new InvalidAlbumError("binding is hardcover or softcover");
		}
		return new Binding(text);
	}

	toString(): string {
		return this.text;
	}
}
