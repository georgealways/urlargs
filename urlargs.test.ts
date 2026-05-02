import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UrlArgs, u } from './src/index.js';

describe( 'UrlArgs', () => {

  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach( () => {
    consoleWarnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
    consoleLogSpy = vi.spyOn( console, 'log' ).mockImplementation( () => {} );
  } );

  afterEach( () => {
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  } );

  // basic functionality
  // ---------------------------------------------------------------------------

  it( 'returns default values when no URL parameters exist', () => {
    const defaults = { count: 10, enabled: true, name: 'test' };
    const args = new UrlArgs( defaults, { search: '' } );
    expect( args.values ).toEqual( defaults );
  } );

  it( 'parses URL parameters and overrides defaults', () => {
    const args = new UrlArgs(
      { count: 10, enabled: true, name: 'test' },
      { search: '?count=20&enabled=false&name=urlargs' }
    );
    expect( args.values ).toEqual( {
      count: 20,
      enabled: false,
      name: 'urlargs',
    } );
  } );

  // shorthand types
  // ---------------------------------------------------------------------------

  it( 'handles string shorthand', () => {
    const args = new UrlArgs( { foo: 'default' }, { search: '?foo=bar' } );
    expect( args.values.foo ).toBe( 'bar' );
  } );

  it( 'handles boolean parameters', () => {
    const test = ( search: string, expected: boolean ) => {
      const args = new UrlArgs( { enabled: false }, { search } );
      expect( args.values.enabled, search ).toBe( expected );
    };

    test( '?enabled', true );
    test( '?enabled=true', true );
    test( '?enabled=TRUE', true );
    test( '?enabled=1', true );
    test( '?enabled=', true );

    test( '?enabled=false', false );
    test( '?enabled=FALSE', false );
    test( '?enabled=0', false );
  } );

  it( 'falls back to default for invalid boolean', () => {
    const args1 = new UrlArgs( { enabled: false }, { search: '?enabled=anythingElse' } );
    expect( args1.values.enabled ).toBe( false );
    const args2 = new UrlArgs( { enabled: true }, { search: '?enabled=anythingElse' } );
    expect( args2.values.enabled ).toBe( true );
    expect( consoleWarnSpy ).toHaveBeenCalled();
  } );

  it( 'falls back to default for invalid number', () => {
    const args = new UrlArgs( { count: 123 }, { search: '?count=notanumber' } );
    expect( args.values.count ).toBe( 123 );
    expect( consoleWarnSpy ).toHaveBeenCalled();
  } );

  // arrays
  // ---------------------------------------------------------------------------

  it( 'handles repeated array parameters in auto mode', () => {
    const args = new UrlArgs(
      { tags: u.array( u.string() ) },
      { search: '?tags=javascript&tags=typescript' }
    );
    expect( args.values.tags ).toEqual( [ 'javascript', 'typescript' ] );
  } );

  it( 'handles comma-separated arrays in auto mode', () => {
    const args = new UrlArgs(
      { tags: u.array( u.string() ) },
      { search: '?tags=a,b,c' }
    );
    expect( args.values.tags ).toEqual( [ 'a', 'b', 'c' ] );
  } );

  it( 'combines repeated and comma in auto mode', () => {
    const args = new UrlArgs(
      { tags: u.array( u.string() ) },
      { search: '?tags=a,b&tags=c,d' }
    );
    expect( args.values.tags ).toEqual( [ 'a', 'b', 'c', 'd' ] );
  } );

  it( 'parses number arrays', () => {
    const args = new UrlArgs(
      { foo: u.array( u.number() ) },
      { search: '?foo=1,2,3' }
    );
    expect( args.values.foo ).toEqual( [ 1, 2, 3 ] );
  } );

  it( 'parses boolean arrays', () => {
    const args = new UrlArgs(
      { foo: u.array( u.boolean() ) },
      { search: '?foo=true,false,true' }
    );
    expect( args.values.foo ).toEqual( [ true, false, true ] );
  } );

  it( 'falls back to array default on invalid element', () => {
    const args = new UrlArgs(
      { foo: u.array( [ 2, 3, 4 ] ) },
      { search: '?foo=1,2,3,notanumber' }
    );
    expect( args.values.foo ).toEqual( [ 2, 3, 4 ] );
    expect( consoleWarnSpy ).toHaveBeenCalled();
  } );

  it( 'returns array default when URL is missing', () => {
    const args = new UrlArgs(
      { foo: u.array( [ 1, 2, 3 ] ) },
      { search: '' }
    );
    expect( args.values.foo ).toEqual( [ 1, 2, 3 ] );
  } );

  // arrayMode
  // ---------------------------------------------------------------------------

  it( 'arrayMode: repeated only collects repeated occurrences', () => {
    const args = new UrlArgs(
      { tags: u.array( u.string() ) },
      { search: '?tags=a,b,c', arrayMode: 'repeated' }
    );
    expect( args.values.tags ).toEqual( [ 'a,b,c' ] );
  } );

  it( 'arrayMode: comma splits commas', () => {
    const args = new UrlArgs(
      { tags: u.array( u.string() ) },
      { search: '?tags=a,b,c', arrayMode: 'comma' }
    );
    expect( args.values.tags ).toEqual( [ 'a', 'b', 'c' ] );
  } );

  it( 'arrayMode: comma falls back and warns when key is repeated', () => {
    const args = new UrlArgs(
      { tags: u.array( u.string() ) },
      { search: '?tags=a&tags=b', arrayMode: 'comma' }
    );
    expect( args.values.tags ).toEqual( [ 'a', 'b' ] );
    expect( consoleWarnSpy ).toHaveBeenCalled();
  } );

  it( 'comma mode handles escaped commas', () => {
    const args = new UrlArgs(
      { tags: u.array( u.string() ) },
      { search: '?tags=a,b\\,c', arrayMode: 'comma' }
    );
    expect( args.values.tags ).toEqual( [ 'a', 'b,c' ] );
  } );

  it( 'comma mode preserves escaped backslashes', () => {
    const args = new UrlArgs(
      { tags: u.array( u.string() ) },
      { search: '?tags=a,b\\\\,c', arrayMode: 'comma' }
    );
    expect( args.values.tags ).toEqual( [ 'a', 'b\\\\', 'c' ] );
  } );

  it( 'comma mode trims whitespace', () => {
    const args = new UrlArgs(
      { tags: u.array( u.string() ) },
      { search: '?tags=  a,b, c', arrayMode: 'comma' }
    );
    expect( args.values.tags ).toEqual( [ 'a', 'b', 'c' ] );
  } );

  // optional / nullable
  // ---------------------------------------------------------------------------

  it( 'handles u.optional', () => {
    const args1 = new UrlArgs(
      { foo: u.optional( u.number() ), bar: u.optional( u.number() ) },
      { search: '?foo=2' }
    );
    expect( args1.values.foo ).toBe( 2 );
    expect( args1.values.bar ).toBe( undefined );

    const args2 = new UrlArgs(
      { foo: u.optional( u.number() ) },
      { search: '' }
    );
    expect( args2.values.foo ).toBe( undefined );
  } );

  it( 'u.optional accepts a non-nullish default', () => {
    const args = new UrlArgs(
      { count: u.optional( u.number(), 42 ) },
      { search: '' }
    );
    expect( args.values.count ).toBe( 42 );
  } );

  it( 'u.nullable accepts a non-nullish default', () => {
    const args = new UrlArgs(
      { name: u.nullable( u.string(), 'test' ) },
      { search: '' }
    );
    expect( args.values.name ).toBe( 'test' );
  } );

  it( 'parses "undefined" sentinel', () => {
    const args = new UrlArgs(
      { count: u.optional( u.number(), 100 ) },
      { search: '?count=undefined' }
    );
    expect( args.values.count ).toBe( undefined );
  } );

  it( 'parses "null" sentinel', () => {
    const args = new UrlArgs(
      { count: u.nullable( u.number(), 100 ) },
      { search: '?count=null' }
    );
    expect( args.values.count ).toBe( null );
  } );

  it( 'falls back to nullish default on invalid input', () => {
    const args = new UrlArgs(
      { count: u.nullable( u.number(), 100 ) },
      { search: '?count=notanumber' }
    );
    expect( args.values.count ).toBe( 100 );
    expect( consoleWarnSpy ).toHaveBeenCalled();
  } );

  it( 'allows optional arrays', () => {
    const args1 = new UrlArgs(
      { tags: u.optional( u.array( u.string() ) ) },
      { search: '?tags=a,b,c' }
    );
    expect( args1.values.tags ).toEqual( [ 'a', 'b', 'c' ] );

    const args2 = new UrlArgs(
      { tags: u.optional( u.array( u.string() ) ) },
      { search: '?tags=undefined' }
    );
    expect( args2.values.tags ).toBe( undefined );

    const args3 = new UrlArgs(
      { tags: u.optional( u.array( u.string() ) ) },
      { search: '' }
    );
    expect( args3.values.tags ).toBe( undefined );
  } );

  // oneof
  // ---------------------------------------------------------------------------

  it( 'handles u.oneof with strings', () => {
    const args = new UrlArgs(
      { theme: u.oneof( [ 'light', 'dark', 'auto' ] ) },
      { search: '' }
    );
    expect( args.values.theme ).toBe( 'light' );
  } );

  it( 'u.oneof accepts an explicit default', () => {
    const args = new UrlArgs(
      { theme: u.oneof( [ 'light', 'dark', 'auto' ], 'auto' ) },
      { search: '' }
    );
    expect( args.values.theme ).toBe( 'auto' );
  } );

  it( 'u.oneof parses URL value', () => {
    const args = new UrlArgs(
      { theme: u.oneof( [ 'light', 'dark', 'auto' ] ) },
      { search: '?theme=dark' }
    );
    expect( args.values.theme ).toBe( 'dark' );
  } );

  it( 'u.oneof with numbers', () => {
    const args = new UrlArgs(
      { size: u.oneof( [ 12, 14, 16 ] ) },
      { search: '?size=14' }
    );
    expect( args.values.size ).toBe( 14 );
  } );

  it( 'u.oneof warns and falls back for invalid value', () => {
    const args = new UrlArgs(
      { theme: u.oneof( [ 'light', 'dark' ] ) },
      { search: '?theme=neon' }
    );
    expect( args.values.theme ).toBe( 'light' );
    expect( consoleWarnSpy ).toHaveBeenCalled();
  } );

  // u.array shorthand
  // ---------------------------------------------------------------------------

  it( 'u.array infers element type from string default', () => {
    const args = new UrlArgs(
      { tags: u.array( [ 'a', 'b' ] ) },
      { search: '?tags=x,y,z' }
    );
    expect( args.values.tags ).toEqual( [ 'x', 'y', 'z' ] );
  } );

  it( 'u.array infers element type from number default', () => {
    const args = new UrlArgs(
      { nums: u.array( [ 1, 2, 3 ] ) },
      { search: '?nums=4,5,6' }
    );
    expect( args.values.nums ).toEqual( [ 4, 5, 6 ] );
  } );

  it( 'u.array infers element type from boolean default', () => {
    const args = new UrlArgs(
      { flags: u.array( [ true, false ] ) },
      { search: '?flags=false,true' }
    );
    expect( args.values.flags ).toEqual( [ false, true ] );
  } );

  it( 'u.array shorthand uses the array as default when URL is missing', () => {
    const args = new UrlArgs(
      { tags: u.array( [ 'a', 'b' ] ) },
      { search: '' }
    );
    expect( args.values.tags ).toEqual( [ 'a', 'b' ] );
  } );

  // json
  // ---------------------------------------------------------------------------

  it( 'parses u.json values', () => {
    type Config = { a: number; b: number; c: { d: boolean } };
    const def: Config = { a: 1, b: 2, c: { d: false } };
    const args = new UrlArgs(
      { config: u.json<Config>( def ) },
      { search: '?config={"a":1,"b":2,"c":{"d":true}}' }
    );
    expect( args.values.config ).toEqual( { a: 1, b: 2, c: { d: true } } );
  } );

  it( 'falls back to JSON default when URL is missing', () => {
    type Config = { a: number };
    const def: Config = { a: 1 };
    const args = new UrlArgs(
      { config: u.json<Config>( def ) },
      { search: '' }
    );
    expect( args.values.config ).toBe( def );
  } );

  it( 'handles JSON arrays', () => {
    const args = new UrlArgs(
      { items: u.json( [ 1, 2, 3 ] ) },
      { search: '?items=[4,5,6]' }
    );
    expect( args.values.items ).toEqual( [ 4, 5, 6 ] );
  } );

  it( 'JSON validator rejects mismatched shape', () => {
    type Config = { w: number; h: number };
    const isConfig = ( v: unknown ): boolean =>
      typeof v === 'object' && v !== null
        && typeof ( v as Config ).w === 'number'
        && typeof ( v as Config ).h === 'number';
    const def: Config = { w: 100, h: 100 };
    const args = new UrlArgs(
      { config: u.json<Config>( def, isConfig ) },
      { search: '?config={"x":1}' }
    );
    expect( args.values.config ).toBe( def );
    expect( consoleWarnSpy ).toHaveBeenCalled();
  } );

  // reparse
  // ---------------------------------------------------------------------------

  it( 'parse() re-reads values from a new query string', () => {
    const args = new UrlArgs( { count: 10 }, { search: '?count=1' } );
    expect( args.values.count ).toBe( 1 );
    args.parse( '?count=42' );
    expect( args.values.count ).toBe( 42 );
    args.parse( '' );
    expect( args.values.count ).toBe( 10 );
  } );

  // strict mode
  // ---------------------------------------------------------------------------

  it( 'strict mode throws on invalid input', () => {
    expect( () => new UrlArgs(
      { count: 10 },
      { search: '?count=notanumber', strict: true }
    ) ).toThrow();
  } );

  it( 'strict mode does not throw when URL is missing', () => {
    const args = new UrlArgs(
      { count: 10 },
      { search: '', strict: true }
    );
    expect( args.values.count ).toBe( 10 );
  } );

  // freezing
  // ---------------------------------------------------------------------------

  it( 'freezes values at the top level', () => {
    const args = new UrlArgs( { count: 10 }, { search: '' } );
    expect( () => {
      ( args.values as { count: number } ).count = 999;
    } ).toThrow();
  } );

  it( 'freezes array values', () => {
    const args = new UrlArgs(
      { tags: u.array( [ 'a' ] ) },
      { search: '' }
    );
    expect( () => {
      ( args.values.tags as string[] ).push( 'x' );
    } ).toThrow();
  } );

  // error handling
  // ---------------------------------------------------------------------------

  it( 'throws on unsupported defaults', () => {
    // @ts-expect-error objects are not supported
    expect( () => new UrlArgs( { foo: {} } ) ).toThrow();
    // @ts-expect-error symbols are not supported
    expect( () => new UrlArgs( { foo: Symbol( 'foo' ) } ) ).toThrow();
    // @ts-expect-error use u.nullable() instead
    expect( () => new UrlArgs( { foo: null } ) ).toThrow();
    // @ts-expect-error use u.optional() instead
    expect( () => new UrlArgs( { foo: undefined } ) ).toThrow();
    // @ts-expect-error functions are not supported
    expect( () => new UrlArgs( { foo: () => {} } ) ).toThrow();
    // @ts-expect-error use u.array() instead
    expect( () => new UrlArgs( { foo: [] } ) ).toThrow();
  } );

  // describe()
  // ---------------------------------------------------------------------------

  it( 'describe() logs the requested keys', () => {
    const args = new UrlArgs( {
      count: 10,
      enabled: true,
      name: 'test',
      tags: u.array( u.string() ),
      optional: u.optional( u.number() ),
      theme: u.oneof( [ 'light', 'dark' ] ),
    }, { search: '?count=20' } );

    args.describe( {
      count: 'The number of items',
      enabled: 'Whether items are enabled',
      theme: 'Color theme',
    } );

    expect( consoleLogSpy ).toHaveBeenCalled();
  } );

  it( 'describe() shows oneof values in the type label', () => {
    const logs: string[] = [];
    consoleLogSpy.mockImplementation( ( ...args ) => {
      logs.push( args.join( ' ' ) );
    } );
    const options = [ 'ONE', 'TWO', 'THREE' ];
    new UrlArgs(
      { foo: u.oneof( options ) },
      { search: '' }
    ).describe( { foo: 'The foo parameter' } );
    expect( logs.some( log => options.every( a => log.includes( a ) ) ) ).toBe( true );
  } );

  it( 'describeAll() logs every key', () => {
    const logs: string[] = [];
    consoleLogSpy.mockImplementation( ( ...args ) => {
      logs.push( args.join( ' ' ) );
    } );
    new UrlArgs( {
      alpha: 1,
      beta: 'x',
      gamma: false,
    }, { search: '' } ).describeAll();
    expect( logs.some( log => log.includes( 'alpha' ) ) ).toBe( true );
    expect( logs.some( log => log.includes( 'beta' ) ) ).toBe( true );
    expect( logs.some( log => log.includes( 'gamma' ) ) ).toBe( true );
  } );

} );
