import { JSDOM } from 'jsdom';

export const { window } = new JSDOM(`<!doctype html><html><head></head><body></body>`);
export type test = 'test';

// accessing localStorage/sessionStorage throws an error
delete window.localStorage;
delete window.sessionStorage;

// now we can make the window properties global
Object.assign(globalThis, window);
globalThis.window = window;

// some can't be copied with Object.assign, so we'll do that manually
globalThis.HTMLElement = window.HTMLElement;
