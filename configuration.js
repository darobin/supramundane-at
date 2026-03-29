
import { env } from 'node:process';

export default class Configuration {
  #c = {
    isProd: (env.NODE_ENV === 'production'),
  };
  constructor (c) {
    ['host', 'ngrokToken', 'port'].forEach(k => {
      if (c[k]) this.#c[k] = c[k];
    });
    ['host', 'port'].forEach(k => {
      if (!this.#c[k]) throw new Error(`Configuring ${k} is required`);
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
