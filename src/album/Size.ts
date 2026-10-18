import { InvalidAlbumError } from "./InvalidAlbumError.ts";

export type Orientation = "square" | "portrait" | "landscape";

export class Size {
	private constructor(
		private readonly width: number,
		private readonly height: number,
	) {}

	static of(width: number, height: number): Size {
		Size.requireMeasure("width", width);
		Size.requireMeasure("height", height);
		return new Size(width, height);
	}

	orientation(): Orientation {
		let orientation: Orientation = "square";
		if (this.height > this.width) {
			orientation = "portrait";
		}
		if (this.width > this.height) {
			orientation = "landscape";
		}
		return orientation;
	}

	fitsWithin(other: Size): boolean {
		const isNarrowEnough = this.width <= other.width;
		const isShortEnough = this.height <= other.height;
		return isNarrowEnough && isShortEnough;
	}

	toJSON(): { width: number; height: number } {
		return { width: this.width, height: this.height };
	}

	private static requireMeasure(name: string, value: number): void {
		const isWhole = Number.isInteger(value);
		const isPositive = value > 0;
		if (!isWhole || !isPositive) {
			throw new InvalidAlbumError(`${name} must be a whole number above zero`);
		}
	}
}
