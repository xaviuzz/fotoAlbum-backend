import { InvalidEnvelopeError } from "./InvalidEnvelopeError.ts";

type Body = Record<string, unknown>;

export class RequestEnvelope {
	private constructor(
		readonly requestId: string,
		readonly body: Body,
	) {}

	static from(raw: unknown): RequestEnvelope {
		const message = RequestEnvelope.asRecord(raw, "request must be an object");
		const header = RequestEnvelope.asRecord(
			message.header,
			"header must be an object",
		);
		const requestId = header.requestId;
		const isText = typeof requestId === "string";
		const isPresent = isText && requestId.length > 0;
		if (!isPresent) {
			throw new InvalidEnvelopeError("header.requestId is required");
		}

		let body: Body = {};
		if (message.body !== undefined) {
			body = RequestEnvelope.asRecord(message.body, "body must be an object");
		}

		return new RequestEnvelope(requestId, body);
	}

	private static asRecord(value: unknown, problem: string): Body {
		const isObject = typeof value === "object" && value !== null;
		if (!isObject) {
			throw new InvalidEnvelopeError(problem);
		}
		return value as Body;
	}
}
