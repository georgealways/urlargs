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

URL parameters are considered `true` if set to any of the following:
  - ✅ `?enabled`
  - ✅ `?enabled=true`
  - ✅ `?enabled=TRUE`
  - ✅ `?enabled=1`
  - ❌ `?enabled=false`
  - ❌ `?enabled=FALSE`
  - ❌ `?enabled=0`
  - ❌ `?enabled=anythingElse`

## Arrays


Parameters that appear multiple times are collected into a string array.

✅ `?tags=a&tags=b` → `['a', 'b']`

> [!WARNING]
> Arrays are NOT comma-separated! The following will NOT work:
> 
> ❌ `?tags=a,b` 



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
