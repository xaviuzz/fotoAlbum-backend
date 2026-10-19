import sharp from "sharp";
import { Picture } from "../../../src/infrastructure/imaging/Picture.ts";

export async function aPicture(shade: number): Promise<Picture> {
	const background = { r: shade, g: shade, b: shade };
	const blank = sharp({
		create: { width: 16, height: 16, channels: 3, background },
	});
	const bytes = await blank.png().toBuffer();
	return Picture.read(bytes);
}
