import { expect, test } from "bun:test";
import { HealthCheck } from "../../../src/operations/health/HealthCheck.ts";

test("health.check answers ok", async () => {
	const payload = JSON.stringify({ header: { requestId: "h-1" } });
	const request = new Request("http://x/health.check", {
		method: "POST",
		body: payload,
	});

	const response = await new HealthCheck().serve(request);

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		header: { requestId: "h-1", status: "ok" },
		body: { status: "ok" },
	});
});

test("is named health.check", () => {
	expect(new HealthCheck().name).toBe("health.check");
});
