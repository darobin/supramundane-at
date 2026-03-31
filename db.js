
import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { DuckDBConnection } from '@duckdb/node-api';

const migrations = [
  async (db) => {
    await db.run(
      `create table auth_session(key varchar primary key, session varchar not null)`
    );
    await db.run(
      `create table auth_state(key varchar primary key, state varchar not null)`
    );
  }
];

export async function createDB (ctx) {
  const { dataDir } = ctx.configuration;
  const migrationFile = join(dataDir, 'migrations.json');
  const connection = await DuckDBConnection.create(`${join(dataDir, 'db.duck')}`);
  let lastMigration;
  try {
    lastMigration = JSON.parse(await readFile(migrationFile));
  }
  catch (e) {
    lastMigration = { index: -1 };
  }
  if (lastMigration.index < (migrations.length - 1)) {
    for (let idx = lastMigration.index; idx < migrations.length; idx++) {
      await migrations(connection);
    }
    lastMigration.index = migrations.length - 1;
    await writeFile(migrationFile, JSON.stringify(lastMigration, null, 2), 'utf8');
  }
  return connection;
}

export class StateStore {
  constructor (db) {
    this.db = db;
  }
  async get (key) {
    const result = (await this.db.runAndReadAll('select state from auth_state where key = $key limit 1', { key })).getRowObjects();
    if (!result?.length) return;
    return JSON.parse(result[0].state);
  }
  async set (key, val) {
    const state = JSON.stringify(val);
    await this.db.run(`insert or replace into auth_state values ($key), ($state)`, { key, state });
  }
  async del (key) {
    await this.db.run(`delete from auth_state where key = $key`, { key });
  }
}

export class SessionStore {
  constructor (db) {
    this.db = db;
  }
  async get (key) {
    const result = (await this.db.runAndReadAll('select state from auth_session where key = $key limit 1', { key })).getRowObjects();
    if (!result?.length) return;
    return JSON.parse(result[0].session);
  }
  async set(key, val) {
    const session = JSON.stringify(val)
    await this.db.run(`insert or replace into auth_session values ($key), ($state)`, { key, session });
  }
  async del (key) {
    await this.db.run(`delete from auth_session where key = $key`, { key });
  }
}
