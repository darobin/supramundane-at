
import Configuration from "./configuration.js";
import { createDB } from "./db.js";
import { createOAuthClient } from "./oauth.js";

// This creates the objects in the right order so that dependencies work
export default async function createContext (conf) {
  const ctx = {
    configuration: new Configuration(conf),
  };
  await ctx.configuration.init();
  ctx.db = await createDB(ctx);
  ctx.oauthClient = await createOAuthClient(ctx);
  return ctx;
}
