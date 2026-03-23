/**
 * Lightweight logger that is silent in production builds.
 * Vite tree-shakes the calls when import.meta.env.DEV is false.
 */
const noop = () => {};

export const logger = {
  error: import.meta.env.DEV ? console.error.bind(console) : noop,
  warn: import.meta.env.DEV ? console.warn.bind(console) : noop,
};
