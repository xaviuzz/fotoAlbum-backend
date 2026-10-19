import { OperationRegistry } from "./operations/OperationRegistry.ts";
import { ResourceRegistry } from "./resource/ResourceRegistry.ts";
import { Stores } from "./Stores.ts";

const ONE_GIGABYTE = 1024 * 1024 * 1024;

export class Server {
	private constructor(private readonly bunServer: Bun.Server<undefined>) {}

	static start(port: number, dataDir: string): Server {
		const stores = Stores.under(dataDir);
		const operations = OperationRegistry.standard(stores);
		const resources = ResourceRegistry.standard(stores);
		const bunServer = Bun.serve({
			port,
			maxRequestBodySize: ONE_GIGABYTE,
			routes: { ...operations.routes(), ...resources.routes() },
			fetch: () => new Response(null, { status: 404 }),
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
