export interface ResourceRoute {
	readonly path: string;
	serve(request: Request): Promise<Response>;
}
