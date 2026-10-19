import { beforeAll, expect, test } from "bun:test";
import { OperationRegistry } from "../src/operations/OperationRegistry.ts";
import { PhotoStore } from "../src/photo/PhotoStore.ts";
import { OpenApiRoutes } from "./OpenApiRoutes.ts";

let sut: SUT;

beforeAll(async () => {
	sut = await SUT.read();
});

test("the contract declares at least one route", () => {
	expect(sut.routeCount()).toBeGreaterThan(0);
});

test("every registered operation is in the contract", () => {
	expect(sut.operationsMissingFromContract()).toEqual([]);
});

test("every route in the contract has a registered operation", () => {
	expect(sut.routesMissingFromOperations()).toEqual([]);
});

test("every route served apart from the operations is in the contract", () => {
	expect(sut.servedApartMissingFromContract()).toEqual([]);
});

const SERVED_APART = ["photos/{sessionId}/{photoId}/thumbnail"];

class SUT {
	static async read(): Promise<SUT> {
		const contract = await OpenApiRoutes.read("openapi.yaml");
		const registered = OperationRegistry.standard(
			new PhotoStore("data"),
		).names();
		return new SUT(contract.names, registered);
	}

	private constructor(
		private readonly routes: string[],
		private readonly operations: string[],
	) {}

	routeCount(): number {
		return this.routes.length;
	}

	operationsMissingFromContract(): string[] {
		return this.missingFrom(this.operations, this.routes);
	}

	routesMissingFromOperations(): string[] {
		const available = [...this.operations, ...SERVED_APART];
		return this.missingFrom(this.routes, available);
	}

	servedApartMissingFromContract(): string[] {
		return this.missingFrom(SERVED_APART, this.routes);
	}

	private missingFrom(wanted: string[], available: string[]): string[] {
		const missing: string[] = [];
		for (const name of wanted) {
			if (!available.includes(name)) {
				missing.push(name);
			}
		}
		return missing;
	}
}
