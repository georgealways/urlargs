# urlargs

Type-safe utility for parsing URL query parameters.

- [Quick start](#quick-start)
- [Argument types](#argument-types)
  - [Primitives](#primitives)
  - [Arrays](#arrays)
  - [Optional and nullable](#optional-and-nullable)
  - [One of (enum)](#one-of-enum)
  - [JSON](#json)
- [Array modes](#array-modes)
- [Re-parsing](#re-parsing)
- [Options](#options)
- [Documenting arguments](#documenting-arguments)
- [Validation](#validation)

## Quick start

```ts
import { UrlArgs } from 'urlargs';

const args = new UrlArgs( {
  enabled: false,
  count:   10,
  name:    'test',
} );

// 🌐 ?count=20&enabled=true&name=foo
args.values.count    // → 20
args.values.enabled  // → true
args.values.name     // → 'foo'
```

`args.values` is fully typed and frozen. Mutations are caught at compile time and runtime.

## Argument types

Use the `u` namespace to declare anything more complex than a plain primitive default:

```ts
import { UrlArgs, u } from 'urlargs';

const args = new UrlArgs( {
  count:    10,                                 // number
  name:     'test',                             // string
  enabled:  true,                               // boolean
  tags:     u.array( [ 'a', 'b' ] ),            // string[] (default [ 'a', 'b' ])
  scores:   u.array( u.number() ),              // number[] (default [])
  port:     u.optional( u.number() ),           // number | undefined
  bio:      u.nullable( u.string() ),           // string | null
  theme:    u.oneof( [ 'light', 'dark' ] ),     // 'light' | 'dark'
  config:   u.json<Config>( defaultConfig ),    // Config
} );
```

### Primitives

Plain values become typed arguments with that value as the default:

```ts
new UrlArgs( {
  count:   10,       // number
  name:    'test',   // string
  enabled: true,     // boolean
} );
```

### Booleans

These URL values are accepted:

| True | False |
|------|-------|
| 🟢 `?enabled=true` | 🔴 `?enabled=false` |
| 🟢 `?enabled=TRUE` | 🔴 `?enabled=FALSE` |
| 🟢 `?enabled=1` | 🔴 `?enabled=0` |
| 🟢 `?enabled` | |
| 🟢 `?enabled=` | |

### Arrays

`u.array` has two forms. Pass a default array and the element type is inferred:

```ts
new UrlArgs( {
  tags:    u.array( [ 'a', 'b' ] ),     // string[]
  scores:  u.array( [ 1, 2, 3 ] ),      // number[]
  flags:   u.array( [ true, false ] ),  // boolean[]
} );
```

For an empty array, pass an explicit element type:

```ts
new UrlArgs( {
  tags:    u.array( u.string() ),    // string[]
  scores:  u.array( u.number() ),    // number[]
  flags:   u.array( u.boolean() ),   // boolean[]
} );
```

By default, arrays accept both repeated keys and comma-separated values:

```
🌐 ?tags=a&tags=b           → [ 'a', 'b' ]
🌐 ?tags=a,b,c              → [ 'a', 'b', 'c' ]
🌐 ?tags=a,b&tags=c,d       → [ 'a', 'b', 'c', 'd' ]
```

See [array modes](#array-modes) to change this behavior.

### Optional and nullable

`u.optional` and `u.nullable` wrap any other type:

```ts
new UrlArgs( {
  port:    u.optional( u.number() ),               // number | undefined
  bio:     u.nullable( u.string() ),               // string | null
  tags:    u.optional( u.array( u.string() ) ),    // string[] | undefined
  theme:   u.nullable( u.oneof( [ 'a', 'b' ] ) ),  // 'a' | 'b' | null
} );
```

Both default to the nullish value, but you can pass an explicit default:

```ts
u.optional( u.number(), 10 )    // defaults to 10
u.nullable( u.string(), 'hi' )  // defaults to 'hi'
```

The URL strings `undefined` and `null` are recognized as sentinels:

```
🌐 ?port=undefined  →  undefined
🌐 ?bio=null        →  null
```

### One of (enum)

Restrict an argument to a fixed set:

```ts
new UrlArgs( {
  theme:    u.oneof( [ 'light', 'dark', 'auto' ] ),  // 'light' | 'dark' | 'auto'
  fontSize: u.oneof( [ 12, 14, 16, 18 ] ),           // 12 | 14 | 16 | 18
  mode:     u.oneof( [ 'a', 'b', 'c' ], 'b' ),       // default to 'b'
} );
```

The first option is the default unless an explicit one is provided.

### JSON

For arbitrary JSON values, use `u.json` with a default:

```ts
type Config = { w: number; h: number; info: { on: boolean } };

new UrlArgs( {
  config: u.json<Config>( { w: 100, h: 100, info: { on: false } } ),
  items:  u.json( [ 1, 2, 3 ] ),
} );

// 🌐 ?config={"w":200,"h":300,"info":{"on":true}}&items=[4,5,6]
```

The type is inferred from the default, or can be specified with a generic.

To validate the parsed shape at runtime, pass a predicate:

```ts
const isConfig = ( v: unknown ): boolean =>
  typeof v === 'object' && v !== null
    && typeof ( v as Config ).w === 'number'
    && typeof ( v as Config ).h === 'number';

u.json<Config>( defaultConfig, isConfig );
```

If the predicate returns `false`, the default is used and a warning is logged (or an error is thrown in [strict mode](#options)).

## Array modes

The default array mode, `auto`, accepts both repeated keys and comma-separated values. To opt into a specific behavior, pass `arrayMode`:

```ts
new UrlArgs( defaults, { arrayMode: 'comma' } );
```

| Mode | Behavior |
|------|----------|
| `auto` (default) | Splits commas and collects repeated keys |
| `comma` | Splits commas only |
| `repeated` | Collects repeated keys only |

In `comma` and `auto` modes, commas inside values can be escaped with a backslash:

```
🌐 ?tags=a,b\,c  →  [ 'a', 'b,c' ]
```

## Re-parsing

Pass an explicit query string in the constructor, or call `parse()` later:

```ts
const args = new UrlArgs( { count: 10 } );

args.parse( '?count=42' );
args.values.count  // → 42
```

This is useful for tests, single-page apps that respond to URL changes, and server-side rendering.

When no string is provided, `parse()` reads from `window.location.search` (or an empty string if `window` isn't defined).

## Options

```ts
new UrlArgs( defaults, {
  search:    '?count=10',  // explicit query string
  arrayMode: 'auto',       // 'auto' | 'comma' | 'repeated'
  strict:    false,        // throw on invalid input instead of warning
} );
```

## Documenting arguments

Print a styled table of arguments and their values to the console:

```ts
args.describe( {
  count:   'The number of items to display',
  enabled: 'Whether the items are enabled',
  name:    'The name of the items',
} );
```

Values that differ from their defaults are highlighted.

![console output](https://github.com/georgealways/urlargs/raw/main/screenshot.png)

Use `describeAll()` to log every argument, including those without descriptions.

## Validation

When a URL value is invalid for its declared type, `urlargs` logs a warning and falls back to the default:

```ts
const args = new UrlArgs( { count: 10 } );
// 🌐 ?count=banana
args.values.count  // → 10 (warning logged)
```

In strict mode, invalid values throw instead:

```ts
new UrlArgs( { count: 10 }, { strict: true } );
// 🌐 ?count=banana   →  throws
```

Defaults that aren't supported throw at construction time, regardless of mode:

```ts
new UrlArgs( { foo: undefined } );  // throws — use u.optional()
new UrlArgs( { foo: null } );       // throws — use u.nullable()
```
