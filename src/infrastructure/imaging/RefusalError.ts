export type RejectionCode =
	| "UNSUPPORTED_FORMAT"
	| "TOO_LARGE"
	| "UNREADABLE_IMAGE";

export abstract class RefusalError extends Error {
	abstract readonly code: RejectionCode;
}
