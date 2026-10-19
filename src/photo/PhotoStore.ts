import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { SessionId } from "../session/SessionId.ts";
import { Photo } from "./Photo.ts";

const PHOTO_FOLDER_NAME = /^[0-9a-f-]{36}$/;

export type Original = { bytes: Uint8Array; extension: string };

export class PhotoStore {
	constructor(private readonly root: string) {}

	async add(
		sessionId: SessionId,
		original: Original,
		thumbnail: Uint8Array,
	): Promise<Photo> {
		const id = Bun.randomUUIDv7();
		const folder = join(sessionId.pathIn(this.root), id);
		await mkdir(folder, { recursive: true });
		await Bun.write(
			join(folder, `original.${original.extension}`),
			original.bytes,
		);
		await Bun.write(join(folder, "thumbnail.jpg"), thumbnail);
		return new Photo(id, sessionId);
	}

	async list(sessionId: SessionId): Promise<Photo[]> {
		let ids: string[] = [];
		try {
			ids = await readdir(sessionId.pathIn(this.root));
		} catch {
			ids = [];
		}
		const photos: Photo[] = [];
		for (const id of ids.sort()) {
			const isPhoto = PHOTO_FOLDER_NAME.test(id);
			if (isPhoto) {
				photos.push(new Photo(id, sessionId));
			}
		}
		return photos;
	}

	async thumbnailOf(
		sessionId: SessionId,
		photoId: string,
	): Promise<Uint8Array<ArrayBuffer> | undefined> {
		let bytes: Uint8Array<ArrayBuffer> | undefined;
		const isWellFormed = PHOTO_FOLDER_NAME.test(photoId);
		if (isWellFormed) {
			const file = Bun.file(
				join(sessionId.pathIn(this.root), photoId, "thumbnail.jpg"),
			);
			const exists = await file.exists();
			if (exists) {
				bytes = await file.bytes();
			}
		}
		return bytes;
	}
}
