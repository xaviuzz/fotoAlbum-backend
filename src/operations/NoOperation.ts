import type { Operation } from "./Operation.ts";

export class NoOperation implements Operation {
	readonly name = "";

	async serve(): Promise<Response> {
		return new Response(null, { status: 404 });
	}
}
