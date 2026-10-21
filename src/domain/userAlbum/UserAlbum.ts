import { Album, type AlbumData } from "../album/Album.ts";
import { UserAlbumId } from "./UserAlbumId.ts";

export type UserAlbumData = AlbumData & { id: string };

export class UserAlbum {
	private constructor(
		private readonly id: UserAlbumId,
		private readonly album: Album,
	) {}

	static from(model: Album): UserAlbum {
		const id = UserAlbumId.generate();
		return new UserAlbum(id, model);
	}

	static of(data: UserAlbumData): UserAlbum {
		const id = UserAlbumId.from(data.id);
		const album = Album.of(data);
		return new UserAlbum(id, album);
	}

	toJSON() {
		const description = this.album.toJSON();
		return { id: this.id.toString(), ...description };
	}
}
