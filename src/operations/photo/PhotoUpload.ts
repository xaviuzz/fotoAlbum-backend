import type { Call } from "../../call/Call.ts";
import { InvalidBodyError } from "../../call/InvalidBodyError.ts";
import type { PhotoStore } from "../../photo/PhotoStore.ts";
import { Picture } from "../../photo/Picture.ts";
import { RefusalError } from "../../photo/RefusalError.ts";
import { UploadOutcome } from "../../photo/UploadOutcome.ts";
import type { SessionId } from "../../session/SessionId.ts";
import type { MultipartHandler } from "../../transport/MultipartTransport.ts";

export class PhotoUpload implements MultipartHandler {
	readonly name = "photo.upload";

	constructor(private readonly store: PhotoStore) {}

	async execute(call: Call, files: File[]): Promise<unknown> {
		const sessionId = call.requireSession();
		this.requireFiles(files);
		let outcome = UploadOutcome.empty();
		for (const file of files) {
			outcome = await this.keepOrRefuse(sessionId, file, outcome);
		}
		return outcome;
	}

	private requireFiles(files: File[]): void {
		if (files.length === 0) {
			throw new InvalidBodyError("files is required");
		}
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
}
