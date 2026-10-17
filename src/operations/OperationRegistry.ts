import { HealthCheck } from "./health/HealthCheck.ts";
import { NoOperation } from "./NoOperation.ts";
import type { Operation } from "./Operation.ts";

export class OperationRegistry {
	private readonly operationsByName = new Map<string, Operation>();

	constructor(operations: Operation[]) {
		for (const operation of operations) {
			this.operationsByName.set(operation.name, operation);
		}
	}

	static standard(): OperationRegistry {
		return new OperationRegistry([new HealthCheck()]);
	}

	find(name: string): Operation {
		let found: Operation = new NoOperation();
		const registered = this.operationsByName.get(name);
		if (registered !== undefined) {
			found = registered;
		}
		return found;
	}

	names(): string[] {
		return [...this.operationsByName.keys()];
	}
}
