import { CallError } from "../../../call/CallError.ts";
import type { ErrorCode } from "../../../call/Reply.ts";

export class PhotoNotFoundError extends CallError {
	readonly code: ErrorCode = "PHOTO_NOT_FOUND";
}
