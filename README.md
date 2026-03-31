
# @supramundane/at

A collection of utilities to build Atmosphere apps with.

## Configuration

```js
import Configuration from '@supramundane/at/configuration';

const conf = new Configuration({
  host: 'berjon.com',
  port: 3084,
  ngrokToken: 'xxx',
});
await conf.init();
```

Captures configuration options with defaults and derived values correctly.

The constructor requires `host` and `port`, and if you want to run locally
you also need to provide an `ngrokToken` [ngrok token](https://dashboard.ngrok.com/get-started/your-authtoken).

It's also important to call `init()` if you want to ensure that everything
is set up correctly, particularly for local development.

- `new Configuration(options)`. Options:
  - `dataDir`: data directory
  - `host`: the domain
  - `port`: the port
  - `name`: the name
  - `ngrokToken`: if you want to support OAuth
  - `oauthScope`: the OAuth scope you want, defaults to `atproto transition:generic`
  - `cookieSecret`: the secret for session cookies
  - `cookieName`: the name of the session cookie, defaults to `supramundane-sid`
- `async init()`. Init.
- `authDomain`. The OAuth domain.
- `dataDir`. Where data is stored.
- `host`. Host
- `isProd`. Is this in prod?
- `port`. Port
- `name`. Name of the app
- `sessionParams`. Session cookie parameters
