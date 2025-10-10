import { beforeEach, describe, expect, it, vi } from 'vitest';

import { $allowed, $array, $null, $undefined, UrlArgs } from './src/index.js';

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
		const defaults = {
			count: 10,
			enabled: true,
			name: 'test',
			undefinedNumber: $undefined.number,
			nullString: $null.string,
			arrayNumber: $array.number,
			arrayBoolean: $array.boolean,
			arrayString: $array.string,
		};
		const args = new UrlArgs( defaults );

		const consoleSpy = vi.spyOn( console, 'log' );

		const descriptions = {
			count: 'The number of items to display',
			enabled: 'Whether the items are enabled',
			name: 'The name of the items',
			undefinedNumber: '$undefined.number test',
			nullString: '$null.string test',
			arrayNumber: '$array.number test',
			arrayBoolean: '$array.boolean test',
			arrayString: '$array.string test',
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
			baz: $null.number,
		} );
		expect( args.values.foo ).toBe( 'test' );
		expect( args.values.bar ).toBe( 42 );
		expect( args.values.baz ).toBe( null );
	} );

	it( 'should use nullish default value on invalid input', () => {
		const consoleWarnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
		window.location.search = '?count=notanumber';
		const args = new UrlArgs( { count: $null.number( 100 ) } );
		expect( args.values.count ).toBe( 100 );
		expect( consoleWarnSpy ).toHaveBeenCalled();
		consoleWarnSpy.mockRestore();
	} );

	it( 'should set nullish value via url', () => {
		window.location.search = '?count=null';
		let args = new UrlArgs( { count: $null.number( 100 ) } );
		expect( args.values.count ).toBe( null );
		window.location.search = '?count=undefined';
		args = new UrlArgs( { count: $null.number( 100 ) } );
		expect( args.values.count ).toBe( undefined );
	} );

	it( 'should handle array number type', () => {
		window.location.search = '?foo=1&foo=2&foo=3';
		const args = new UrlArgs( { foo: $array.number } );
		expect( args.values.foo ).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'should handle array number with default value', () => {
		const args = new UrlArgs( { foo: $array.number( [ 1, 2, 3 ] ) } );
		expect( args.values.foo ).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'should handle array boolean type', () => {
		window.location.search = '?foo=true&foo=false&foo=true';
		const args = new UrlArgs( { foo: $array.boolean } );
		expect( args.values.foo ).toEqual( [ true, false, true ] );
	} );

	it( 'should handle array boolean with default value', () => {
		const args = new UrlArgs( { foo: $array.boolean( [ true, false, true ] ) } );
		expect( args.values.foo ).toEqual( [ true, false, true ] );
	} );

	it( 'should handle the allowed type', () => {
		let args = new UrlArgs( { foo: $allowed.string( 'a', 'b', 'c' ) } );
		expect( args.values.foo ).toEqual( 'a' );
		window.location.search = '?foo=d';
		args = new UrlArgs( { foo: $allowed.string( 'a', 'b', 'c' ) } );
		expect( args.values.foo ).toEqual( 'd' );
	} );

	it( 'should warn on invalid allowed type', () => {
		const consoleWarnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
		window.location.search = '?foo=d';
		new UrlArgs( { foo: $allowed.string( 'a', 'b', 'c' ) } );
		expect( consoleWarnSpy ).toHaveBeenCalled();
		consoleWarnSpy.mockRestore();
	} );

	it( 'should log the allowed types when describing', () => {
		let logs: string[] = [];
		const consoleLogSpy = vi.spyOn( console, 'log' ).mockImplementation( ( ...args ) => {
			logs.push( args.join( ' ' ) );
		} );
		const allowed = [ 'a', 'b', 'c' ];
		new UrlArgs( { foo: $allowed.string( ...allowed ) } ).describe( { foo: 'The foo parameter' } );
		expect( consoleLogSpy ).toHaveBeenCalled();
		expect( logs.some( log => log.includes( allowed.join( ', ' ) ) ) ).toBe( true );
		consoleLogSpy.mockRestore();
	} );

} );
