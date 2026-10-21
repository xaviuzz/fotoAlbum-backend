import { Binding } from "./Binding.ts";
import { InvalidAlbumError } from "./InvalidAlbumError.ts";
import { Reference } from "./Reference.ts";
import { type Orientation, Size } from "./Size.ts";

type Measures = { width: number; height: number };

export type AlbumData = {
	reference: string;
	commercialName: string;
	albumSize: Measures;
	pageSize: Measures;
	pageCount: number;
	binding: string;
};

type AlbumDescription = AlbumData & { orientation: Orientation };

export class Album {
	private constructor(
		private readonly reference: Reference,
		private readonly commercialName: string,
		private readonly albumSize: Size,
		private readonly pageSize: Size,
		private readonly pageCount: number,
		private readonly binding: Binding,
	) {}

	static of(data: AlbumData): Album {
		const reference = Reference.of(data.reference);
		const albumSize = Size.of(data.albumSize.width, data.albumSize.height);
		const pageSize = Size.of(data.pageSize.width, data.pageSize.height);
		const binding = Binding.of(data.binding);
		Album.requireCommercialName(data.commercialName);
		Album.requirePageFitting(pageSize, albumSize);
		Album.requireEvenPageCount(data.pageCount);
		return new Album(
			reference,
			data.commercialName,
			albumSize,
			pageSize,
			data.pageCount,
			binding,
		);
	}

	isKnownAs(text: string): boolean {
		return this.reference.matches(text);
	}

	toJSON(): AlbumDescription {
		return {
			reference: this.reference.toString(),
			commercialName: this.commercialName,
			albumSize: this.albumSize.toJSON(),
			pageSize: this.pageSize.toJSON(),
			pageCount: this.pageCount,
			binding: this.binding.toString(),
			orientation: this.albumSize.orientation(),
		};
	}

	private static requireCommercialName(commercialName: string): void {
		if (commercialName.length === 0) {
			throw new InvalidAlbumError("commercial name is required");
		}
	}

	private static requirePageFitting(pageSize: Size, albumSize: Size): void {
		if (!pageSize.fitsWithin(albumSize)) {
			throw new InvalidAlbumError("a page cannot exceed the album");
		}
	}

	private static requireEvenPageCount(pageCount: number): void {
		const isWhole = Number.isInteger(pageCount);
		const isPositive = pageCount > 0;
		const isEven = pageCount % 2 === 0;
		if (!isWhole || !isPositive || !isEven) {
			throw new InvalidAlbumError("page count must be even and above zero");
		}
	}
}
