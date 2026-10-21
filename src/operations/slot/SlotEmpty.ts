import type { Call } from "../../call/Call.ts";
import type { UserAlbumStore } from "../../infrastructure/stores/userAlbum/UserAlbumStore.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class SlotEmpty implements JsonHandler {
	readonly name = "slot.empty";

	constructor(private readonly userAlbums: UserAlbumStore) {}

	async execute(call: Call): Promise<unknown> {
		const face = call.body.requireNumber("face");
		const sessionId = call.requireSession();
		const userAlbum = await this.userAlbums.find(sessionId);
		const emptied = userAlbum.empty(face);
		await this.userAlbums.update(sessionId, emptied);
		return { userAlbum: emptied };
	}
}
