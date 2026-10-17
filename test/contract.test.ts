import { expect, test } from "bun:test";
import { OperationRegistry } from "../src/operations/OperationRegistry.ts";
import { OpenApiRoutes } from "./OpenApiRoutes.ts";

const contract = await OpenApiRoutes.read("openapi.yaml");
const registered = OperationRegistry.standard().names();

function missingFrom(wanted: string[], available: string[]): string[] {
	const missing: string[] = [];
	for (const name of wanted) {
		if (!available.includes(name)) {
			missing.push(name);
		}
	}
	return missing;
}

test("the contract declares at least one route", () => {
	expect(contract.names.length).toBeGreaterThan(0);
});

test("every registered operation is in the contract", () => {
	expect(missingFrom(registered, contract.names)).toEqual([]);
});

test("every route in the contract has a registered operation", () => {
	expect(missingFrom(contract.names, registered)).toEqual([]);
});
