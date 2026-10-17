export interface Operation {
	readonly name: string;
	serve(request: Request): Promise<Response>;
}
