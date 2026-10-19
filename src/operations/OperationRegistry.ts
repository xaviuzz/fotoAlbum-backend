import { Catalogue } from "../domain/album/Catalogue.ts";
import type { Stores } from "../infrastructure/stores/Stores.ts";
import type { Routes } from "../Routes.ts";
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

	static standard(stores: Stores): OperationRegistry {
		const catalogue = Catalogue.seeded();
		return new OperationRegistry([
			new JsonOperation(new HealthCheck()),
			new JsonOperation(new AlbumList(catalogue)),
			new JsonOperation(new AlbumGet(catalogue)),
			new JsonOperation(new PhotoList(stores.photos)),
			new MultipartOperation(new PhotoUpload(stores.photos)),
			new JsonOperation(new UserAlbumCreate(catalogue, stores.userAlbums)),
			new JsonOperation(new UserAlbumGet(stores.userAlbums)),
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
