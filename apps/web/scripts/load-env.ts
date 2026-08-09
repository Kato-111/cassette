import { config as loadEnv } from "dotenv";
import { join } from "node:path";

loadEnv({ path: join(process.cwd(), "..", "..", ".env") });
