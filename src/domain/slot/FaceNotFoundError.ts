import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class FaceNotFoundError extends CallError {
	readonly code: ErrorCode = "FACE_NOT_FOUND";
}
