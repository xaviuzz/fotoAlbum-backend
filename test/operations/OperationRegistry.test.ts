import { expect, test } from "bun:test";
import type { Operation } from "../../src/operations/Operation.ts";
import { OperationRegistry } from "../../src/operations/OperationRegistry.ts";

class StubOperation implements Operation {
	constructor(readonly name: string) {}

	async serve(): Promise<Response> {
		return new Response(this.name);
	}
}

test("finds a registered operation by name", async () => {
	const registry = new OperationRegistry([new StubOperation("health.check")]);

	const operation = registry.find("health.check");

	const response = await operation.serve(new Request("http://x/health.check"));
	expect(await response.text()).toBe("health.check");
});

test("an unknown name answers 404", async () => {
	const registry = new OperationRegistry([new StubOperation("health.check")]);

	const operation = registry.find("nothing.here");

	const response = await operation.serve(new Request("http://x/nothing.here"));
	expect(response.status).toBe(404);
});

test("an empty registry answers 404 for any name", async () => {
	const registry = new OperationRegistry([]);

	const operation = registry.find("health.check");

	const response = await operation.serve(new Request("http://x/health.check"));
	expect(response.status).toBe(404);
});

test("lists the names of the registered operations", () => {
	const registry = new OperationRegistry([
		new StubOperation("a.one"),
		new StubOperation("b.two"),
	]);

	expect(registry.names()).toEqual(["a.one", "b.two"]);
});
