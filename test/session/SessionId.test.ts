import { expect, test } from "bun:test";
import { SessionId } from "../../src/session/SessionId.ts";
import { SessionRequiredError } from "../../src/session/SessionRequiredError.ts";

test("places itself as a folder inside a root", () => {
	const sessionId = SessionId.from("abc-123_X");

	expect(sessionId.pathIn("/data")).toBe("/data/abc-123_X");
});

test("accepts up to 64 characters", () => {
	const code = "a".repeat(64);

	expect(SessionId.from(code).pathIn("/data")).toBe(`/data/${code}`);
});

test("rejects a missing code", () => {
	expect(() => SessionId.from(undefined)).toThrow(SessionRequiredError);
});

test("rejects a code that is not text", () => {
	expect(() => SessionId.from(7)).toThrow(SessionRequiredError);
});

test("rejects an empty code", () => {
	expect(() => SessionId.from("")).toThrow(SessionRequiredError);
});

test("rejects more than 64 characters", () => {
	expect(() => SessionId.from("a".repeat(65))).toThrow(SessionRequiredError);
});

test("rejects a code that could leave its folder", () => {
	expect(() => SessionId.from("..")).toThrow(SessionRequiredError);
	expect(() => SessionId.from("../x")).toThrow(SessionRequiredError);
	expect(() => SessionId.from("a/b")).toThrow(SessionRequiredError);
	expect(() => SessionId.from("a b")).toThrow(SessionRequiredError);
});
