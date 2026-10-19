import {
	type JsonHandler,
	JsonTransport,
} from "../infrastructure/transport/JsonTransport.ts";
import type { Operation } from "./Operation.ts";

export class JsonOperation implements Operation {
	private readonly transport = new JsonTransport();

	constructor(private readonly handler: JsonHandler) {}

	get name(): string {
		return this.handler.name;
	}

	serve(request: Request): Promise<Response> {
		return this.transport.serve(request, this.handler);
	}
}
