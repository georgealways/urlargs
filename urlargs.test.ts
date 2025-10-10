import { beforeEach, describe, expect, it, vi } from 'vitest';

import { $null, $undefined, UrlArgs } from './src/index.js';

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

	it( 'should not throw when describing a table with uneven rows', () => {
		const defaults = {
			name: 'test',
			description: $null.string,
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
		// @ts-expect-error - should throw on unsupported type
		expect( () => new UrlArgs( { foo: {} } ) ).toThrow();
		// @ts-expect-error - should throw on unsupported type
		expect( () => new UrlArgs( { foo: Symbol( 'foo' ) } ) ).toThrow();
		// @ts-expect-error - should throw on unsupported type
		expect( () => new UrlArgs( { foo: null } ) ).toThrow();
		// @ts-expect-error - should throw on unsupported type
		expect( () => new UrlArgs( { foo: undefined } ) ).toThrow();
		// @ts-expect-error - should throw on unsupported type
		expect( () => new UrlArgs( { foo: () => {} } ) ).toThrow();
	} );

	it( 'should handle undefined type', () => {
		window.location.search = '?foo=2';
		const args1 = new UrlArgs( {
			foo: $undefined.number,
			bar: $undefined.number,
		} );
		expect( args1.values.foo ).toBe( 2 );
		expect( args1.values.bar ).toBe( undefined );
		window.location.search = '';
		const args2 = new UrlArgs( {
			foo: $undefined.number
		} );
		expect( args2.values.foo ).toBe( undefined );
	} );

	it( 'should handle nullish with default value', () => {
		window.location.search = '';
		const args = new UrlArgs( {
			foo: $null.string( 'test' ),
			bar: $undefined.number( 42 ),
		} );
		expect( args.values.foo ).toBe( 'test' );
		expect( args.values.bar ).toBe( 42 );
	} );

	it( 'should use nullish default value on invalid input', () => {
		const consoleWarnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
		window.location.search = '?count=notanumber';
		const args = new UrlArgs( { count: $null.number( 100 ) } );
		expect( args.values.count ).toBe( 100 );
		expect( consoleWarnSpy ).toHaveBeenCalled();
		consoleWarnSpy.mockRestore();
	} );

} );
