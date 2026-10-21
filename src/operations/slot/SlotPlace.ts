import type { Call } from "../../call/Call.ts";
import { InvalidPhotoIdError } from "../../domain/photo/InvalidPhotoIdError.ts";
import { PhotoId } from "../../domain/photo/PhotoId.ts";
import type { SessionId } from "../../domain/session/SessionId.ts";
import { PhotoNotFoundError } from "../../infrastructure/stores/photo/PhotoNotFoundError.ts";
import type { PhotoStore } from "../../infrastructure/stores/photo/PhotoStore.ts";
import type { UserAlbumStore } from "../../infrastructure/stores/userAlbum/UserAlbumStore.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class SlotPlace implements JsonHandler {
	readonly name = "slot.place";

	constructor(
		private readonly userAlbums: UserAlbumStore,
		private readonly photos: PhotoStore,
	) {}

	async execute(call: Call): Promise<unknown> {
		const face = call.body.requireNumber("face");
		const photoText = call.body.requireText("photoId");
		const sessionId = call.requireSession();
		const userAlbum = await this.userAlbums.find(sessionId);
		userAlbum.requireFace(face);
		const photoId = await this.findPhoto(sessionId, photoText);
		const placed = userAlbum.place(face, photoId);
		await this.userAlbums.update(sessionId, placed);
		return { userAlbum: placed };
	}

	private async findPhoto(
		sessionId: SessionId,
		photoText: string,
	): Promise<PhotoId> {
		const photoId = this.readPhotoId(photoText);
		const photo = await this.photos.find(sessionId, photoId);
		return photo.id;
	}

	private readPhotoId(photoText: string): PhotoId {
		let photoId: PhotoId;
		try {
			photoId = PhotoId.from(photoText);
		} catch (error) {
			if (!(error instanceof InvalidPhotoIdError)) {
				throw error;
			}
			throw new PhotoNotFoundError("photo not found");
		}
		return photoId;
	}
}
