import type { Catalogue } from "../../album/Catalogue.ts";
import type { Call } from "../../call/Call.ts";
import { UserAlbum } from "../../stores/userAlbum/UserAlbum.ts";
import type { UserAlbumStore } from "../../stores/userAlbum/UserAlbumStore.ts";
import type { JsonHandler } from "../../transport/JsonTransport.ts";

export class UserAlbumCreate implements JsonHandler {
	readonly name = "userAlbum.create";

	constructor(
		private readonly catalogue: Catalogue,
		private readonly store: UserAlbumStore,
	) {}

	async execute(call: Call): Promise<unknown> {
		const reference = call.body.requireText("reference");
		const sessionId = call.requireSession();
		const model = this.catalogue.find(reference);
		const userAlbum = UserAlbum.from(model);
		await this.store.save(sessionId, userAlbum);
		return { userAlbum };
	}
}
