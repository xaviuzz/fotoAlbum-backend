import { CallError } from "../call/CallError.ts";
import type { ErrorCode } from "../call/Reply.ts";

export class AlbumNotFoundError extends CallError {
	readonly code: ErrorCode = "ALBUM_NOT_FOUND";
}
