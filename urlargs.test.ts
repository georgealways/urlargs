import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UrlArgs } from './dist/urlargs.js';

describe( 'UrlArgs', () => {

	// mock window object if it doesn't exist
	beforeEach( () => {
		if ( typeof window === 'undefined' ) {
			vi.stubGlobal( 'window', { location: { search: '' } } );
		} else {
			Object.defineProperty( window, 'location', {
				value: { search: '' },
				writable: true,
			} );
		}
	} );

	it( 'should return default values when no URL parameters exist', () => {
		const defaults = { count: 10, enabled: true, name: 'test' };
		const args = new UrlArgs( defaults );
		expect( args.values ).toEqual( defaults );
	} );

	it( 'should handle boolean parameters', () => {
		const defaults = { enabled: false };
		let args: UrlArgs<typeof defaults>;

		const test = ( str: string, expected: boolean ) => {
			window.location.search = str;
			args = new UrlArgs( defaults );
			expect( args.values, str ).toEqual( { enabled: expected } );
		};

		test( '?enabled', true );
		test( '?enabled=true', true );
		test( '?enabled=TRUE', true );
		test( '?enabled=1', true );
		test( '?enabled=', true );

		test( '?enabled=false', false );
		test( '?enabled=FALSE', false );
		test( '?enabled=0', false );

		// test invalid boolean value, should use default
		const consoleWarnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
		window.location.search = '?enabled=anythingElse';
		args = new UrlArgs( { enabled: false } );
		expect( args.values.enabled ).toBe( false );
		args = new UrlArgs( { enabled: true } );
		expect( args.values.enabled ).toBe( true );
		expect( consoleWarnSpy ).toHaveBeenCalled();
		consoleWarnSpy.mockRestore();
	} );

	it( 'should handle invalid number parameters', () => {
		const consoleWarnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
		window.location.search = '?count=notanumber';
		const args = new UrlArgs( { count: 123 } );
		expect( args.values.count ).toBe( 123 );
		expect( consoleWarnSpy ).toHaveBeenCalled();
		consoleWarnSpy.mockRestore();
	} );

	it( 'should parse URL parameters and override defaults', () => {
		window.location.search = '?count=20&enabled=false&name=urlargs';

		const defaults = { count: 10, enabled: true, name: 'test' };
		const args = new UrlArgs( defaults );

		expect( args.values ).toEqual( {
			count: 20,
			enabled: false,
			name: 'urlargs',
		} );
	} );

	it( 'should handle array parameters', () => {
		window.location.search = '?tags=javascript&tags=typescript';

		const defaults = { tags: [] };
		const args = new UrlArgs( defaults );

		expect( args.values ).toEqual( {
			tags: [ 'javascript', 'typescript' ]
		} );
	} );

	it( 'should describe URL arguments', () => {
		const defaults = { count: 10, enabled: true, name: 'test' };
		const args = new UrlArgs( defaults );

		const consoleSpy = vi.spyOn( console, 'log' );

		const descriptions = {
			count: 'The number of items to display',
			enabled: 'Whether the items are enabled',
			name: 'The name of the items',
		};

		args.describe( descriptions );

		expect( consoleSpy ).toHaveBeenCalled();
		consoleSpy.mockRestore();
	} );

	it( 'should handle transforming values to a custom type', () => {
		type MyType = { a: number, b: number };
		window.location.search = '?myObj={"a":1,"b":2}';
		const args = new UrlArgs( {
			myObj: ( value?: string ): MyType => {
				if ( !value ) return { a: 0, b: 0 };
				return JSON.parse( value );
			}
		} );
		expect( args.values.myObj ).toEqual( { a: 1, b: 2 } );
	} );

	it( 'should handle transforming values to a custom type with a default value', () => {
		type MyType = { a: number, b: number };
		window.location.search = '?notMentioned';
		const args = new UrlArgs( {
			myObj: ( value?: string ): MyType => {
				if ( !value ) return { a: 30, b: 40 };
				return JSON.parse( value );
			}
		} );
		expect( args.values.myObj ).toEqual( { a: 30, b: 40 } );
	} );

	it( 'should not throw when describing a table with uneven rows', () => {
		const defaults = {
			name: 'test',
			description: null,
		};

		const args = new UrlArgs( defaults, '' );
		const consoleSpy = vi.spyOn( console, 'log' );
		expect( () => args.describe( {} ) ).not.toThrow();
		consoleSpy.mockRestore();
	} );

	it( 'should handle string type', () => {
		window.location.search = '?foo=bar';
		const args = new UrlArgs( { foo: 'default' } );
		expect( args.values.foo ).toBe( 'bar' );
	} );

	it( 'should throw on unsupported type', () => {
		window.location.search = '?foo=bar';
		const defaults = { foo: {} };
		// @ts-expect-error - should throw on unsupported type
		expect( () => new UrlArgs( defaults ) ).toThrow();
	} );

} );
