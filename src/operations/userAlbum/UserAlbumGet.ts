import type { Call } from "../../call/Call.ts";
import type { UserAlbumStore } from "../../userAlbum/UserAlbumStore.ts";
import { CallOperation } from "../CallOperation.ts";

export class UserAlbumGet extends CallOperation {
	readonly name = "userAlbum.get";

	constructor(private readonly store: UserAlbumStore) {
		super();
	}

	protected async execute(call: Call): Promise<unknown> {
		const sessionId = call.requireSession();
		const userAlbum = await this.store.find(sessionId);
		return { userAlbum };
	}
}
