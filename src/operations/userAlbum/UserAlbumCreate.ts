import type { Call } from "../../call/Call.ts";
import type { Catalogue } from "../../domain/album/Catalogue.ts";
import { UserAlbum } from "../../domain/userAlbum/UserAlbum.ts";
import type { UserAlbumStore } from "../../infrastructure/stores/userAlbum/UserAlbumStore.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

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
