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

		test( '?enabled=false', false );
		test( '?enabled=FALSE', false );
		test( '?enabled=0', false );
		test( '?enabled=anythingElse', false );
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
			description: null,
		};

		const args = new UrlArgs( defaults, '' );
		const consoleSpy = vi.spyOn( console, 'log' );
		expect( () => args.describe( {} ) ).not.toThrow();
		consoleSpy.mockRestore();
	} );

} );
