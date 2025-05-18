import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UrlArgs } from './urlargs';

describe( 'UrlArgs', () => {
	beforeEach( () => {
		// mock window.location.search
		Object.defineProperty( window, 'location', {
			value: {
				search: ''
			},
			writable: true
		} );
	} );

	it( 'should return default values when no URL parameters exist', () => {
		const defaults = { count: 10, enabled: true, name: 'test' };
		const args = new UrlArgs( defaults );

		expect( args.get() ).toEqual( defaults );
	} );

	it( 'should parse URL parameters and override defaults', () => {
		window.location.search = '?count=20&enabled=false&name=urlargs';

		const defaults = { count: 10, enabled: true, name: 'test' };
		const args = new UrlArgs( defaults );

		expect( args.get() ).toEqual( {
			count: 20,
			enabled: false,
			name: 'urlargs',
		} );
	} );

	it( 'should handle array parameters', () => {
		window.location.search = '?tags=javascript&tags=typescript';

		const defaults = { tags: [] };
		const args = new UrlArgs( defaults );

		expect( args.get() ).toEqual( {
			tags: [ 'javascript', 'typescript' ]
		} );
	} );

	it( 'should describe URL arguments', () => {
		const defaults = { count: 10, enabled: true, name: 'test' };
		const args = new UrlArgs( defaults );

		// mock console.log
		const consoleSpy = vi.spyOn( console, 'log' );

		const descriptions = {
			count: 'The number of items to display',
			enabled: 'Whether the items are enabled',
			name: 'The name of the items',
		};

		args.describe( descriptions );

		// verify console.log was called
		expect( consoleSpy ).toHaveBeenCalled();

		// restore console.log
		consoleSpy.mockRestore();
	} );
} );
