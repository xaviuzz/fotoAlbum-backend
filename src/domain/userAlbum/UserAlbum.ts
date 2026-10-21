import { Album, type AlbumData } from "../album/Album.ts";
import type { PhotoId } from "../photo/PhotoId.ts";
import { FaceSlots } from "../slot/FaceSlots.ts";
import type { SlotData } from "../slot/Slot.ts";
import { UserAlbumId } from "./UserAlbumId.ts";

export type UserAlbumData = AlbumData & { id: string; slots?: SlotData[] };

export class UserAlbum {
	private constructor(
		private readonly id: UserAlbumId,
		private readonly album: Album,
		private readonly slots: FaceSlots,
	) {}

	static from(model: Album): UserAlbum {
		const id = UserAlbumId.generate();
		const slots = FaceSlots.empty(model.faceCount());
		return new UserAlbum(id, model, slots);
	}

	static of(data: UserAlbumData): UserAlbum {
		const id = UserAlbumId.from(data.id);
		const album = Album.of(data);
		let slots = FaceSlots.empty(album.faceCount());
		if (data.slots !== undefined) {
			slots = FaceSlots.of(data.slots);
		}
		return new UserAlbum(id, album, slots);
	}

	requireFace(face: number): void {
		this.slots.requireFace(face);
	}

	place(face: number, photoId: PhotoId): UserAlbum {
		const slots = this.slots.place(face, photoId);
		return new UserAlbum(this.id, this.album, slots);
	}

	empty(face: number): UserAlbum {
		const slots = this.slots.empty(face);
		return new UserAlbum(this.id, this.album, slots);
	}

	toJSON() {
		const description = this.album.toJSON();
		const slots = this.slots.toJSON();
		return { id: this.id.toString(), ...description, slots };
	}
}
