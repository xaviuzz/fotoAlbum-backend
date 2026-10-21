import { beforeEach, expect, test } from "bun:test";
import { PhotoId } from "../../../src/domain/photo/PhotoId.ts";
import { FaceNotFoundError } from "../../../src/domain/slot/FaceNotFoundError.ts";
import { FaceSlots } from "../../../src/domain/slot/FaceSlots.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("has one empty slot for each face when made", () => {
	sut.makeFor(3);

	expect(sut.occupants()).toEqual([null, null, null]);
});

test("places a photo in the slot of a face", () => {
	sut.makeFor(3);

	sut.place(2, "a");

	expect(sut.occupants()).toEqual([null, "a", null]);
});

test("replaces the photo of an occupied slot", () => {
	sut.makeFor(3);
	sut.place(2, "a");

	sut.place(2, "b");

	expect(sut.occupants()).toEqual([null, "b", null]);
});

test("takes a photo out of its previous slot when it is placed in another", () => {
	sut.makeFor(3);
	sut.place(1, "a");

	sut.place(3, "a");

	expect(sut.occupants()).toEqual([null, null, "a"]);
});

test("empties the slot of a face", () => {
	sut.makeFor(3);
	sut.place(2, "a");

	sut.empty(2);

	expect(sut.occupants()).toEqual([null, null, null]);
});

test("accepts emptying a slot that is already empty", () => {
	sut.makeFor(3);

	sut.empty(2);

	expect(sut.occupants()).toEqual([null, null, null]);
});

test("leaves the slots it was made from unchanged", () => {
	sut.makeFor(2);

	sut.place(1, "a");

	expect(sut.untouchedOccupants()).toEqual([null, null]);
});

test("is the same slots after describing and reading them back", () => {
	sut.makeFor(3);
	sut.place(2, "a");

	expect(sut.readBack()).toEqual(sut.description());
});

test("describes each slot by its face and photo", () => {
	sut.makeFor(2);
	sut.place(2, "a");

	expect(sut.description()).toEqual([
		{ face: 1, photoId: null },
		{ face: 2, photoId: SUT.idOf("a") },
	]);
});

test("refuses a face outside the album when placing", () => {
	sut.makeFor(3);

	expect(() => sut.place(0, "a")).toThrow(FaceNotFoundError);
	expect(() => sut.place(4, "a")).toThrow(FaceNotFoundError);
});

test("refuses a face that is not a whole number", () => {
	sut.makeFor(3);

	expect(() => sut.place(1.5, "a")).toThrow(FaceNotFoundError);
	expect(() => sut.empty(Number.NaN)).toThrow(FaceNotFoundError);
});

test("refuses a face outside the album when emptying", () => {
	sut.makeFor(3);

	expect(() => sut.empty(0)).toThrow(FaceNotFoundError);
	expect(() => sut.empty(4)).toThrow(FaceNotFoundError);
});

class SUT {
	private static readonly IDS: Record<string, string> = {
		a: "00000000-0000-0000-0000-00000000000a",
		b: "00000000-0000-0000-0000-00000000000b",
	};

	private initial = FaceSlots.empty(0);
	private slots = FaceSlots.empty(0);

	static idOf(name: string): string {
		return SUT.IDS[name] as string;
	}

	makeFor(faceCount: number): void {
		this.initial = FaceSlots.empty(faceCount);
		this.slots = this.initial;
	}

	place(face: number, name: string): void {
		const photoId = PhotoId.from(SUT.idOf(name));
		this.slots = this.slots.place(face, photoId);
	}

	empty(face: number): void {
		this.slots = this.slots.empty(face);
	}

	occupants(): (string | null)[] {
		return this.occupantsOf(this.slots);
	}

	untouchedOccupants(): (string | null)[] {
		return this.occupantsOf(this.initial);
	}

	description(): unknown {
		return this.slots.toJSON();
	}

	readBack(): unknown {
		const stored = JSON.parse(JSON.stringify(this.slots));
		return FaceSlots.of(stored).toJSON();
	}

	private occupantsOf(slots: FaceSlots): (string | null)[] {
		const names = Object.keys(SUT.IDS);
		const occupants: (string | null)[] = [];
		for (const slot of slots.toJSON()) {
			let occupant: string | null = null;
			for (const name of names) {
				if (slot.photoId === SUT.idOf(name)) {
					occupant = name;
				}
			}
			occupants.push(occupant);
		}
		return occupants;
	}
}
