import type { SessionId } from "../session/SessionId.ts";

export class Photo {
	readonly thumbnailUrl: string;

	constructor(
		readonly id: string,
		sessionId: SessionId,
	) {
		this.thumbnailUrl = `${sessionId.pathIn("/photos")}/${id}/thumbnail`;
	}
}
