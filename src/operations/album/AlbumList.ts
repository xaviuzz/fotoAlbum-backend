import type { Catalogue } from "../../album/Catalogue.ts";
import { CallOperation } from "../CallOperation.ts";

export class AlbumList extends CallOperation {
	readonly name = "album.list";

	constructor(private readonly catalogue: Catalogue) {
		super();
	}

	protected async execute(): Promise<unknown> {
		const albums = this.catalogue.list();
		return { albums };
	}
}
