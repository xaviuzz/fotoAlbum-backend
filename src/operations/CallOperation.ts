import { Call } from "../call/Call.ts";
import { CallError } from "../call/CallError.ts";
import { InvalidCallError } from "../call/InvalidCallError.ts";
import type { Reply } from "../call/Reply.ts";
import type { Operation } from "./Operation.ts";

export abstract class CallOperation implements Operation {
	abstract readonly name: string;

	protected abstract execute(call: Call): Promise<unknown>;

	async serve(request: Request): Promise<Response> {
		let call: Call;
		try {
			const raw = await request.json();
			call = Call.from(raw);
		} catch (error) {
			return this.unreadable(error);
		}
		const answer = await this.answer(call);
		return Response.json(answer);
	}

	private async answer(call: Call): Promise<Reply> {
		let answer: Reply;
		try {
			const result = await this.execute(call);
			answer = call.ok(result);
		} catch (error) {
			answer = this.failureFor(call, error);
		}
		return answer;
	}

	private failureFor(call: Call, error: unknown): Reply {
		let answer = call.failure("INTERNAL_ERROR", "internal error");
		if (error instanceof CallError) {
			answer = call.failure(error.code, error.message);
		}
		return answer;
	}

	private unreadable(error: unknown): Response {
		let message = "call is not readable JSON";
		if (error instanceof InvalidCallError) {
			message = error.message;
		}
		const body = { code: "INVALID_BODY", message };
		return Response.json(body, { status: 400 });
	}
}
