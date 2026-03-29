
import { env } from 'node:process';

export default class Configuration {
  #c = {
    isProd: (env.NODE_ENV === 'production'),
  };
  constructor (c) {
    const required = ['host', 'port'];
    const allFields = required.concat([]);
    (this.#c.isProd ? allFields : required).push('ngrokToken');
    const missing = required.filter(r => typeof c[r] === 'undefined');
    if (missing.length) throw new Error(`The following configurations are required: ${missing.join(', ')}`);
    allFields.forEach(k => {
      if (typeof c[k] !== 'undefined') this.#c[k] = c[k];
    });
  }
  async init () {
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
  // Host to use for authentication
  get authDomain () { return this.#c.authDomain; }
  // Primary host
  get host () { return this.#c.host; }
  // Is this production?
  get isProd () { return this.#c.isProd; }
  // Port
  get port () { return this.#c.port; }
}
