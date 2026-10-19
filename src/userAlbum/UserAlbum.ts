import { Album, type AlbumData } from "../album/Album.ts";

export type UserAlbumData = AlbumData & { id: string };

export class UserAlbum {
	private constructor(
		private readonly id: string,
		private readonly album: Album,
	) {}

	static from(model: Album): UserAlbum {
		const id = Bun.randomUUIDv7();
		return new UserAlbum(id, model);
	}

	static of(data: UserAlbumData): UserAlbum {
		const album = Album.of(data);
		return new UserAlbum(data.id, album);
	}

	toJSON() {
		const description = this.album.toJSON();
		return { id: this.id, ...description };
	}
}
