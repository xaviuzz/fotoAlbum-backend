import { Catalogue } from "../album/Catalogue.ts";
import type { PhotoStore } from "../photo/PhotoStore.ts";
import type { Routes } from "../Routes.ts";
import type { UserAlbumStore } from "../userAlbum/UserAlbumStore.ts";
import { AlbumGet } from "./album/AlbumGet.ts";
import { AlbumList } from "./album/AlbumList.ts";
import { HealthCheck } from "./health/HealthCheck.ts";
import { JsonOperation } from "./JsonOperation.ts";
import { MultipartOperation } from "./MultipartOperation.ts";
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
			new JsonOperation(new HealthCheck()),
			new JsonOperation(new AlbumList(catalogue)),
			new JsonOperation(new AlbumGet(catalogue)),
			new JsonOperation(new PhotoList(photoStore)),
			new MultipartOperation(new PhotoUpload(photoStore)),
			new JsonOperation(new UserAlbumCreate(catalogue, userAlbumStore)),
			new JsonOperation(new UserAlbumGet(userAlbumStore)),
		]);
	}

	routes(): Routes {
		const routes: Routes = {};
		for (const operation of this.operationsByName.values()) {
			routes[`/${operation.name}`] = {
				POST: (request) => operation.serve(request),
			};
		}
		return routes;
	}

	names(): string[] {
		return [...this.operationsByName.keys()];
	}
}
