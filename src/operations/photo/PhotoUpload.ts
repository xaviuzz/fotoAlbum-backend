import { Call } from "../../call/Call.ts";
import { CallError } from "../../call/CallError.ts";
import { InvalidBodyError } from "../../call/InvalidBodyError.ts";
import type { Reply } from "../../call/Reply.ts";
import type { Photo } from "../../photo/Photo.ts";
import type { PhotoStore } from "../../photo/PhotoStore.ts";
import { Picture } from "../../photo/Picture.ts";
import { UnreadableImageError } from "../../photo/UnreadableImageError.ts";
import { UnsupportedFormatError } from "../../photo/UnsupportedFormatError.ts";
import type { SessionId } from "../../session/SessionId.ts";
import type { Operation } from "../Operation.ts";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

type RejectedFile = { name: string; code: string };

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
			const photos: Photo[] = [];
			const rejected: RejectedFile[] = [];
			for (const file of files) {
				const code = await this.keepOrRefuse(sessionId, file, photos);
				if (code !== undefined) {
					rejected.push({ name: file.name, code });
				}
			}
			reply = call.ok({ photos, rejected });
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
		photos: Photo[],
	): Promise<string | undefined> {
		let refusal: string | undefined;
		if (file.size > MAX_FILE_BYTES) {
			refusal = "TOO_LARGE";
		} else {
			refusal = await this.keepReadable(sessionId, file, photos);
		}
		return refusal;
	}

	private async keepReadable(
		sessionId: SessionId,
		file: File,
		photos: Photo[],
	): Promise<string | undefined> {
		let refusal: string | undefined;
		try {
			const bytes = await file.bytes();
			const picture = await Picture.read(bytes);
			const original = { bytes, extension: picture.extension };
			const photo = await this.store.add(
				sessionId,
				original,
				picture.thumbnail(),
			);
			photos.push(photo);
		} catch (error) {
			refusal = this.refusalFor(error);
		}
		return refusal;
	}

	private refusalFor(error: unknown): string {
		let refusal: string | undefined;
		if (error instanceof UnsupportedFormatError) {
			refusal = "UNSUPPORTED_FORMAT";
		}
		if (error instanceof UnreadableImageError) {
			refusal = "UNREADABLE_IMAGE";
		}
		if (refusal === undefined) {
			throw error;
		}
		return refusal;
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
