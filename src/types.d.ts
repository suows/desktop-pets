// src/types.d.ts
declare module 'electron-store' {
  interface Options<T> { defaults?: T; }
  class Store<T extends Record<string, any>> {
    constructor(opts?: Options<T>);
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
  }
  export = Store;
}
