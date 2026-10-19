import type { Catalogue } from "../../album/Catalogue.ts";
import type { Call } from "../../call/Call.ts";
import { CallOperation } from "../CallOperation.ts";

export class AlbumGet extends CallOperation {
	readonly name = "album.get";

	constructor(private readonly catalogue: Catalogue) {
		super();
	}

	protected async execute(call: Call): Promise<unknown> {
		const reference = call.body.requireText("reference");
		const album = this.catalogue.find(reference);
		return { album };
	}
}
