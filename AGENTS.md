# urlargs

Type-safe URL query parameter parser. Plain values for primitives; the `u` namespace for everything else.

## Canonical example

```ts
import { UrlArgs, u } from 'urlargs';

const args = new UrlArgs( {
    // primitives — plain values
    count:   10,
    name:    'test',
    enabled: true,

    // arrays — pass defaults to infer element type, or pass an inner spec for empty
    tags:    u.array( [ 'a', 'b' ] ),         // string[]
    scores:  u.array( u.number() ),           // empty number[]

    // optional / nullable — wrap any other type
    port:    u.optional( u.number() ),        // number | undefined
    bio:     u.nullable( u.string() ),        // string | null

    // enum
    theme:   u.oneof( [ 'light', 'dark' ] ),  // 'light' | 'dark'

    // JSON
    config:  u.json<Config>( defaultConfig ),
} );

args.values.count;            // typed, frozen
args.parse( '?count=42' );    // re-parse later
```

## Constructor options

```ts
new UrlArgs( defaults, {
    search:    '?count=42',  // explicit query string (SSR / tests)
    arrayMode: 'auto',       // 'auto' (default) | 'comma' | 'repeated'
    strict:    false,        // throw on invalid input instead of warning
} );
```

## URL syntax

| URL | Result |
|-----|--------|
| `?flag` or `?flag=` | `true` |
| `?flag=true` / `?flag=1` / `?flag=TRUE` | `true` |
| `?flag=false` / `?flag=0` | `false` |
| `?tags=a,b,c` (auto / comma) | `[ 'a', 'b', 'c' ]` |
| `?tags=a&tags=b` (auto / repeated) | `[ 'a', 'b' ]` |
| `?tags=a\,b,c` (auto / comma) | `[ 'a,b', 'c' ]` (escape) |
| `?port=undefined` (with `u.optional`) | `undefined` |
| `?bio=null` (with `u.nullable`) | `null` |

## Common mistakes

- ❌ `u.array( u.string(), [ 'a', 'b' ] )` — that overload doesn't exist. Use `u.array( [ 'a', 'b' ] )`.
- ❌ `u.allowed( ... )` — renamed to `u.oneof( ... )`.
- ❌ `[ 'a', 'b' ]` as a top-level default — not a shorthand. Use `u.array( [ 'a', 'b' ] )`.
- ❌ `null` or `undefined` as a default — throws. Use `u.nullable(...)` or `u.optional(...)`.
- ❌ `UrlArgs.arrayMode = 'comma'` — there is no static. Pass `{ arrayMode: 'comma' }` to the constructor.
- ❌ Mutating `args.values` — frozen at runtime. Call `args.parse( newSearch )` to update.
- ❌ Calling `new UrlArgs(...)` server-side without `search` — works, but reads from `window.location.search` only on the client. For SSR, always pass `{ search: request.url }`.

## API surface

```ts
// Primitive specs (rarely needed; plain values auto-promote)
u.string( default? )
u.number( default? )
u.boolean( default? )

// Arrays — pass defaults OR an inner spec
u.array( [ ...defaults ] )       // element type inferred
u.array( u.string() )            // empty array, explicit element type

// Modifiers — wrap any other spec
u.optional( spec, default? )     // spec | undefined
u.nullable( spec, default? )     // spec | null

// Enum
u.oneof( [ ...options ], default? )

// JSON
u.json<T>( default, predicate? )
```

See `examples.ts` for a fully-typed reference of every form.
