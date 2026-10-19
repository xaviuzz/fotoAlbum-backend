import { beforeEach, expect, test } from "bun:test";
import { HealthCheck } from "../../../src/operations/health/HealthCheck.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("health.check answers ok", async () => {
	await sut.check("h-1");

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "h-1", status: "ok" },
		body: { status: "ok" },
	});
});

test("is named health.check", () => {
	expect(sut.operationName()).toBe("health.check");
});

class SUT {
	private readonly operation = new JsonOperation(new HealthCheck());
	private response = new Response();

	async check(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		const request = new Request("http://x/health.check", {
			method: "POST",
			body: payload,
		});
		this.response = await this.operation.serve(request);
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<unknown> {
		const reply = await this.response.json();
		return reply;
	}

	operationName(): string {
		return this.operation.name;
	}
}
