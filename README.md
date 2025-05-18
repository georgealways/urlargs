# UrlArgs

A lightweight, typed utility for parsing and working with URL query parameters in the browser.

## Usage

### Basic Example

```javascript
import { UrlArgs } from 'urlargs';

// define default values
const args = new UrlArgs( {
	enabled: false,
	count: 10,
	name: 'test',
	tags: [ 'a', 'b' ],
} );

// get typed parameters based on the defaults
const { count, enabled, name, tags } = args.get();

// URL = website.com/?enabled&count=20
console.log( enabled ); // true
console.log( count );   // 20
console.log( name );    // 'test'
console.log( tags );    // ['a', 'b']
```

### Type Conversion

- **Boolean**: URL parameters are considered `true` unless explicitly set to `false`.
  - ✅ `?enabled`
  - ✅ `?enabled=true`  
  - ✅ `?enabled=anything`
  - ❌ `?enabled=false`
- **Array**: Parameters that appear multiple times are collected into a string array.
  - `?tags=a&tags=b` → `['a', 'b']`

### Parameter Documentation

UrlArgs can also generate a table of the parameters and their descriptions in the console:

```javascript
args.describe( {
	count: 'The number of items to display',
	enabled: 'Whether the items are enabled',
	name: 'The name of the items',
	tags: 'Tags for filtering the items',
} );
```

```
number  | count   | default: 10          | The number of items to display
boolean | enabled | default: true        | Whether the items are enabled
string  | name    | default: "test"      | The name of the items
object  | tags    | default: ["a","b"] | Tags for filtering the items
```
