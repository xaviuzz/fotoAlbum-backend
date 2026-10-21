import type { PhotoId } from "../photo/PhotoId.ts";
import { FaceNotFoundError } from "./FaceNotFoundError.ts";
import { Slot, type SlotData } from "./Slot.ts";

export class FaceSlots {
	private constructor(private readonly slots: Slot[]) {}

	static empty(faceCount: number): FaceSlots {
		const slots: Slot[] = [];
		for (let face = 1; face <= faceCount; face++) {
			slots.push(Slot.empty(face));
		}
		return new FaceSlots(slots);
	}

	static of(data: SlotData[]): FaceSlots {
		const slots: Slot[] = [];
		for (const entry of data) {
			slots.push(Slot.of(entry));
		}
		return new FaceSlots(slots);
	}

	requireFace(face: number): void {
		const isWhole = Number.isInteger(face);
		const isAtLeastFirst = face >= 1;
		const isAtMostLast = face <= this.slots.length;
		if (!isWhole || !isAtLeastFirst || !isAtMostLast) {
			throw new FaceNotFoundError("face not found");
		}
	}

	place(face: number, photoId: PhotoId): FaceSlots {
		this.requireFace(face);
		const slots: Slot[] = [];
		for (const slot of this.slots) {
			slots.push(slot.receiving(face, photoId));
		}
		return new FaceSlots(slots);
	}

	empty(face: number): FaceSlots {
		this.requireFace(face);
		const slots: Slot[] = [];
		for (const slot of this.slots) {
			slots.push(slot.releasing(face));
		}
		return new FaceSlots(slots);
	}

	toJSON(): SlotData[] {
		const data: SlotData[] = [];
		for (const slot of this.slots) {
			data.push(slot.toJSON());
		}
		return data;
	}
}
