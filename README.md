# urlargs

Type-safe utility for parsing URL query parameters.

**Data Types:**
- [Booleans](#booleans)
- [Arrays](#arrays)
- [Typed Arrays](#typed-arrays)
- [Nullish Types](#nullish-types)
- [Allowed Types](#allowed-types)
- [JSON Types](#json-types)

## Usage

```ts
import { UrlArgs } from 'urlargs';

// Define default values
const args = new UrlArgs( {
	enabled: false,
	count: 10,
	name: 'test',
	tags: [ 'a', 'b' ],
} );

// 🌐 Query: ?count=20&enabled=true&name=foo

// Get typed parameters based on the defaults
const { count, enabled, name, tags } = args.values;

count → 20
enabled → true
name → 'foo'
tags → [ 'a', 'b' ]
```

## Documenting Arguments

Generate a table of the parameters and their descriptions in the console with `describe()`:

```ts
args.describe( {
	count: 'The number of items to display',
	enabled: 'Whether the items are enabled',
	name: 'The name of the items',
} );
```

Values that differ from the defaults will be highlighted.

![alt text](https://github.com/georgealways/urlargs/raw/main/screenshot.png "URL Arguments")

# Data Types

Whenever a parameter is invalid, a console warning will be shown and the default value will be used.

## Booleans

These are the valid values for booleans.

| True | False |
|------|-------|
| 🟢 `?enabled=true` | 🔴 `?enabled=false` |
| 🟢 `?enabled=TRUE` | 🔴 `?enabled=FALSE` |
| 🟢 `?enabled=1` | 🔴 `?enabled=0` |
| 🟢 `?enabled` | | 
| 🟢 `?enabled=` | | 


## Arrays

By default, parameters that appear multiple times are collected into a string array.

🌐 Query: `?tags=a&tags=b`
```ts
const args = new UrlArgs( { tags: [] } );
args.values.tags → ['a', 'b']
```

### Comma Mode

By default, arrays use `repeated` mode. You can optionally enable `comma` mode to allow comma-separated arrays:

🌐 Query: `?tags=a,b,c`
```ts
UrlArgs.arrayMode = 'comma';

const args = new UrlArgs( { tags: [] } );
args.values.tags → ['a', 'b', 'c']
```

In comma mode, you can escape commas with a backslash: `?tags=a,b\,c` → `['a', 'b,c']`

## Typed Arrays

By default, arrays are assumed to be `string[]`. To specify a different type, use the `$array` type.

🌐 Query: `?numbers=1,2,3&booleans=true,false,true`
```ts
import { UrlArgs, $array } from 'urlargs';

UrlArgs.arrayMode = 'comma';
const args = new UrlArgs( {
	numbers: $array.number,
	booleans: $array.boolean,
} );

args.values.numbers → [ 1, 2, 3 ]
args.values.booleans → [ true, false, true ]
```

## Allowed Types

To restrict a parameter to a specific set of allowed values, use the `$allowed` type.

```ts
import { UrlArgs, $allowed } from 'urlargs';

const args = new UrlArgs( {
	theme: $allowed.string( 'light', 'dark', 'auto' ),
	fontSize: $allowed.number( 12, 14, 16, 18 ),
} );
```
`$allowed` arguments will become a union type of the allowed values. They default to the first value. The list of allowed values will be displayed by `describe()`.

## Nullish Types

For arguments that can be `undefined` or `null`, use the `$undefined` or `$null` types.

🌐 Query: `?count=2`
```ts
import { UrlArgs, $undefined, $null } from 'urlargs';

const args = new UrlArgs( {
	count: $undefined.number,
	description: $null.string,
} );

args.values.count → 2
args.values.description → null
```

Nullish types can have non-nullish defaults, which can then be overridden by the URL.

🌐 Query: `?count=undefined`
```ts
const args = new UrlArgs( {
	count: $undefined.number( 100 ),
	description: $null.string,
} );

args.values.count → undefined
args.values.description → null
```

| undefined|null|
|---------------------|-----------------|
| `$undefined.number` | `$null.number`  |
| `$undefined.boolean`| `$null.boolean` |
| `$undefined.string` | `$null.string`  |

## JSON Types

To parse JSON values from URL parameters, use the `$json` type.

🌐 Query: `?config={ "w": 200, "h": 300, "info": { "on": true } }&items=[ 4, 5, 6 ]`

```ts
import { UrlArgs, $json } from 'urlargs';

const args = new UrlArgs( {
	config: $json( { 
		w: 100, 
		h: 100, 
		info: { on: false } 
	} ),
	items: $json( [ 1, 2, 3 ] ),
} );

args.values.items → [ 4, 5, 6 ]
args.values.config → { w: 200, h: 300, info: { on: true } }
```

`$json` types must specify a default value. They will inherit the type of the default value. 

⚠️ **There is no schema validation with `$json`.** The only check is that the value is valid JSON.
