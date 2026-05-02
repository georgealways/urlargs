import type { AllowedPrimitive, ArraySpec, ScalarSpec, Spec } from './types.js';

import { isTrue, validateBoolean, validateNumber } from './utils.js';

export const isSpec = ( v: unknown ): v is Spec<unknown> => {
  if ( v === null || typeof v !== 'object' ) return false;
  const kind = ( v as { kind?: unknown } ).kind;
  return kind === 'scalar' || kind === 'array';
};

/**
 * A string argument. Plain string defaults are auto-promoted, so `u.string()` is rarely needed.
 * @example
 * new UrlArgs( { name: u.string( 'guest' ) } );
 * // shorthand:
 * new UrlArgs( { name: 'guest' } );
 */
const string = ( defaultValue = '' ): ScalarSpec<string> => ( {
  kind: 'scalar',
  parse: raw => raw,
  validate: () => true,
  defaultValue,
  typeLabel: 'string',
} );

/**
 * A number argument. Plain number defaults are auto-promoted, so `u.number()` is rarely needed.
 * @example
 * new UrlArgs( { count: u.number( 10 ) } );
 * // shorthand:
 * new UrlArgs( { count: 10 } );
 */
const number = ( defaultValue = 0 ): ScalarSpec<number> => ( {
  kind: 'scalar',
  parse: Number,
  validate: validateNumber,
  defaultValue,
  typeLabel: 'number',
} );

/**
 * A boolean argument. URL accepts `true`/`false`, `1`/`0`, presence (`?flag`), or empty value (`?flag=`) for true.
 * Plain boolean defaults are auto-promoted, so `u.boolean()` is rarely needed.
 * @example
 * new UrlArgs( { enabled: u.boolean( true ) } );
 * // shorthand:
 * new UrlArgs( { enabled: true } );
 */
const boolean = ( defaultValue = false ): ScalarSpec<boolean> => ( {
  kind: 'scalar',
  parse: isTrue,
  validate: validateBoolean,
  defaultValue,
  typeLabel: 'boolean',
} );

/**
 * A typed array. Pass defaults to infer the element type, or pass an inner spec for an empty array.
 * @example
 * u.array( [ 'a', 'b' ] )      // string[] with default [ 'a', 'b' ]
 * u.array( [ 1, 2, 3 ] )       // number[] with default [ 1, 2, 3 ]
 * u.array( [ true, false ] )   // boolean[] with default [ true, false ]
 * u.array( u.string() )        // empty string[]
 * u.array( u.number() )        // empty number[]
 */
function array<T>( inner: ScalarSpec<T> ): ArraySpec<T[]>;
function array( defaults: readonly string[] ): ArraySpec<string[]>;
function array( defaults: readonly number[] ): ArraySpec<number[]>;
function array( defaults: readonly boolean[] ): ArraySpec<boolean[]>;
function array(
  arg: ScalarSpec<unknown> | readonly AllowedPrimitive[],
): ArraySpec<unknown[]> {
  if ( isSpec( arg ) ) return makeArray( arg as ScalarSpec<unknown>, [] );
  return makeArray( inferInner( arg ), [ ...arg ] );
}

const inferInner = ( defaults: readonly AllowedPrimitive[] ): ScalarSpec<unknown> => {
  if ( defaults.length === 0 ) return string() as ScalarSpec<unknown>;
  const first = defaults[ 0 ];
  if ( typeof first === 'string' ) return string() as ScalarSpec<unknown>;
  if ( typeof first === 'number' ) return number() as ScalarSpec<unknown>;
  if ( typeof first === 'boolean' ) return boolean() as ScalarSpec<unknown>;
  throw new Error( `u.array: cannot infer element type from ${ typeof first }` );
};

const makeArray = <T>( inner: ScalarSpec<T>, defaultValue: T[] ): ArraySpec<T[]> => ( {
  kind: 'array',
  parse: raw => raw.map( inner.parse ),
  validate: raw => raw.every( inner.validate ),
  defaultValue,
  typeLabel: `${ inner.typeLabel }[]`,
} );

