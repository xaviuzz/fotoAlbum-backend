import { RefusalError, type RejectionCode } from "./RefusalError.ts";

export class UnsupportedFormatError extends RefusalError {
	readonly code: RejectionCode = "UNSUPPORTED_FORMAT";
}
