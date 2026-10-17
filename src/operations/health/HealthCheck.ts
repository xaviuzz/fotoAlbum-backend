import { EnvelopedOperation } from "../EnvelopedOperation.ts";

export class HealthCheck extends EnvelopedOperation {
	readonly name = "health.check";

	protected validate(): void {}

	protected async execute(): Promise<unknown> {
		return { status: "ok" };
	}
}
