export class UserAlbumId {
	private constructor(private readonly text: string) {}

	static generate(): UserAlbumId {
		return new UserAlbumId(Bun.randomUUIDv7());
	}

	static from(text: string): UserAlbumId {
		return new UserAlbumId(text);
	}

	toString(): string {
		return this.text;
	}

	toJSON(): string {
		return this.text;
	}
}
