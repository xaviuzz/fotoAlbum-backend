import { beforeEach, expect, test } from "bun:test";
import { Album } from "../../src/album/Album.ts";
import { UserAlbum } from "../../src/userAlbum/UserAlbum.ts";

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

class SUT {
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
}
