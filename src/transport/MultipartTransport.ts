import { Call } from "../call/Call.ts";
import type { Reply } from "../call/Reply.ts";
import { UnreadableCall } from "../call/UnreadableCall.ts";

export type MultipartHandler = {
	readonly name: string;
	execute(call: Call, files: File[]): Promise<unknown>;
};

export class MultipartTransport {
	async serve(request: Request, handler: MultipartHandler): Promise<Response> {
		let response: Response;
		try {
			const form = await request.formData();
			const call = this.readCall(form);
			const files = this.readFiles(form);
			const reply = await this.answer(call, files, handler);
			response = Response.json(reply);
		} catch {
			response = this.unreadable();
		}
		return response;
	}

	private readCall(form: FormData): Call {
		const callId = form.get("callId");
		const sessionId = form.get("sessionId");
		const header = { callId, sessionId: sessionId ?? undefined };
		return Call.from({ header });
	}

	private readFiles(form: FormData): File[] {
		const files: File[] = [];
		for (const entry of form.getAll("files")) {
			if (entry instanceof File) {
				files.push(entry);
			}
		}
		return files;
	}

	private async answer(
		call: Call,
		files: File[],
		handler: MultipartHandler,
	): Promise<Reply> {
		let reply: Reply;
		try {
			const result = await handler.execute(call, files);
			reply = call.ok(result);
		} catch (error) {
			reply = call.failureFrom(error);
		}
		return reply;
	}

	private unreadable(): Response {
		const unreadable = new UnreadableCall("call is not a readable form");
		return unreadable.toResponse();
	}
}
