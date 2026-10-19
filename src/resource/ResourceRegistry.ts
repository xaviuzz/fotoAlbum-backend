import type { PhotoStore } from "../photo/PhotoStore.ts";
import { ThumbnailRoute } from "../photo/ThumbnailRoute.ts";
import type { Routes } from "../Routes.ts";
import type { ResourceRoute } from "./ResourceRoute.ts";

export class ResourceRegistry {
	constructor(private readonly resources: ResourceRoute[]) {}

	static standard(photoStore: PhotoStore): ResourceRegistry {
		return new ResourceRegistry([new ThumbnailRoute(photoStore)]);
	}

	routes(): Routes {
		const routes: Routes = {};
		for (const resource of this.resources) {
			routes[resource.path] = {
				GET: (request) => resource.serve(request),
			};
		}
		return routes;
	}
}
