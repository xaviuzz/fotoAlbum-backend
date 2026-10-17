import { afterAll, expect, test } from "bun:test";
import { Server } from "../src/server.ts";

const server = Server.start(0);

afterAll(() => server.stop());

test("POST /health.check answers 200 ok end to end", async () => {
	const payload = JSON.stringify({ header: { callId: "e-1" } });

	const response = await fetch(`${server.url}health.check`, {
		method: "POST",
		body: payload,
	});

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		header: { callId: "e-1", status: "ok" },
		body: { status: "ok" },
	});
});

test("an unknown URL answers 404", async () => {
	const response = await fetch(`${server.url}nothing.here`, {
		method: "POST",
		body: "{}",
	});

	expect(response.status).toBe(404);
});
