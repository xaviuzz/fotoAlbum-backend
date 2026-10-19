import type { Catalogue } from "../../album/Catalogue.ts";
import type { Call } from "../../call/Call.ts";
import { UserAlbum } from "../../userAlbum/UserAlbum.ts";
import type { UserAlbumStore } from "../../userAlbum/UserAlbumStore.ts";
import { CallOperation } from "../CallOperation.ts";

export class UserAlbumCreate extends CallOperation {
	readonly name = "userAlbum.create";

	constructor(
		private readonly catalogue: Catalogue,
		private readonly store: UserAlbumStore,
	) {
		super();
	}

	protected async execute(call: Call): Promise<unknown> {
		const reference = call.body.requireText("reference");
		const sessionId = call.requireSession();
		const model = this.catalogue.find(reference);
		const userAlbum = UserAlbum.from(model);
		await this.store.save(sessionId, userAlbum);
		return { userAlbum };
	}
}
