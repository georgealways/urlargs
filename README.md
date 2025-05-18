# UrlArgs

A lightweight, typed utility for parsing and working with URL query parameters in the browser.

## Features

- Parse URL parameters into typed JavaScript objects
- Sensible defaults for missing parameters
- Automatic type conversion based on provided defaults
- Support for arrays, strings, numbers, and booleans
- Optional table-based documentation for parameters

## Installation

```bash
npm install urlargs
```

## Usage

### Basic Example

```javascript
import { UrlArgs } from 'urlargs';

// Define default values (also defines types)
const args = new UrlArgs({
	count: 10,
	enabled: true,
	name: 'test',
	tags: ['initial'],
});

// Get typed parameters, with object destructuring
const { count, enabled, name, tags } = args.get();

console.log(count); // number: from URL or default 10
console.log(enabled); // boolean: from URL or default true
console.log(name); // string: from URL or default 'test'
console.log(tags); // string[]: from URL or default ['initial']
```

### Type Conversion

UrlArgs automatically converts parameter values to the appropriate type:

- **Boolean**: URL parameters are considered `true` unless explicitly set to `'false'`
  - `?enabled` → `{ enabled: true }`
  - `?enabled=true` → `{ enabled: true }`  
  - `?enabled=false` → `{ enabled: false }`
  - `?enabled=anything` → `{ enabled: true }`
- **Number**: Parameters are converted to numbers
  - `?count=42` → `{ count: 42 }`
- **Array**: Parameters that appear multiple times are collected into an array
  - `?tags=js&tags=typescript` → `{ tags: ['js', 'typescript'] }`
- **String**: All other parameters are treated as strings
  - `?name=urlargs` → `{ name: 'urlargs' }`

### Parameter Documentation

```javascript
// Document your parameters
args.describe({
	count: 'The number of items to display',
	enabled: 'Whether the items are enabled',
	name: 'The name of the items',
	tags: 'Tags for filtering the items',
});
```

Console output:

```
urlargs:
number  | count   | default: 10           | The number of items to display
boolean | enabled | default: true         | Whether the items are enabled
string  | name    | default: "test"       | The name of the items
object  | tags    | default: ["initial"]  | Tags for filtering the items
```

## TypeScript Support

UrlArgs is written in TypeScript and provides full type safety:

```typescript
interface MyArgs {
	count: number;
	enabled: boolean;
	name: string;
	tags: string[];
	mode: 'light' | 'dark' | 'system'; // Union type
}

const args = new UrlArgs<MyArgs>({
	count: 10,
	enabled: true,
	name: 'test',
	tags: ['initial'],
	mode: 'system',
});

// Type safety is preserved
const result = args.get(); // result is typed as MyArgs
const { mode } = result;

// TypeScript knows this is a specific string literal type
if (mode === 'dark') {
	// Dark mode specific logic
}

// Union types can be used in functions with type safety
function handleThemeMode(selectedMode: MyArgs['mode']) {
	switch (selectedMode) {
		case 'light':
			return '#ffffff';
		case 'dark':
			return '#000000';
		case 'system':
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? '#000000' : '#ffffff';
	}
}
``` 
