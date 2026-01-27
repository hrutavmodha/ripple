/** @import { Component, Derived, Tracked } from '#server' */

import { DERIVED, TRACKED, UNINITIALIZED } from './internal/client/constants.js';
import { is_tracked_object } from './internal/client/utils.js';
import { active_component, get, set, untrack } from './internal/server/index.js';

export { Context } from './internal/server/context.js';

export { get, set, untrack };

export function effect() {
	// NO-OP
}

var empty_get_set = { get: undefined, set: undefined };

/**
 * @param {any} v
 * @param {Function} [get]
 * @param {Function} [set]
 * @returns {Tracked | Derived}
 */
export function track(v, get, set) {
	var is_tracked = is_tracked_object(v);

	if (is_tracked) {
		return v;
	}

	if (typeof v === 'function') {
		return {
			a: get || set ? { get, set } : empty_get_set,
			c: 0,
			co: active_component,
			d: null,
			f: TRACKED | DERIVED,
			fn: v,
			v: UNINITIALIZED,
		};
	}

	return {
		a: get || set ? { get, set } : empty_get_set,
		c: 0,
		d: null,
		f: TRACKED,
		v,
	};
}

export const TrackedObject = globalThis.Object;
export const TrackedArray = globalThis.Array;
export const TrackedDate = globalThis.Date;
export const TrackedSet = globalThis.Set;
export const TrackedMap = globalThis.Map;
export const TrackedURL = globalThis.URL;
export const TrackedURLSearchParams = globalThis.URLSearchParams;

/**
 * @param {string} query A media query string
 * @param {boolean} [matches] Fallback value for the server
 */
export function MediaQuery(query, matches = false) {
	if (!new.target) {
		throw new TypeError('MediaQuery must be called with new');
	}

	return matches;
}

/**
 * @param {any} _
 */
export function createSubscriber(_) {
	return () => {
		/* NO-OP */
	};
}

function noop() {}

// These don't get compiled in {ref fn} templates
// But can still remain in imports and possibly in js
export const bindValue = noop;
export const bindChecked = noop;
export const bindGroup = noop;
export const bindClientWidth = noop;
export const bindClientHeight = noop;
export const bindContentRect = noop;
export const bindContentBoxSize = noop;
export const bindBorderBoxSize = noop;
export const bindDevicePixelContentBoxSize = noop;
export const bindFiles = noop;
export const bindIndeterminate = noop;
export const bindInnerHTML = noop;
export const bindInnerText = noop;
export const bindTextContent = noop;
export const bindNode = noop;
export const bindOffsetWidth = noop;
export const bindOffsetHeight = noop;
