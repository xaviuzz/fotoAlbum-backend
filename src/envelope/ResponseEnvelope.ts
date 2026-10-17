export type ErrorCode = "INVALID_REQUEST" | "INTERNAL_ERROR";

type Status = "ok" | "error";

type ResponseMessage = {
	header: { requestId: string; status: Status };
	body: unknown;
};

export class ResponseEnvelope {
	private constructor(
		private readonly requestId: string,
		private readonly status: Status,
		private readonly body: unknown,
	) {}

	static ok(requestId: string, body: unknown): ResponseEnvelope {
		return new ResponseEnvelope(requestId, "ok", body);
	}

	static failure(
		requestId: string,
		code: ErrorCode,
		message: string,
	): ResponseEnvelope {
		return new ResponseEnvelope(requestId, "error", { code, message });
	}

	toJSON(): ResponseMessage {
		const header = { requestId: this.requestId, status: this.status };
		return { header, body: this.body };
	}
}
