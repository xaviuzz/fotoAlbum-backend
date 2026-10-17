import { Server } from "./server.ts";

const port = Number(Bun.env.PORT ?? 3000);

Server.start(port);
