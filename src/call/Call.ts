import { Body } from "./Body.ts";
import { InvalidCallError } from "./InvalidCallError.ts";
import { type ErrorCode, Reply } from "./Reply.ts";

type Fields = Record<string, unknown>;

export class Call {
	private constructor(
		private readonly callId: string,
		readonly body: Body,
	) {}

	static from(raw: unknown): Call {
		const message = Call.asRecord(raw, "call must be an object");
		const callId = Call.readCallId(message);
		const body = Call.readBody(message);
		return new Call(callId, body);
	}

	ok(result: unknown): Reply {
		return Reply.ok(this.callId, result);
	}

	failure(code: ErrorCode, message: string): Reply {
		return Reply.failure(this.callId, code, message);
	}

	private static readCallId(message: Fields): string {
		const header = Call.asRecord(message.header, "header must be an object");
		const callId = header.callId;
		const isText = typeof callId === "string";
		const isPresent = isText && callId.length > 0;
		if (!isPresent) {
			throw new InvalidCallError("header.callId is required");
		}
		return callId;
	}

	private static readBody(message: Fields): Body {
		let body = Body.empty();
		if (message.body !== undefined) {
			body = Body.from(message.body);
		}
		return body;
	}

	private static asRecord(value: unknown, problem: string): Fields {
		const isObject = typeof value === "object" && value !== null;
		if (!isObject) {
			throw new InvalidCallError(problem);
		}
		return value as Fields;
	}
}
