import { Call } from "../../call/Call.ts";
import { InvalidCallError } from "../../call/InvalidCallError.ts";
import type { Reply } from "../../call/Reply.ts";
import { UnreadableCall } from "../../call/UnreadableCall.ts";

export type JsonHandler = {
	readonly name: string;
	execute(call: Call): Promise<unknown>;
};

export class JsonTransport {
	async serve(request: Request, handler: JsonHandler): Promise<Response> {
		let call: Call;
		try {
			const raw = await request.json();
			call = Call.from(raw);
		} catch (error) {
			return this.unreadable(error);
		}
		const answer = await this.answer(call, handler);
		return Response.json(answer);
	}

	private async answer(call: Call, handler: JsonHandler): Promise<Reply> {
		let answer: Reply;
		try {
			const result = await handler.execute(call);
			answer = call.ok(result);
		} catch (error) {
			answer = call.failureFrom(error);
		}
		return answer;
	}

	private unreadable(error: unknown): Response {
		let message = "call is not readable JSON";
		if (error instanceof InvalidCallError) {
			message = error.message;
		}
		return new UnreadableCall(message).toResponse();
	}
}
