# urlargs

Lightweight, type-safe utility for parsing URL query parameters.

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

// URL = website.com/?enabled&count=20
// get typed parameters based on the defaults
const { count, enabled, name, tags } = args.values;

console.log( enabled ); // true
console.log( count );   // 20
console.log( name );    // 'test'
console.log( tags );    // ['a', 'b']
```

## Booleans

URL parameters are considered `true` unless explicitly set to `false` or `0`.
  - ✅ `?enabled`
  - ✅ `?enabled=true`  
  - ✅ `?enabled=1`  
  - ✅ `?enabled=anything`
  - ❌ `?enabled=false`
  - ❌ `?enabled=0`

## Arrays

> [!WARNING]
> Arrays are NOT comma-separated!

Parameters that appear multiple times are collected into a string array.
  - `?tags=a&tags=b` → `['a', 'b']`



## Documenting Arguments

UrlArgs can also generate a table of the parameters and their descriptions in the console:

```javascript
args.describe( {
	count: 'The number of items to display',
	name: 'The name of the items',
	tags: 'Tags for filtering the items',
} );
```

Console output:

![alt text](https://github.com/georgealways/urlargs/raw/main/screenshot.png "URL Arguments")
