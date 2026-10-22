import { REGULAR_SEASON_WEEKS } from "../../shared/stats";
import { getState, getWeekPart, type Env, type Part } from "./sleeper";

function json(body: string, maxAge: number, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": `public, max-age=${maxAge}` },
  });
}

function error(message: string, status: number): Response {
  return json(JSON.stringify({ error: message }), 0, status);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/state") {
        return json(JSON.stringify(await getState(env, ctx)), 600);
      }

      const match = url.pathname.match(/^\/api\/(stats|projections)\/(\d{4})\/(\d{1,2})$/);
      if (match) {
        const season = Number(match[2]);
        const week = Number(match[3]);
        if (week < 1 || week > REGULAR_SEASON_WEEKS) return error("Unknown week", 404);
        const result = await getWeekPart(env, ctx, url.origin, match[1] as Part, season, week);
        if (!result) return error("Not played yet", 404);
        const response = json(result.body, result.stale ? 60 : result.maxAge);
        if (result.stale) response.headers.set("x-stale", "1");
        return response;
      }

      return error("Not found", 404);
    } catch (e) {
      console.error(e);
      return error("Could not reach Sleeper", 502);
    }
  },

  // Daily rebuild, which refreshes the player list (Sleeper asks for at most one fetch a day)
  async scheduled(_controller, env, ctx) {
    if (!env.DEPLOY_HOOK_URL) return;
    ctx.waitUntil(
      fetch(env.DEPLOY_HOOK_URL, { method: "POST" }).then((r) => {
        if (!r.ok) console.error(`Deploy hook answered ${r.status}`);
      }),
    );
  },
} satisfies ExportedHandler<Env>;
