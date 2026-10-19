import { InvalidPhotoIdError } from "../../domain/photo/InvalidPhotoIdError.ts";
import { InvalidThumbnailUrlError } from "../../domain/photo/InvalidThumbnailUrlError.ts";
import { ThumbnailUrl } from "../../domain/photo/ThumbnailUrl.ts";
import { SessionRequiredError } from "../../domain/session/SessionRequiredError.ts";
import { PhotoNotFoundError } from "../../infrastructure/stores/photo/PhotoNotFoundError.ts";
import type { PhotoStore } from "../../infrastructure/stores/photo/PhotoStore.ts";
import type { ResourceRoute } from "../ResourceRoute.ts";

const A_YEAR = 31536000;

export class ThumbnailRoute implements ResourceRoute {
	constructor(private readonly store: PhotoStore) {}

	readonly path = ThumbnailUrl.PATTERN;

	async serve(request: Request): Promise<Response> {
		const path = new URL(request.url).pathname;
		let response = new Response(null, { status: 404 });
		try {
			const url = ThumbnailUrl.parse(path);
			const bytes = await this.store.thumbnailOf(url.sessionId, url.photoId);
			response = this.jpeg(bytes);
		} catch (error) {
			if (!this.isRefusal(error)) {
				throw error;
			}
		}
		return response;
	}

	private isRefusal(error: unknown): boolean {
		const isBadSession = error instanceof SessionRequiredError;
		const isBadPhoto = error instanceof InvalidPhotoIdError;
		const isBadPath = error instanceof InvalidThumbnailUrlError;
		const isMissing = error instanceof PhotoNotFoundError;
		return isBadSession || isBadPhoto || isBadPath || isMissing;
	}

	private jpeg(bytes: Uint8Array<ArrayBuffer>): Response {
		const headers = {
			"content-type": "image/jpeg",
			"cache-control": `public, max-age=${A_YEAR}, immutable`,
		};
		return new Response(bytes, { headers });
	}
}
