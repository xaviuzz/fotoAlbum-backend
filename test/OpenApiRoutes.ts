export class OpenApiRoutes {
	private constructor(readonly names: string[]) {}

	static async read(path: string): Promise<OpenApiRoutes> {
		const text = await Bun.file(path).text();
		const routeLine = /^ {2}\/(\S+):\s*$/gm;
		const names: string[] = [];
		for (const match of text.matchAll(routeLine)) {
			names.push(match[1] as string);
		}
		return new OpenApiRoutes(names.sort());
	}
}
