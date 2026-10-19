import type { ErrorCode } from "./Reply.ts";

export abstract class CallError extends Error {
	abstract readonly code: ErrorCode;
}
