import { RefusalError, type RejectionCode } from "./RefusalError.ts";

export class TooLargeError extends RefusalError {
	readonly code: RejectionCode = "TOO_LARGE";
}