/**
 * Wrap a spec to allow `undefined`. The URL value `undefined` produces `undefined`.
 * @example
 * u.optional( u.number() )         // number | undefined, defaults to undefined
 * u.optional( u.number(), 100 )    // number | undefined, defaults to 100
 * u.optional( u.array( u.string() ) )  // string[] | undefined
 */
function optional<T>( inner: Spec<T>, defaultValue?: T | undefined ): Spec<T | undefined> {
  if ( inner.kind === 'scalar' ) {
    return {
      kind: 'scalar',
      parse: raw => raw === 'undefined' ? undefined : inner.parse( raw ),
      validate: raw => raw === 'undefined' || inner.validate( raw ),
      defaultValue,
      typeLabel: `${ inner.typeLabel }|undefined`,
    };
  }
  return {
    kind: 'array',
    parse: raw => isUndefinedSentinel( raw ) ? undefined : inner.parse( raw ),
    validate: raw => isUndefinedSentinel( raw ) || inner.validate( raw ),
    defaultValue,
    typeLabel: `${ inner.typeLabel }|undefined`,
  };
}

/**
 * Wrap a spec to allow `null`. The URL value `null` produces `null`.
 * @example
 * u.nullable( u.string() )         // string | null, defaults to null
 * u.nullable( u.string(), 'hi' )   // string | null, defaults to 'hi'
 */
function nullable<T>( inner: Spec<T>, defaultValue: T | null = null ): Spec<T | null> {
  if ( inner.kind === 'scalar' ) {
    return {
      kind: 'scalar',
      parse: raw => raw === 'null' ? null : inner.parse( raw ),
      validate: raw => raw === 'null' || inner.validate( raw ),
      defaultValue,
      typeLabel: `${ inner.typeLabel }|null`,
    };
  }
  return {
    kind: 'array',
    parse: raw => isNullSentinel( raw ) ? null : inner.parse( raw ),
    validate: raw => isNullSentinel( raw ) || inner.validate( raw ),
    defaultValue,
    typeLabel: `${ inner.typeLabel }|null`,
  };
}

const isUndefinedSentinel = ( raw: string[] ): boolean =>
  raw.length === 1 && raw[ 0 ] === 'undefined';

const isNullSentinel = ( raw: string[] ): boolean =>
  raw.length === 1 && raw[ 0 ] === 'null';

/**
 * Restrict a value to one of the given options. The first option is the default unless an explicit one is provided.
 * Values not in the list trigger a warning (or throw in strict mode) and fall back to the default.
 * @example
 * u.oneof( [ 'light', 'dark', 'auto' ] )      // 'light' | 'dark' | 'auto', defaults to 'light'
 * u.oneof( [ 12, 14, 16 ], 14 )               // 12 | 14 | 16, defaults to 14
 */
const oneof = <const A extends readonly ( string | number )[]>(
  options: A,
  defaultValue: A[ number ] = options[ 0 ],
): ScalarSpec<A[ number ]> => {
  const isNumeric = typeof options[ 0 ] === 'number';
  const parse = ( raw: string ): A[ number ] =>
    ( isNumeric ? Number( raw ) : raw ) as A[ number ];
  return {
    kind: 'scalar',
    parse,
    validate: raw => {
      if ( isNumeric && !validateNumber( raw ) ) return false;
      return options.includes( parse( raw ) );
    },
    defaultValue,
    typeLabel: options.map( v => JSON.stringify( v ) ).join( '|' )
  };
};

/**
 * A JSON-encoded value with a default. Pass an optional predicate to validate the parsed shape at runtime.
 * @example
 * u.json<Config>( { width: 100, height: 100 } )
 * u.json<Config>( defaultConfig, v => typeof ( v as Config )?.width === 'number' )
 */
const json = <T>(
  defaultValue: T,
  isValid: ( v: unknown ) => boolean = () => true,
): ScalarSpec<T> => ( {
  kind: 'scalar',
  parse: raw => JSON.parse( raw ) as T,
  validate: raw => {
    try {
      return isValid( JSON.parse( raw ) );
    } catch {
      return false;
    }
  },
  defaultValue,
  typeLabel: 'json'
} );

export const u = {
  string,
  number,
  boolean,
  array,
  optional,
  nullable,
  oneof,
  json,
};
