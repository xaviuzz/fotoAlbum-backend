import type { Call } from "../../call/Call.ts";
import type { PhotoStore } from "../../photo/PhotoStore.ts";
import { CallOperation } from "../CallOperation.ts";

export class PhotoList extends CallOperation {
	readonly name = "photo.list";

	constructor(private readonly store: PhotoStore) {
		super();
	}

	protected validate(): void {}

	protected async execute(call: Call): Promise<unknown> {
		const sessionId = call.requireSession();
		const photos = await this.store.list(sessionId);
		return { photos };
	}
}
