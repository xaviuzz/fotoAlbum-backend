export class UnreadableCall {
	constructor(private readonly message: string) {}

	toResponse(): Response {
		const body = { code: "INVALID_BODY", message: this.message };
		return Response.json(body, { status: 400 });
	}
}
