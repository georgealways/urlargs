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

- ✅ `?enabled`
- ✅ `?enabled=`
- ✅ `?enabled=true`
- ✅ `?enabled=TRUE`
- ✅ `?enabled=1`

URL parameters are considered `false` if set to `false` or `0`.

- ✅ `?enabled=false`
- ✅ `?enabled=FALSE`
- ✅ `?enabled=0`

> [!WARNING]
> Any other value for a boolean will result in a warning in the console, and the default value will be used.

## Arrays

Parameters that appear multiple times are collected into a string array.

`?tags=a&tags=b` → `['a', 'b']`

> [!CAUTION]
> Arrays are NOT comma-separated! The following will NOT work:

`?tags=a,b` → `['a,b']`

## Transforming values

You can provide a function to transform the value before it is assigned to the argument. If the value is not present, the function will be called with no arguments, in which case you can return a default value.

```ts
const args = new UrlArgs( {
	count: 10,
	myObj: ( value?: string ) => {
		if ( !value ) return { a: 0, b: 0 };
		return JSON.parse( value );
	},
} );

// URL = website.com/?count=20&myObj={"a":1,"b":2}
const { count, myObj } = args.values;

// typeof myObj === 'object'
```


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
