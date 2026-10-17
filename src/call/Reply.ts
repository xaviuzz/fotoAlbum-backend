export type ErrorCode = "INVALID_BODY" | "INTERNAL_ERROR";

type Status = "ok" | "error";

type ReplyMessage = {
	header: { callId: string; status: Status };
	body: unknown;
};

export class Reply {
	private constructor(
		private readonly callId: string,
		private readonly status: Status,
		private readonly body: unknown,
	) {}

	static ok(callId: string, body: unknown): Reply {
		return new Reply(callId, "ok", body);
	}

	static failure(callId: string, code: ErrorCode, message: string): Reply {
		return new Reply(callId, "error", { code, message });
	}

	toJSON(): ReplyMessage {
		const header = { callId: this.callId, status: this.status };
		return { header, body: this.body };
	}
}
