import { SessionId } from "../session/SessionId.ts";
import { SessionRequiredError } from "../session/SessionRequiredError.ts";
import type { PhotoStore } from "./PhotoStore.ts";

const THUMBNAIL_PATH = /^\/photos\/([^/]+)\/([^/]+)\/thumbnail$/;
const A_YEAR = 31536000;

export class ThumbnailRoute {
	constructor(private readonly store: PhotoStore) {}

	serves(request: Request): boolean {
		const isGet = request.method === "GET";
		const path = new URL(request.url).pathname;
		const isThumbnailPath = THUMBNAIL_PATH.test(path);
		return isGet && isThumbnailPath;
	}

	async serve(request: Request): Promise<Response> {
		const path = new URL(request.url).pathname;
		const match = THUMBNAIL_PATH.exec(path);
		let response = new Response(null, { status: 404 });
		if (match !== null) {
			response = await this.thumbnail(match[1] as string, match[2] as string);
		}
		return response;
	}

	private async thumbnail(session: string, photoId: string): Promise<Response> {
		let response = new Response(null, { status: 404 });
		try {
			const sessionId = SessionId.from(session);
			const bytes = await this.store.thumbnailOf(sessionId, photoId);
			if (bytes !== undefined) {
				response = this.jpeg(bytes);
			}
		} catch (error) {
			if (!(error instanceof SessionRequiredError)) {
				throw error;
			}
		}
		return response;
	}

	private jpeg(bytes: Uint8Array<ArrayBuffer>): Response {
		const headers = {
			"content-type": "image/jpeg",
			"cache-control": `public, max-age=${A_YEAR}, immutable`,
		};
		return new Response(bytes, { headers });
	}
}
