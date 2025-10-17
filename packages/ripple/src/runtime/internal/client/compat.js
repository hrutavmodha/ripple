/** @import { CompatApi } from '#client' */

import { ROOT_BLOCK } from "./constants";
import { active_block } from "./runtime";

/**
 * @param {string} kind
<<<<<<< HEAD
=======
 * @returns {CompatApi | null}
 */
function get_compat_from_root(kind)  {
	var current = active_block;

	while (current !== null) {
		if ((current.f & ROOT_BLOCK) !== 0) {
			var api = current.s.compat[kind];

			if (api != null) {
				return api;
			}
		}
		current = current.p;
	}

	return null;
}

/**
 * @param {string} kind
>>>>>>> 84e47b7fb8ac06c1aed70d148465fdfdf9bf6682
 * @param {Node} node
 * @param {() => JSX.Element[]} children_fn
 */
export function tsx_compat(kind, node, children_fn) {
<<<<<<< HEAD
	throw new Error('Not implemented yet');
=======
	var compat = get_compat_from_root(kind);

	if (compat == null) {
		throw new Error(`No compat API found for kind "${kind}"`);
	}

	compat.createComponent(node, children_fn);
>>>>>>> 84e47b7fb8ac06c1aed70d148465fdfdf9bf6682
}
