import { beforeEach, expect, test } from "bun:test";
import { Album } from "../../../src/domain/album/Album.ts";
import { PhotoId } from "../../../src/domain/photo/PhotoId.ts";
import { FaceNotFoundError } from "../../../src/domain/slot/FaceNotFoundError.ts";
import { UserAlbum } from "../../../src/domain/userAlbum/UserAlbum.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("copies the commercial name, measures and binding of its model", () => {
	sut.makeFrom(sut.model());

	expect(sut.description()).toMatchObject({
		reference: "PT-150",
		commercialName: "Retrato de bolsillo",
		albumSize: { width: 150, height: 210 },
		pageSize: { width: 140, height: 200 },
		pageCount: 20,
		binding: "softcover",
		orientation: "portrait",
	});
});

test("gets a new id each time it is made", () => {
	const first = sut.makeFrom(sut.model()).id();
	const second = sut.makeFrom(sut.model()).id();

	expect(first).not.toBe(second);
});

test("is the same user album after describing and reading it back", () => {
	sut.makeFrom(sut.model());

	expect(sut.readBack()).toEqual(sut.description());
});

test("has an empty slot on each face when made", () => {
	sut.makeFrom(sut.model());

	expect(sut.occupiedFaces()).toEqual([]);
	expect(sut.slotCount()).toBe(20);
});

test("places a photo on a face", () => {
	sut.makeFrom(sut.model());

	sut.place(3, SUT.PHOTO);

	expect(sut.occupiedFaces()).toEqual([3]);
});

test("empties the slot of a face", () => {
	sut.makeFrom(sut.model());
	sut.place(3, SUT.PHOTO);

	sut.empty(3);

	expect(sut.occupiedFaces()).toEqual([]);
});

test("keeps its slots after describing and reading it back", () => {
	sut.makeFrom(sut.model());
	sut.place(3, SUT.PHOTO);

	expect(sut.readBack()).toEqual(sut.description());
});

test("reads a stored description without slots as every slot empty", () => {
	sut.makeFrom(sut.model());

	sut.readBackWithoutSlots();

	expect(sut.occupiedFaces()).toEqual([]);
	expect(sut.slotCount()).toBe(20);
});

test("refuses a face beyond the page count", () => {
	sut.makeFrom(sut.model());

	expect(() => sut.place(21, SUT.PHOTO)).toThrow(FaceNotFoundError);
	expect(() => sut.requireFace(21)).toThrow(FaceNotFoundError);
});

class SUT {
	static readonly PHOTO = "00000000-0000-0000-0000-00000000000a";

	private userAlbum: UserAlbum | undefined;

	model(): Album {
		return Album.of({
			reference: "PT-150",
			commercialName: "Retrato de bolsillo",
			albumSize: { width: 150, height: 210 },
			pageSize: { width: 140, height: 200 },
			pageCount: 20,
			binding: "softcover",
		});
	}

	makeFrom(model: Album): SUT {
		this.userAlbum = UserAlbum.from(model);
		return this;
	}

	place(face: number, photoId: string): void {
		this.userAlbum = this.userAlbum?.place(face, PhotoId.from(photoId));
	}

	empty(face: number): void {
		this.userAlbum = this.userAlbum?.empty(face);
	}

	requireFace(face: number): void {
		this.userAlbum?.requireFace(face);
	}

	occupiedFaces(): number[] {
		const faces: number[] = [];
		for (const slot of this.slots()) {
			if (slot.photoId !== null) {
				faces.push(slot.face);
			}
		}
		return faces;
	}

	slotCount(): number {
		return this.slots().length;
	}

	readBackWithoutSlots(): void {
		const { slots, ...stored } = JSON.parse(JSON.stringify(this.userAlbum));
		this.userAlbum = UserAlbum.of(stored);
	}

	id(): string | undefined {
		return this.userAlbum?.toJSON().id;
	}

	description(): unknown {
		return this.userAlbum?.toJSON();
	}

	readBack(): unknown {
		const stored = JSON.parse(JSON.stringify(this.userAlbum));
		return UserAlbum.of(stored).toJSON();
	}

	private slots(): { face: number; photoId: string | null }[] {
		return this.userAlbum?.toJSON().slots ?? [];
	}
}
