import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class HealthCheck implements JsonHandler {
	readonly name = "health.check";

	async execute(): Promise<unknown> {
		return { status: "ok" };
	}
}
