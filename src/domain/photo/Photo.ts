import type { SessionId } from "../session/SessionId.ts";
import type { PhotoId } from "./PhotoId.ts";
import { ThumbnailUrl } from "./ThumbnailUrl.ts";

export class Photo {
	readonly thumbnailUrl: string;

	constructor(
		readonly id: PhotoId,
		sessionId: SessionId,
	) {
		this.thumbnailUrl = ThumbnailUrl.of(sessionId, id).toString();
	}
}
