import type { Call } from "../../call/Call.ts";
import type { UserAlbumStore } from "../../stores/userAlbum/UserAlbumStore.ts";
import type { JsonHandler } from "../../transport/JsonTransport.ts";

export class UserAlbumGet implements JsonHandler {
	readonly name = "userAlbum.get";

	constructor(private readonly store: UserAlbumStore) {}

	async execute(call: Call): Promise<unknown> {
		const sessionId = call.requireSession();
		const userAlbum = await this.store.find(sessionId);
		return { userAlbum };
	}
}
