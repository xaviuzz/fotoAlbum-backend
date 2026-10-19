import {
	type MultipartHandler,
	MultipartTransport,
} from "../transport/MultipartTransport.ts";
import type { Operation } from "./Operation.ts";

export class MultipartOperation implements Operation {
	private readonly transport = new MultipartTransport();

	constructor(private readonly handler: MultipartHandler) {}

	get name(): string {
		return this.handler.name;
	}

	serve(request: Request): Promise<Response> {
		return this.transport.serve(request, this.handler);
	}
}
