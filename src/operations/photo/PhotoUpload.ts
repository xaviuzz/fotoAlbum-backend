import { Call } from "../../call/Call.ts";
import { CallError } from "../../call/CallError.ts";
import { InvalidBodyError } from "../../call/InvalidBodyError.ts";
import type { Reply } from "../../call/Reply.ts";
import type { PhotoStore } from "../../photo/PhotoStore.ts";
import { Picture } from "../../photo/Picture.ts";
import { RefusalError } from "../../photo/RefusalError.ts";
import { UploadOutcome } from "../../photo/UploadOutcome.ts";
import type { SessionId } from "../../session/SessionId.ts";
import type { Operation } from "../Operation.ts";

export class PhotoUpload implements Operation {
	readonly name = "photo.upload";

	constructor(private readonly store: PhotoStore) {}

	async serve(request: Request): Promise<Response> {
		let response: Response;
		try {
			const form = await request.formData();
			const call = this.readCall(form);
			const reply = await this.answer(call, form);
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

	private async answer(call: Call, form: FormData): Promise<Reply> {
		let reply: Reply;
		try {
			const sessionId = call.requireSession();
			const files = this.readFiles(form);
			let outcome = UploadOutcome.empty();
			for (const file of files) {
				outcome = await this.keepOrRefuse(sessionId, file, outcome);
			}
			reply = call.ok(outcome);
		} catch (error) {
			reply = this.failureFor(call, error);
		}
		return reply;
	}

	private readFiles(form: FormData): File[] {
		const files: File[] = [];
		for (const entry of form.getAll("files")) {
			if (entry instanceof File) {
				files.push(entry);
			}
		}
		if (files.length === 0) {
			throw new InvalidBodyError("files is required");
		}
		return files;
	}

	private async keepOrRefuse(
		sessionId: SessionId,
		file: File,
		outcome: UploadOutcome,
	): Promise<UploadOutcome> {
		let next: UploadOutcome;
		try {
			const bytes = await file.bytes();
			const picture = await Picture.read(bytes);
			const photo = await this.store.add(sessionId, picture);
			next = outcome.keep(photo);
		} catch (error) {
			next = this.refuse(file, error, outcome);
		}
		return next;
	}

	private refuse(
		file: File,
		error: unknown,
		outcome: UploadOutcome,
	): UploadOutcome {
		if (!(error instanceof RefusalError)) {
			throw error;
		}
		return outcome.refuse(file.name, error);
	}

	private failureFor(call: Call, error: unknown): Reply {
		let reply = call.failure("INTERNAL_ERROR", "internal error");
		if (error instanceof CallError) {
			reply = call.failure(error.code, error.message);
		}
		return reply;
	}

	private unreadable(): Response {
		const body = {
			code: "INVALID_BODY",
			message: "call is not a readable form",
		};
		return Response.json(body, { status: 400 });
	}
}
