import { describe, it, expect } from 'vitest';
import { create_auto_insert_harness } from './setup.js';

describe('autoInsert plugin — tag auto-closing', () => {
	it('auto-closes standard HTML tags like <div>', async () => {
		const source = 'export function App() {\n\treturn <div>;\n}';
		const { service, uri } = create_auto_insert_harness(source);

		// Position is right after the '>' in <div> (line 1, character 13)
		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 1, character: 13 },
			{ rangeOffset: 12, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBe('$0</div>');
	});

	it('auto-closes HTML tags with attributes', async () => {
		const source = 'export function App() {\n\treturn <button class="btn" id="save">\n}';
		const { service, uri } = create_auto_insert_harness(source);

		// Line 1: \treturn <button class="btn" id="save">
		// position right after '>'
		const lineText = '\treturn <button class="btn" id="save">';
		const character = lineText.length;

		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 1, character },
			{ rangeOffset: character - 1, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBe('$0</button>');
	});

	it('auto-closes custom TSRX components', async () => {
		const source = 'export function App() {\n\treturn <MyCustomComponent>\n}';
		const { service, uri } = create_auto_insert_harness(source);

		const lineText = '\treturn <MyCustomComponent>';
		const character = lineText.length;

		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 1, character },
			{ rangeOffset: character - 1, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBe('$0</MyCustomComponent>');
	});

	it('auto-closes fragments <>', async () => {
		const source = 'export function App() {\n\treturn <>;\n}';
		const { service, uri } = create_auto_insert_harness(source);

		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 1, character: 9 },
			{ rangeOffset: 32, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBe('$0</>');
	});

	it('does not auto-close void elements like <img> or <input>', async () => {
		const imgSource = 'export function App() {\n\treturn <img src="test.png">\n}';
		const { service: imgService, uri: imgUri } = create_auto_insert_harness(imgSource);

		const imgLine = '\treturn <img src="test.png">';
		const snippetImg = await imgService.getAutoInsertSnippet(
			imgUri,
			{ line: 1, character: imgLine.length },
			{ rangeOffset: imgLine.length - 1, rangeLength: 0, text: '>' },
		);

		expect(snippetImg).toBeFalsy();
	});

	it('does not auto-close self-closing tags <div />', async () => {
		const source = 'export function App() {\n\treturn <div />\n}';
		const { service, uri } = create_auto_insert_harness(source);

		const lineText = '\treturn <div />';
		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 1, character: lineText.length },
			{ rangeOffset: lineText.length - 1, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBeFalsy();
	});

	it('does not auto-close control flow directives like @if', async () => {
		const source = 'export function App() @{\n\t@if (count > 0) {\n\t}\n}';
		const { service, uri } = create_auto_insert_harness(source);

		// After '>' in count > 0
		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 1, character: 12 },
			{ rangeOffset: 11, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBeFalsy();
	});

	it('skips auto-closing if a closing tag already exists ahead', async () => {
		const source = 'export function App() {\n\treturn <div></div>\n}';
		const { service, uri } = create_auto_insert_harness(source);

		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 1, character: 13 },
			{ rangeOffset: 12, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBeFalsy();
	});
});
