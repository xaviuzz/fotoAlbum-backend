import { InvalidEnvelopeError } from "../envelope/InvalidEnvelopeError.ts";
import { RequestEnvelope } from "../envelope/RequestEnvelope.ts";
import { ResponseEnvelope } from "../envelope/ResponseEnvelope.ts";
import { InvalidRequestError } from "./InvalidRequestError.ts";
import type { Operation } from "./Operation.ts";

type Body = Record<string, unknown>;

export abstract class EnvelopedOperation implements Operation {
	abstract readonly name: string;

	protected abstract validate(body: Body): void;

	protected abstract execute(body: Body): Promise<unknown>;

	async serve(request: Request): Promise<Response> {
		let envelope: RequestEnvelope;
		try {
			const raw = await request.json();
			envelope = RequestEnvelope.from(raw);
		} catch (error) {
			return this.unreadable(error);
		}
		const answer = await this.answer(envelope);
		return Response.json(answer);
	}

	private async answer(envelope: RequestEnvelope): Promise<ResponseEnvelope> {
		const requestId = envelope.requestId;
		let answer: ResponseEnvelope;
		try {
			this.validate(envelope.body);
			const result = await this.execute(envelope.body);
			answer = ResponseEnvelope.ok(requestId, result);
		} catch (error) {
			answer = this.failureFor(requestId, error);
		}
		return answer;
	}

	private failureFor(requestId: string, error: unknown): ResponseEnvelope {
		let answer = ResponseEnvelope.failure(
			requestId,
			"INTERNAL_ERROR",
			"internal error",
		);
		if (error instanceof InvalidRequestError) {
			answer = ResponseEnvelope.failure(
				requestId,
				"INVALID_REQUEST",
				error.message,
			);
		}
		return answer;
	}

	private unreadable(error: unknown): Response {
		let message = "request is not readable JSON";
		if (error instanceof InvalidEnvelopeError) {
			message = error.message;
		}
		const body = { code: "INVALID_REQUEST", message };
		return Response.json(body, { status: 400 });
	}
}
