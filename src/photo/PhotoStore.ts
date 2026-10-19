import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { SessionId } from "../session/SessionId.ts";
import { InvalidPhotoIdError } from "./InvalidPhotoIdError.ts";
import { Photo } from "./Photo.ts";
import { PhotoId } from "./PhotoId.ts";

export type Original = { bytes: Uint8Array; extension: string };

export class PhotoStore {
	constructor(private readonly root: string) {}

	async add(
		sessionId: SessionId,
		original: Original,
		thumbnail: Uint8Array,
	): Promise<Photo> {
		const id = PhotoId.generate();
		const folder = join(sessionId.pathIn(this.root), id.toString());
		await mkdir(folder, { recursive: true });
		await Bun.write(
			join(folder, `original.${original.extension}`),
			original.bytes,
		);
		await Bun.write(join(folder, "thumbnail.jpg"), thumbnail);
		return new Photo(id, sessionId);
	}

	async list(sessionId: SessionId): Promise<Photo[]> {
		let names: string[] = [];
		try {
			names = await readdir(sessionId.pathIn(this.root));
		} catch {
			names = [];
		}
		const photos: Photo[] = [];
		for (const name of names.sort()) {
			const id = this.readId(name);
			if (id !== undefined) {
				photos.push(new Photo(id, sessionId));
			}
		}
		return photos;
	}

	async thumbnailOf(
		sessionId: SessionId,
		photoId: PhotoId,
	): Promise<Uint8Array<ArrayBuffer> | undefined> {
		let bytes: Uint8Array<ArrayBuffer> | undefined;
		const folder = join(sessionId.pathIn(this.root), photoId.toString());
		const file = Bun.file(join(folder, "thumbnail.jpg"));
		const exists = await file.exists();
		if (exists) {
			bytes = await file.bytes();
		}
		return bytes;
	}

	private readId(name: string): PhotoId | undefined {
		let id: PhotoId | undefined;
		try {
			id = PhotoId.from(name);
		} catch (error) {
			if (!(error instanceof InvalidPhotoIdError)) {
				throw error;
			}
		}
		return id;
	}
}
