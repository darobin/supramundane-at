
import { env } from 'node:process';
import { mkdir } from 'node:fs/promises';

export default class Configuration {
  #c = {
    isProd: (env.NODE_ENV === 'production'),
  };
  constructor (c) {
    const required = ['host', 'port', 'dataDir', 'name', 'cookieSecret'];
    const optional = {
      cookieName: 'supramundane-sid',
      oauthScope: 'atproto transition:generic',
    };
    const allFields = required.concat(Object.keys(optional));
    (this.#c.isProd ? allFields : required).push('ngrokToken');
    const missing = required.filter(r => typeof c[r] === 'undefined');
    if (missing.length) throw new Error(`The following configurations are required: ${missing.join(', ')}`);
    allFields.forEach(k => {
      if (typeof c[k] !== 'undefined') this.#c[k] = c[k];
      else if (optional[k]) this.#c[k] = optional[k];
    });
  }
  async init () {
    // need data dir
    await mkdir(this.dataDir, { recursive: true });
    // set up correct auth domain
    if (this.isProd) {
      this.#c.authDomain = this.host;
    }
    else {
      if (!this.#c.ngrokToken) throw new Error(`Cannot set up ngrok for local testing without ngrokToken`);
      const ngrok = await import('@ngrok/ngrok');
      const listener = await ngrok.forward({ addr: this.port, authtoken: this.ngrokToken });
      const url = listener.url();
      this.#c.authDomain = new URL(url).hostname;
    }
  }
  get authDomain () { return this.#c.authDomain; }
  get dataDir () { return this.#c.dataDir; }
  get host () { return this.#c.host; }
  get isProd () { return this.#c.isProd; }
  get name () { return this.#c.name; }
  get port () { return this.#c.port; }
  get sessionParams () {
    return { cookieName: this.#c.cookieName, cookieSecret: this.#c.cookieSecret };
  }
}
