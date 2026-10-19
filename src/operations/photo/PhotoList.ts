import type { Call } from "../../call/Call.ts";
import type { PhotoStore } from "../../infrastructure/stores/photo/PhotoStore.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class PhotoList implements JsonHandler {
	readonly name = "photo.list";

	constructor(private readonly store: PhotoStore) {}

	async execute(call: Call): Promise<unknown> {
		const sessionId = call.requireSession();
		const photos = await this.store.list(sessionId);
		return { photos };
	}
}
