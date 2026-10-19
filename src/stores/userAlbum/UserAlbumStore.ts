import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SessionId } from "../../session/SessionId.ts";
import { UserAlbum } from "./UserAlbum.ts";
import { UserAlbumAlreadyExistsError } from "./UserAlbumAlreadyExistsError.ts";
import { UserAlbumNotFoundError } from "./UserAlbumNotFoundError.ts";

const FILE_NAME = "user-album.json";
const ALREADY_THERE = "EEXIST";

export class UserAlbumStore {
	constructor(private readonly root: string) {}

	async save(sessionId: SessionId, userAlbum: UserAlbum): Promise<void> {
		const folder = sessionId.pathIn(this.root);
		await mkdir(folder, { recursive: true });
		try {
			await writeFile(join(folder, FILE_NAME), JSON.stringify(userAlbum), {
				flag: "wx",
			});
		} catch (error) {
			throw this.refusalFor(error);
		}
	}

	async find(sessionId: SessionId): Promise<UserAlbum> {
		const file = Bun.file(join(sessionId.pathIn(this.root), FILE_NAME));
		const exists = await file.exists();
		if (!exists) {
			throw new UserAlbumNotFoundError("user album not found");
		}
		const stored = await file.json();
		return UserAlbum.of(stored);
	}

	private refusalFor(error: unknown): unknown {
		let refusal = error;
		const code = (error as NodeJS.ErrnoException).code;
		if (code === ALREADY_THERE) {
			refusal = new UserAlbumAlreadyExistsError("user album already exists");
		}
		return refusal;
	}
}
