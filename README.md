
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
  - `host`: the domain
  - `port`: the port
  - `ngrokToken`: if you want to support OAuth
- `async init()`. Init.
- `authDomain`. The OAuth domain.
- `host`. Host
- `isProd`. Is this in prod?
- `port`. Port
