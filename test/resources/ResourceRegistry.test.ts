import { beforeEach, expect, test } from "bun:test";
import { ResourceRegistry } from "../../src/resources/ResourceRegistry.ts";
import type { ResourceRoute } from "../../src/resources/ResourceRoute.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("hands over each resource as a GET route under its path", async () => {
	sut.register("/a/:id", "/b/:id");

	const paths = sut.routePaths();
	const answer = await sut.answerToGet("/b/:id");

	expect(paths).toEqual(["/a/:id", "/b/:id"]);
	expect(sut.methodsOf("/a/:id")).toEqual(["GET"]);
	expect(answer).toBe("/b/:id");
});

class SUT {
	private registry = new ResourceRegistry([]);

	register(...paths: string[]): void {
		const resources = paths.map((path) => new StubResource(path));
		this.registry = new ResourceRegistry(resources);
	}

	routePaths(): string[] {
		return Object.keys(this.registry.routes());
	}

	methodsOf(path: string): string[] {
		return Object.keys(this.registry.routes()[path]);
	}

	async answerToGet(path: string): Promise<string> {
		const get = this.registry.routes()[path].GET;
		const response = await get?.(new Request(`http://x${path}`));
		const answer = await response?.text();
		return answer ?? "";
	}
}

class StubResource implements ResourceRoute {
	constructor(readonly path: string) {}

	async serve(): Promise<Response> {
		return new Response(this.path);
	}
}
