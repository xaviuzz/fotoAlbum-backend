import { Album } from "./Album.ts";
import { AlbumNotFoundError } from "./AlbumNotFoundError.ts";

export class Catalogue {
	constructor(private readonly albums: Album[]) {}

	static seeded(): Catalogue {
		const square = Album.of({
			reference: "SQ-210",
			commercialName: "Cuadrado clásico",
			albumSize: { width: 210, height: 210 },
			pageSize: { width: 200, height: 200 },
			pageCount: 24,
			binding: "hardcover",
		});
		const portrait = Album.of({
			reference: "PT-150",
			commercialName: "Retrato de bolsillo",
			albumSize: { width: 150, height: 210 },
			pageSize: { width: 140, height: 200 },
			pageCount: 20,
			binding: "softcover",
		});
		const landscape = Album.of({
			reference: "LD-297",
			commercialName: "Paisaje grande",
			albumSize: { width: 297, height: 210 },
			pageSize: { width: 287, height: 200 },
			pageCount: 32,
			binding: "softcover",
		});
		return new Catalogue([square, portrait, landscape]);
	}

	list(): Album[] {
		return [...this.albums];
	}

	find(reference: string): Album {
		const found = this.albums.find((album) => album.isKnownAs(reference));
		if (found === undefined) {
			throw new AlbumNotFoundError("album not found");
		}
		return found;
	}
}
