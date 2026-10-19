import { Server } from "./server.ts";

const port = Number(Bun.env.PORT ?? 3000);
const dataDir = Bun.env.DATA_DIR ?? "./data";

Server.start(port, dataDir);
