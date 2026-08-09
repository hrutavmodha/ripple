/** @import { LanguageServicePlugin } from '@volar/language-server' */

import { getVirtualCode, createLogging, is_ripple_document } from './utils.js';

const { log } = createLogging('[Ripple Auto-Insert Plugin]');

/**
 * List of HTML void/self-closing elements that don't need closing tags
 * https://developer.mozilla.org/en-US/docs/Glossary/Void_element
 */
const VOID_ELEMENTS = new Set([
	'area',
	'base',
	'br',
	'col',
	'command',
	'embed',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
]);

/**
 * Auto-insert plugin for Ripple
 * Handles auto-closing tags when typing '>' after a tag name
 * @returns {LanguageServicePlugin}
 */
export function createAutoInsertPlugin() {
	return {
		name: 'ripple-auto-insert',
		capabilities: {
			autoInsertionProvider: {
				triggerCharacters: ['>'],
				configurationSections: ['ripple.autoClosingTags.enabled'],
			},
			documentOnTypeFormattingProvider: {
				triggerCharacters: ['>'],
			},
		},
		// leaving context for future use
		create(context) {
			return {
				/**
				 * @param {import('vscode-languageserver-textdocument').TextDocument} document
				 * @param {import('@volar/language-server').Position} position
				 * @param {{ rangeOffset: number; rangeLength: number; text: string }} lastChange
				 * @param {import('@volar/language-server').CancellationToken} _token
				 * @returns {Promise<string | null>}
				 */
				async provideAutoInsertSnippet(document, position, lastChange, _token) {
					if (!is_ripple_document(document.uri)) {
						return null;
					}

					// Only checking for '>' insertions
					if (!lastChange.text.endsWith('>')) {
						return null;
					}

					const { virtualCode } = getVirtualCode(document, context);

					if (virtualCode.languageId !== 'ripple') {
						log(`Skipping auto-insert processing in the '${virtualCode.languageId}' context`);
						return null;
					}

					// The position is right after the typed '>' in the source document
					const sourceCode = document.getText();
					const offset = document.offsetAt(position);

					// Ensure character right before cursor is '>'
					if (offset === 0 || sourceCode[offset - 1] !== '>') {
						return null;
					}

					// Check for self-closing tag '/>'
					if (offset >= 2 && sourceCode[offset - 2] === '/') {
						return null;
					}

					// Find the opening '<' for this tag by searching backwards from '>'
					let openingAngleIndex = -1;
					let depth = 0;
					let inString = false;
					let stringQuote = '';

					for (let i = offset - 2; i >= 0; i--) {
						const char = sourceCode[i];

						// Handle string literals in attribute values (e.g. <div attr=">">)
						if (inString) {
							if (char === stringQuote && sourceCode[i - 1] !== '\\') {
								inString = false;
							}
							continue;
						}

						if (char === '"' || char === "'" || char === '`') {
							inString = true;
							stringQuote = char;
							continue;
						}

						// Handle nested JSX expressions or generics inside attributes
						if (char === '}') depth++;
						else if (char === '{') depth--;

						if (depth === 0) {
							if (char === '>') {
								// Hit another tag's closing bracket before finding our opening '<'
								break;
							}
							if (char === '<') {
								openingAngleIndex = i;
								break;
							}
						}
					}

					if (openingAngleIndex === -1) {
						log(`No opening tag found for '>' at offset ${offset}`);
						return null;
					}

					const tagText = sourceCode.slice(openingAngleIndex, offset);

					// Check for JSX Fragment: <>
					if (tagText === '<>') {
						log('Fragment matched, inserting </>');
						const restOfLine = sourceCode.slice(offset, offset + 100);
						if (restOfLine.startsWith('</>')) {
							return null;
						}
						return '$0</>';
					}

					// Match patterns like: <div> or <Component attr="val"> or <tag-name>
					// Exclude self-closing tags (ending with />) and closing tags (starting with </)
					if (tagText.startsWith('</')) {
						return null;
					}

					const tagMatch = tagText.match(/^<([@$\w][\w.-]*)(?:[\s/][^>]*)?>$/);
					if (!tagMatch) {
						log('No valid tag pattern matched for:', tagText);
						return null;
					}

					const tagName = tagMatch[1];

					// Ignore TSRX control-flow directives (@if, @for, @switch, @try, @else, @case, @default, @catch)
					if (/^@(if|for|switch|try|else|case|default|catch)$/.test(tagName)) {
						return null;
					}

					// Don't auto-close void elements (self-closing HTML tags like <img>, <input>, etc.)
					if (VOID_ELEMENTS.has(tagName.toLowerCase())) {
						log('Void element, skipping auto-close:', tagName);
						return null;
					}

					// Check if there's already a matching closing tag ahead
					const restOfLine = sourceCode.slice(offset, offset + 100);
					if (restOfLine.startsWith(`</${tagName}>`)) {
						log('Closing tag already exists, skipping');
						return null;
					}

					// Insert the closing tag with $0 cursor position between tags
					const closingTag = `</${tagName}>`;
					log('Inserting closing tag:', closingTag);
					return `$0${closingTag}`;
				},
			};
		},
	};
}
