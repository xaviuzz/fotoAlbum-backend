import { CallError } from "../call/CallError.ts";
import type { ErrorCode } from "../call/Reply.ts";

export class SessionRequiredError extends CallError {
	readonly code: ErrorCode = "SESSION_REQUIRED";
}
