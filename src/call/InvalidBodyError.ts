import { CallError } from "./CallError.ts";
import type { ErrorCode } from "./Reply.ts";

export class InvalidBodyError extends CallError {
	readonly code: ErrorCode = "INVALID_BODY";
}
