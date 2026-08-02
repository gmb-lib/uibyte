// The package entry. Everything a consumer may import is re-exported here —
// there is no supported deep-import path into the source tree, so internals can
// move without breaking a host.
export { cn } from './lib/cn'
export type { ClassValue } from 'clsx'
