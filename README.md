# urlargs

Utility for parsing URL query parameters with types.

## Usage

```javascript
import { UrlArgs } from 'urlargs';

// define default values
const args = new UrlArgs( {
	enabled: false,
	count: 10,
	name: 'test',
	tags: [ 'a', 'b' ],
} );

// URL = website.com/?count=20&enabled=false
// get typed parameters based on the defaults
const { count, enabled, name, tags } = args.values;
```

## Booleans

URL parameters are considered `true` if set to any of the following values (case-insensitive): `true`, `1`, or if the key is present with no value.

- 🟢 `?enabled`
- 🟢 `?enabled=`
- 🟢 `?enabled=true`
- 🟢 `?enabled=TRUE`
- 🟢 `?enabled=1`

URL parameters are considered `false` if set to `false` or `0`.

- 🔴 `?enabled=false`
- 🔴 `?enabled=FALSE`
- 🔴 `?enabled=0`

> [!WARNING]
> Any other value for a boolean will result in a console warning, and the default value will be used.

## Arrays

Parameters that appear multiple times are collected into a string array.

`?tags=a&tags=b` → `['a', 'b']`

> [!WARNING]
> Arrays are NOT comma-separated! The following will NOT work:

`?tags=a,b` → `['a,b']`

## Optional types

Use a special type when the default value is `undefined` or `null`. Without it, we can't infer the type of the parameter.

```ts
import { UrlArgs, $undefined, $null } from 'urlargs';

const args = new UrlArgs( {
	count: $undefined.number,
	description: $null.string,
} );

// if URL has ?count=5, then count will be 5
// if URL has no count param, then count will be undefined
```

If the default value is *not* `undefined` or `null`, just use a type assertion:

```ts
const args = new UrlArgs( {
	count: 2 as number | undefined,
} );
```

Available optional types: `$undefined.number`, `$undefined.boolean`, `$undefined.string`, `$null.number`, `$null.boolean`, `$null.string`.

## Documenting arguments

UrlArgs can also generate a table of the parameters and their descriptions in the console:

```ts
args.describe( {
	count: 'The number of items to display',
	enabled: 'Whether the items are enabled',
	name: 'The name of the items',
} );
```

This will produce output like this in the browser console. Values that differ from the defaults will be highlighted.

![alt text](https://github.com/georgealways/urlargs/raw/main/screenshot.png "URL Arguments")
