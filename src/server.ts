import { OperationRegistry } from "./operations/OperationRegistry.ts";

export class Server {
	private constructor(private readonly bunServer: Bun.Server<undefined>) {}

	static start(port: number): Server {
		const registry = OperationRegistry.standard();
		const bunServer = Bun.serve({
			port,
			fetch: (request) => {
				const name = new URL(request.url).pathname.slice(1);
				return registry.find(name).serve(request);
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
