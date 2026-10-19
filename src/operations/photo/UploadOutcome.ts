import type { Photo } from "../../domain/photo/Photo.ts";
import type {
	RefusalError,
	RejectionCode,
} from "../../infrastructure/imaging/RefusalError.ts";

type RejectedFile = { name: string; code: RejectionCode };

type OutcomeMessage = { photos: Photo[]; rejected: RejectedFile[] };

export class UploadOutcome {
	private constructor(
		private readonly photos: Photo[],
		private readonly rejected: RejectedFile[],
	) {}

	static empty(): UploadOutcome {
		return new UploadOutcome([], []);
	}

	keep(photo: Photo): UploadOutcome {
		const photos = [...this.photos, photo];
		return new UploadOutcome(photos, this.rejected);
	}

	refuse(name: string, refusal: RefusalError): UploadOutcome {
		const entry = { name, code: refusal.code };
		const rejected = [...this.rejected, entry];
		return new UploadOutcome(this.photos, rejected);
	}

	toJSON(): OutcomeMessage {
		return { photos: this.photos, rejected: this.rejected };
	}
}
