import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { InvalidPhotoIdError } from "../../../domain/photo/InvalidPhotoIdError.ts";
import { Photo } from "../../../domain/photo/Photo.ts";
import { PhotoId } from "../../../domain/photo/PhotoId.ts";
import type { SessionId } from "../../../domain/session/SessionId.ts";
import type { Picture } from "../../imaging/Picture.ts";
import { PhotoNotFoundError } from "./PhotoNotFoundError.ts";

const MISSING_FOLDER = "ENOENT";

export class PhotoStore {
	constructor(private readonly root: string) {}

	async add(sessionId: SessionId, picture: Picture): Promise<Photo> {
		const id = PhotoId.generate();
		const folder = join(sessionId.pathIn(this.root), id.toString());
		await mkdir(folder, { recursive: true });
		const originalName = `original.${picture.extension}`;
		await Bun.write(join(folder, originalName), picture.original());
		await Bun.write(join(folder, "thumbnail.jpg"), picture.thumbnail());
		return new Photo(id, sessionId);
	}

	async list(sessionId: SessionId): Promise<Photo[]> {
		let names: string[] = [];
		try {
			names = await readdir(sessionId.pathIn(this.root));
		} catch (error) {
			if (!this.isMissingFolder(error)) {
				throw error;
			}
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
	): Promise<Uint8Array<ArrayBuffer>> {
		const folder = join(sessionId.pathIn(this.root), photoId.toString());
		const file = Bun.file(join(folder, "thumbnail.jpg"));
		const exists = await file.exists();
		if (!exists) {
			throw new PhotoNotFoundError("photo not found");
		}
		return file.bytes();
	}

	private isMissingFolder(error: unknown): boolean {
		const code = (error as NodeJS.ErrnoException).code;
		return code === MISSING_FOLDER;
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
