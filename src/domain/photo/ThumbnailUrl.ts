import { SessionId } from "../session/SessionId.ts";
import { InvalidThumbnailUrlError } from "./InvalidThumbnailUrlError.ts";
import { PhotoId } from "./PhotoId.ts";

const THUMBNAIL_PATH = /^\/photos\/([^/]+)\/([^/]+)\/thumbnail$/;

export class ThumbnailUrl {
	static readonly PATTERN = "/photos/:sessionId/:photoId/thumbnail";

	private constructor(
		readonly sessionId: SessionId,
		readonly photoId: PhotoId,
	) {}

	static of(sessionId: SessionId, photoId: PhotoId): ThumbnailUrl {
		return new ThumbnailUrl(sessionId, photoId);
	}

	static parse(path: string): ThumbnailUrl {
		const match = THUMBNAIL_PATH.exec(path);
		if (match === null) {
			throw new InvalidThumbnailUrlError("not a thumbnail path");
		}
		const sessionId = SessionId.from(match[1]);
		const photoId = PhotoId.from(match[2]);
		return new ThumbnailUrl(sessionId, photoId);
	}

	toString(): string {
		return `/photos/${this.sessionId}/${this.photoId}/thumbnail`;
	}
}
