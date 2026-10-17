import { CallOperation } from "../CallOperation.ts";

export class HealthCheck extends CallOperation {
	readonly name = "health.check";

	protected validate(): void {}

	protected async execute(): Promise<unknown> {
		return { status: "ok" };
	}
}
