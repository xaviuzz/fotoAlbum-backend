import { PhotoStore } from "./photo/PhotoStore.ts";
import { UserAlbumStore } from "./userAlbum/UserAlbumStore.ts";

export class Stores {
	constructor(
		readonly photos: PhotoStore,
		readonly userAlbums: UserAlbumStore,
	) {}

	static under(dataDir: string): Stores {
		return new Stores(new PhotoStore(dataDir), new UserAlbumStore(dataDir));
	}
}
