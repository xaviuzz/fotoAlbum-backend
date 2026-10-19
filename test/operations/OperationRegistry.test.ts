import { beforeEach, expect, test } from "bun:test";
import type { Operation } from "../../src/operations/Operation.ts";
import { OperationRegistry } from "../../src/operations/OperationRegistry.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("lists the names of the registered operations", () => {
	sut.register("a.one", "b.two");

	expect(sut.registeredNames()).toEqual(["a.one", "b.two"]);
});

test("hands over each operation as a POST route under its name", async () => {
	sut.register("health.check", "album.list");

	const paths = sut.routePaths();
	const answer = await sut.answerToPost("/album.list");

	expect(paths).toEqual(["/health.check", "/album.list"]);
	expect(sut.methodsOf("/health.check")).toEqual(["POST"]);
	expect(answer).toBe("album.list");
});

class SUT {
	private registry = new OperationRegistry([]);

	register(...names: string[]): void {
		const operations = names.map((name) => new StubOperation(name));
		this.registry = new OperationRegistry(operations);
	}

	routePaths(): string[] {
		return Object.keys(this.registry.routes());
	}

	methodsOf(path: string): string[] {
		return Object.keys(this.registry.routes()[path]);
	}

	async answerToPost(path: string): Promise<string> {
		const post = this.registry.routes()[path].POST;
		const response = await post?.(new Request(`http://x${path}`));
		const answer = await response?.text();
		return answer ?? "";
	}

	registeredNames(): string[] {
		return this.registry.names();
	}
}

class StubOperation implements Operation {
	constructor(readonly name: string) {}

	async serve(): Promise<Response> {
		return new Response(this.name);
	}
}
