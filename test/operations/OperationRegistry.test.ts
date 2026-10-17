import { beforeEach, expect, test } from "bun:test";
import type { Operation } from "../../src/operations/Operation.ts";
import { OperationRegistry } from "../../src/operations/OperationRegistry.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("finds a registered operation by name", async () => {
	sut.register("health.check");

	const answer = await sut.answerTo("health.check");

	expect(answer).toBe("health.check");
});

test("an unknown name answers 404", async () => {
	sut.register("health.check");

	const status = await sut.statusFor("nothing.here");

	expect(status).toBe(404);
});

test("an empty registry answers 404 for any name", async () => {
	const status = await sut.statusFor("health.check");

	expect(status).toBe(404);
});

test("lists the names of the registered operations", () => {
	sut.register("a.one", "b.two");

	expect(sut.registeredNames()).toEqual(["a.one", "b.two"]);
});

class SUT {
	private registry = new OperationRegistry([]);

	register(...names: string[]): void {
		const operations = names.map((name) => new StubOperation(name));
		this.registry = new OperationRegistry(operations);
	}

	async answerTo(name: string): Promise<string> {
		const response = await this.serve(name);
		const answer = await response.text();
		return answer;
	}

	async statusFor(name: string): Promise<number> {
		const response = await this.serve(name);
		return response.status;
	}

	registeredNames(): string[] {
		return this.registry.names();
	}

	private async serve(name: string): Promise<Response> {
		const operation = this.registry.find(name);
		const response = await operation.serve(new Request(`http://x/${name}`));
		return response;
	}
}

class StubOperation implements Operation {
	constructor(readonly name: string) {}

	async serve(): Promise<Response> {
		return new Response(this.name);
	}
}
