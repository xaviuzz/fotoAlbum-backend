import { RefusalError, type RejectionCode } from "./RefusalError.ts";

export class UnreadableImageError extends RefusalError {
	readonly code: RejectionCode = "UNREADABLE_IMAGE";
}
