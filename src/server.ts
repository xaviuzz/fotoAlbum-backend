import { OperationRegistry } from "./operations/OperationRegistry.ts";
import { PhotoStore } from "./photo/PhotoStore.ts";
import { ThumbnailRoute } from "./photo/ThumbnailRoute.ts";

const ONE_GIGABYTE = 1024 * 1024 * 1024;

export class Server {
	private constructor(private readonly bunServer: Bun.Server<undefined>) {}

	static start(port: number, dataDir: string): Server {
		const store = new PhotoStore(dataDir);
		const registry = OperationRegistry.standard(store);
		const thumbnails = new ThumbnailRoute(store);
		const bunServer = Bun.serve({
			port,
			maxRequestBodySize: ONE_GIGABYTE,
			fetch: (request) => {
				let response: Promise<Response>;
				if (thumbnails.serves(request)) {
					response = thumbnails.serve(request);
				} else {
					const name = new URL(request.url).pathname.slice(1);
					response = registry.find(name).serve(request);
				}
				return response;
			},
			error: () => new Response(null, { status: 500 }),
		});
		return new Server(bunServer);
	}

	get url(): URL {
		return this.bunServer.url;
	}

	stop(): void {
		this.bunServer.stop(true);
	}
}
