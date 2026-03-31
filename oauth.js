
import assert from 'node:assert';
import express from "express";
import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { isValidHandle } from '@atproto/syntax';
import { getIronSession } from 'iron-session';
import cookieParser from 'cookie-parser';
import { SessionStore, StateStore } from './db.js';

const cookieOptions = { path: '/', secure: true, httpOnly: false, sameSite: 'lax' };

export async function createOAuthClient(ctx) {
  const { authDomain, name: client_name, oauthScope: scope } = ctx.configuration;
  const url = `https://${authDomain}/`;
  return new NodeOAuthClient({
    clientMetadata: {
      client_name,
      client_id: `${url}client-metadata.json`,
      client_uri: url,
      redirect_uris: [`${url}api/oauth/callback`],
      scope,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'none',
      dpop_bound_access_tokens: true,
    },
    stateStore: new StateStore(ctx.db),
    sessionStore: new SessionStore(ctx.db),
  });
}

// This is everything that is needed to wire in the OAuth flow:
//  - the OAuth metadata resource
//  - POST login endpoint (just posting the handle)
//  - POST logout
//  - a handler that detects that we're running as an ngrok endpoint and
//    redirects to our own site through a cookie sync endpoint to make
//    that we keep the right session stuff
export async function createRouter(ctx) {
  const router = express.Router();

  router.get('/client-metadata.json', (req, res) => {
    return res.json(ctx.oauthClient.clientMetadata);
  });
  router.post('/api/login', express.urlencoded({ extended: true }), async (req, res) => {
    const handle = req.body?.handle?.replace(/^@/, '');
    if (typeof handle !== 'string' || !isValidHandle(handle)) {
      return sendError(res, 'invalid handle');
    }
    try {
      const url = await ctx.oauthClient.authorize(handle, {
        scope: ctx.configuration.oauthScope,
      });
      res.cookie(
        'handle',
        handle,
        {
          ...cookieOptions,
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
      );
      let ret = req.body?.return;
      if (ret && /^\//.test(ret) && !/^\/(login|api)/.test(ret)) {
        res.cookie('return', ret, cookieOptions);
      }
      return res.redirect(url.toString());
    }
    catch (err) {
      ctx.logger.error({ err }, 'oauth authorize failed');
      return sendError(res, err.message || "couldn't initiate login");
    }
  });
  router.get('/logout', async (req, res) => {
    const session = await getIronSession(req, res, ctx.configuration.sessionParams);
    session.destroy();
    return res.redirect('/');
  });
  router.get('/api/oauth/callback', cookieParser(), async (req, res) => {
    const params = new URLSearchParams(req.originalUrl.split('?')[1]);
    try {
      const { session } = await ctx.oauthClient.callback(params);
      const clientSession = await getIronSession(req, res, ctx.configuration.sessionParams);
      assert(!clientSession.did, 'session already exists');
      clientSession.did = session.did;
      await clientSession.save();
    }
    catch (err) {
      ctx.logger.error({ err }, 'oauth callback failed');
      return sendError(res, err.message);
    }
    return res.redirect('/');
  });
  if (!ctx.configuration.isProd) {
    router.use(cookieParser(), (req, res, next) => {
      if (/ngrok-free\.app/.test(req.hostname)) {
        const search = new URLSearchParams([
          ['path', req.originalUrl || '/'],
          ['cookie', req.cookies[ctx.configuration.sessionParams.cookieName]],
        ]).toString();
        return res.redirect(`https://${ctx.configuration.host}/api/set-cookie?${search}`);
      }
      next();
    });
    router.get('/api/set-cookie', (req, res) => {
      const { path, cookie } = req.query;
      res.cookie(
        ctx.configuration.sessionParams.cookieName,
        cookie,
        {
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
        }
      );
      res.redirect(path || '/');
    });
  }

  return router;
}

function sendError (res, msg) {
  return res.redirect(`/?error=${encodeURIComponent(msg)}`);
}
