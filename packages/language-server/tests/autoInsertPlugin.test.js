import { describe, it, expect } from 'vitest';
import { create_auto_insert_harness } from './setup.js';
import { createAutoInsertPlugin } from '../src/autoInsertPlugin.js';

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
		const source = 'export function App() {\n\treturn <>\n}';
		const { document, service } = create_auto_insert_harness(source);
		const plugin = createAutoInsertPlugin().create(service.context);

		const lineText = '\treturn <>';
		const snippet = await plugin.provideAutoInsertSnippet(
			document,
			{ line: 1, character: lineText.length },
			{ rangeOffset: 33, rangeLength: 0, text: '>' },
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

		// Position right after opening '>' in <div>
		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 1, character: 13 },
			{ rangeOffset: 12, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBeFalsy();
	});

	it('does not auto-close TypeScript generic function declarations function foo<T>', async () => {
		const source = 'export function foo<T>() {}';
		const { service, uri } = create_auto_insert_harness(source);

		const lineText = 'export function foo<T>';
		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 0, character: lineText.length },
			{ rangeOffset: lineText.length - 1, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBeFalsy();
	});

	it('does not auto-close TypeScript generic type definitions type Map<K, V>', async () => {
		const source = 'export type Dict<K, V> = Map<K, V>;';
		const { service, uri } = create_auto_insert_harness(source);

		const lineText = 'export type Dict<K, V>';
		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 0, character: lineText.length },
			{ rangeOffset: lineText.length - 1, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBeFalsy();
	});

	it('does not auto-close TypeScript generic function calls useState<number>(0)', async () => {
		const source = 'const [val, setVal] = useState<number>(0);';
		const { service, uri } = create_auto_insert_harness(source);

		const lineText = 'const [val, setVal] = useState<number>';
		const snippet = await service.getAutoInsertSnippet(
			uri,
			{ line: 0, character: lineText.length },
			{ rangeOffset: lineText.length - 1, rangeLength: 0, text: '>' },
		);

		expect(snippet).toBeFalsy();
	});
});
