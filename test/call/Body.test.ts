import { expect, test } from "bun:test";
import { Body } from "../../src/call/Body.ts";
import { InvalidBodyError } from "../../src/call/InvalidBodyError.ts";
import { InvalidCallError } from "../../src/call/InvalidCallError.ts";

test("reads a required text field", () => {
	const body = Body.from({ name: "x" });

	expect(body.requireText("name")).toBe("x");
});

test("rejects a missing text field", () => {
	const body = Body.empty();

	expect(() => body.requireText("name")).toThrow(InvalidBodyError);
});

test("rejects a field that is not text", () => {
	const body = Body.from({ name: 7 });

	expect(() => body.requireText("name")).toThrow(InvalidBodyError);
});

test("reads a required number field", () => {
	const body = Body.from({ face: 3 });

	expect(body.requireNumber("face")).toBe(3);
});

test("rejects a missing number field", () => {
	const body = Body.empty();

	expect(() => body.requireNumber("face")).toThrow(InvalidBodyError);
});

test("rejects a field that is not a number", () => {
	const body = Body.from({ face: "3" });

	expect(() => body.requireNumber("face")).toThrow(InvalidBodyError);
});

test("names the missing field in the problem", () => {
	const body = Body.empty();

	expect(() => body.requireText("name")).toThrow("name is required");
});

test("rejects a body that is not an object", () => {
	expect(() => Body.from("hello")).toThrow(InvalidCallError);
	expect(() => Body.from(null)).toThrow(InvalidCallError);
});
