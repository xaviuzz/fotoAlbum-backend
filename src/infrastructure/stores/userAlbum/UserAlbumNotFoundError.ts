import { CallError } from "../../../call/CallError.ts";
import type { ErrorCode } from "../../../call/Reply.ts";

export class UserAlbumNotFoundError extends CallError {
	readonly code: ErrorCode = "USER_ALBUM_NOT_FOUND";
}
