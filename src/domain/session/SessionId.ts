import { join } from "node:path";
import { SessionRequiredError } from "./SessionRequiredError.ts";

const SAFE_FOLDER_NAME = /^[A-Za-z0-9_-]{1,64}$/;

export class SessionId {
	private constructor(private readonly code: string) {}

	static from(raw: unknown): SessionId {
		const isText = typeof raw === "string";
		const isSafe = isText && SAFE_FOLDER_NAME.test(raw);
		if (!isSafe) {
			throw new SessionRequiredError("sessionId is required");
		}
		return new SessionId(raw);
	}

	toString(): string {
		return this.code;
	}

	pathIn(root: string): string {
		return join(root, this.code);
	}
}
