import { expect, test } from "bun:test";
import { InvalidEnvelopeError } from "../../src/envelope/InvalidEnvelopeError.ts";
import { RequestEnvelope } from "../../src/envelope/RequestEnvelope.ts";

test("reads the request id and the body", () => {
	const raw = { header: { requestId: "abc-1" }, body: { name: "x" } };

	const envelope = RequestEnvelope.from(raw);

	expect(envelope.requestId).toBe("abc-1");
	expect(envelope.body).toEqual({ name: "x" });
});

test("rejects a request without request id", () => {
	const raw = { header: {}, body: {} };

	expect(() => RequestEnvelope.from(raw)).toThrow(InvalidEnvelopeError);
});

test("rejects a request without header", () => {
	const raw = { body: {} };

	expect(() => RequestEnvelope.from(raw)).toThrow(InvalidEnvelopeError);
});

test("rejects a request id that is not text", () => {
	const raw = { header: { requestId: 7 }, body: {} };

	expect(() => RequestEnvelope.from(raw)).toThrow(InvalidEnvelopeError);
});

test("rejects an empty request id", () => {
	const raw = { header: { requestId: "" }, body: {} };

	expect(() => RequestEnvelope.from(raw)).toThrow(InvalidEnvelopeError);
});

test("rejects a payload that is not an object", () => {
	expect(() => RequestEnvelope.from("hello")).toThrow(InvalidEnvelopeError);
	expect(() => RequestEnvelope.from(null)).toThrow(InvalidEnvelopeError);
});

test("defaults a missing body to an empty object", () => {
	const raw = { header: { requestId: "abc-1" } };

	const envelope = RequestEnvelope.from(raw);

	expect(envelope.body).toEqual({});
});
