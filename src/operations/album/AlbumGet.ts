import type { Catalogue } from "../../album/Catalogue.ts";
import type { Call } from "../../call/Call.ts";
import type { JsonHandler } from "../../transport/JsonTransport.ts";

export class AlbumGet implements JsonHandler {
	readonly name = "album.get";

	constructor(private readonly catalogue: Catalogue) {}

	async execute(call: Call): Promise<unknown> {
		const reference = call.body.requireText("reference");
		const album = this.catalogue.find(reference);
		return { album };
	}
}
