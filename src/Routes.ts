export type Handler = (request: Request) => Promise<Response>;

export type Routes = Record<string, Partial<Record<"GET" | "POST", Handler>>>;
