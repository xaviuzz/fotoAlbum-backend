import { PhotoId } from "../photo/PhotoId.ts";

export type SlotData = { face: number; photoId: string | null };

export class Slot {
	private constructor(
		private readonly face: number,
		private readonly occupant: PhotoId | null,
	) {}

	static empty(face: number): Slot {
		return new Slot(face, null);
	}

	static of(data: SlotData): Slot {
		let occupant: PhotoId | null = null;
		if (data.photoId !== null) {
			occupant = PhotoId.from(data.photoId);
		}
		return new Slot(data.face, occupant);
	}

	receiving(face: number, photoId: PhotoId): Slot {
		let slot: Slot = this;
		if (this.face === face) {
			slot = new Slot(this.face, photoId);
		} else if (this.holds(photoId)) {
			slot = Slot.empty(this.face);
		}
		return slot;
	}

	releasing(face: number): Slot {
		let slot: Slot = this;
		if (this.face === face) {
			slot = Slot.empty(this.face);
		}
		return slot;
	}

	toJSON(): SlotData {
		let photoId: string | null = null;
		if (this.occupant !== null) {
			photoId = this.occupant.toString();
		}
		return { face: this.face, photoId };
	}

	private holds(photoId: PhotoId): boolean {
		const isOccupied = this.occupant !== null;
		const isSamePhoto = this.occupant?.toString() === photoId.toString();
		return isOccupied && isSamePhoto;
	}
}
