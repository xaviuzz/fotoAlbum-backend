import { Catalogue } from "../album/Catalogue.ts";
import type { PhotoStore } from "../photo/PhotoStore.ts";
import type { UserAlbumStore } from "../userAlbum/UserAlbumStore.ts";
import { AlbumGet } from "./album/AlbumGet.ts";
import { AlbumList } from "./album/AlbumList.ts";
import { HealthCheck } from "./health/HealthCheck.ts";
import { NoOperation } from "./NoOperation.ts";
import type { Operation } from "./Operation.ts";
import { PhotoList } from "./photo/PhotoList.ts";
import { PhotoUpload } from "./photo/PhotoUpload.ts";
import { UserAlbumCreate } from "./userAlbum/UserAlbumCreate.ts";
import { UserAlbumGet } from "./userAlbum/UserAlbumGet.ts";

export class OperationRegistry {
	private readonly operationsByName = new Map<string, Operation>();

	constructor(operations: Operation[]) {
		for (const operation of operations) {
			this.operationsByName.set(operation.name, operation);
		}
	}

	static standard(
		photoStore: PhotoStore,
		userAlbumStore: UserAlbumStore,
	): OperationRegistry {
		const catalogue = Catalogue.seeded();
		return new OperationRegistry([
			new HealthCheck(),
			new AlbumList(catalogue),
			new AlbumGet(catalogue),
			new PhotoList(photoStore),
			new PhotoUpload(photoStore),
			new UserAlbumCreate(catalogue, userAlbumStore),
			new UserAlbumGet(userAlbumStore),
		]);
	}

	find(name: string): Operation {
		let found: Operation = new NoOperation();
		const registered = this.operationsByName.get(name);
		if (registered !== undefined) {
			found = registered;
		}
		return found;
	}

	names(): string[] {
		return [...this.operationsByName.keys()];
	}
}
