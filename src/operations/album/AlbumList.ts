import type { Catalogue } from "../../album/Catalogue.ts";
import type { JsonHandler } from "../../transport/JsonTransport.ts";

export class AlbumList implements JsonHandler {
	readonly name = "album.list";

	constructor(private readonly catalogue: Catalogue) {}

	async execute(): Promise<unknown> {
		const albums = this.catalogue.list();
		return { albums };
	}
}
