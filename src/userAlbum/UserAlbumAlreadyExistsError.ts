import { CallError } from "../call/CallError.ts";
import type { ErrorCode } from "../call/Reply.ts";

export class UserAlbumAlreadyExistsError extends CallError {
	readonly code: ErrorCode = "USER_ALBUM_ALREADY_EXISTS";
}
