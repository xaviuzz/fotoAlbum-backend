import type { Stores } from "../infrastructure/stores/Stores.ts";
import type { Routes } from "../Routes.ts";
import { ThumbnailRoute } from "./photo/ThumbnailRoute.ts";
import type { ResourceRoute } from "./ResourceRoute.ts";

export class ResourceRegistry {
	constructor(private readonly resources: ResourceRoute[]) {}

	static standard(stores: Stores): ResourceRegistry {
		return new ResourceRegistry([new ThumbnailRoute(stores.photos)]);
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
