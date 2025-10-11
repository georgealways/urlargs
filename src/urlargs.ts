import type { ArrayMode, DefaultValue, ResolveSpecial } from './types.js';

import { isArray, isSpecial } from './special.js';
import { arraysEqual, isTrue, stringify, truncate, validateBoolean, validateNumber } from './utils.js';

/**
 * Parses URL query parameters into a typed object.
 * ```ts
 * const args = new UrlArgs( { count: 10, enabled: true, name: 'test' } );
 * const { count, enabled, name } = args.values;
 * ```
 */
export class UrlArgs<T extends Record<string, DefaultValue>> {

	private readonly urlSearchParams: URLSearchParams;
	private readonly defaults: T;

	readonly values: Readonly<ResolveSpecial<T>>;

	static readonly DEFAULT_ARRAY_MODE: ArrayMode = 'repeated';
	static arrayMode: ArrayMode = UrlArgs.DEFAULT_ARRAY_MODE;

	constructor( defaults: T, search = window.location.search ) {
		this.validateDefaults( defaults );
		this.defaults = defaults;
		this.urlSearchParams = new URLSearchParams( search );
		this.values = this.getValues();
	}

	private validateDefaults( defaults: T ) {
		for ( const [ key, arg ] of Object.entries( defaults ) ) {
			if ( isSpecial( arg ) ) continue;
			if ( arg === undefined ) {
				throw new Error( 'Use $undefined to allow undefined values' );
			}
			if ( arg === null ) {
				throw new Error( 'Use $null to allow null values' );
			}
			if ( Array.isArray( arg ) && !arg.every( v => typeof v === 'string' ) ) {
				throw new Error( 'Use $array for non string[] arrays.' );
			}
			const type = typeof arg;
			if ( ![ 'boolean', 'number', 'string' ].includes( type ) && !Array.isArray( arg ) ) {
				throw new Error( `Unsupported type for ${key}: ${type}` );
			}
		}
	}

	private getValues() {

		const values = {} as ResolveSpecial<T>;

		for ( const [ key, arg ] of Object.entries( this.defaults ) ) {

			if ( !this.urlSearchParams.has( key ) ) {
				const val = isSpecial( arg ) ? arg.defaultValue : arg;
				values[ key as keyof T ] = val as ResolveSpecial<T>[keyof T];
				continue;
			}

			const stringValue = this.urlSearchParams.get( key )!;
			const arrayValue = this.parseArray( key );

			const assign = (
				parsedValue: any,
				validator = ( _: string ) => true,
				defaultValue: any = arg
			) => {
				if ( validator( stringValue ) ) {
					values[ key as keyof T ] = parsedValue;
					return;
				}
				console.warn( `Invalid URL argument for ${key}: "${stringValue}"` );
				console.warn( `Using default value: ${stringify( defaultValue )}` );
				values[ key as keyof T ] = defaultValue;
			};

			if ( isArray( arg ) ) {

				assign( arrayValue.map( arg.parse ), () => arrayValue.every( arg.validate ), arg.defaultValue );

			} else if ( isSpecial( arg ) ) {

				assign( arg.parse( stringValue ), arg.validate, arg.defaultValue );

			} else if ( typeof arg === 'boolean' ) {

				assign( isTrue( stringValue ), validateBoolean );

			} else if ( typeof arg === 'number' ) {

				assign( Number( stringValue ), validateNumber );

			} else if ( typeof arg === 'string' ) {

				assign( stringValue );

			} else if ( Array.isArray( arg ) ) {

				assign( arrayValue );

			}

		}

		return values;

	}

	private parseArray( key: string ) {

		const value = this.urlSearchParams.get( key );
		if ( !value ) return [];

		const repeated = this.urlSearchParams.getAll( key );

		if ( repeated.length > 1 && UrlArgs.arrayMode === 'comma' ) {
			console.warn( `Repeated array mode detected for ${key}, but comma mode is set` );
			console.warn( 'Using repeated mode instead' );
			return repeated;
		}

		if ( UrlArgs.arrayMode === 'repeated' ) {
			return repeated;
		}

		return this.parseCommaArray( value );

	}

	private parseCommaArray( input: string ) {
		const parts: string[] = [];
		let current = '';
		let escaped = false;

		// unlikely to appear in real text
		const BACKSLASH_PLACEHOLDER = '\u0000';
		input = input.replace( /\\\\/g, BACKSLASH_PLACEHOLDER );

		for ( const char of input ) {
			if ( char === '\\' && !escaped ) {
				escaped = true;
			} else if ( char === ',' && !escaped ) {
				parts.push( current.trim() );
				current = '';
			} else {
				current += char;
				escaped = false;
			}
		}

		// handle trailing data
		if ( escaped ) current += '\\';
		if ( current.length > 0 ) parts.push( current.trim() );

		// restore real backslashes, unescape commas
		return parts.map( s => s
			.replace( new RegExp( BACKSLASH_PLACEHOLDER, 'g' ), '\\\\' )
			.replace( /\\,/g, ',' )
		);
	}

	/**
	 * Print descriptions of the specified URL arguments to the console.
	 * ```ts
	 * const args = new UrlArgs( {
	 *   count: 10,
	 *   enabled: true,
	 *   name: 'test',
	 *   tags: [ 'a', 'b' ]
	 * } );
	 *
	 * args.describe( {
	 *   count: 'The number of items to display',
	 *   enabled: 'Whether the items are enabled',
	 *   name: 'The name of the items'
	 * } );
	 * ```
	 */
	public describe( descriptions: Partial<Record<keyof T, string>> = {} ): void {

		const keys = Object.keys( descriptions );

		for ( const key of keys ) {

			const description = ( descriptions[ key ] || '' ).trim();

			let arg = this.defaults[ key ];
			let type = Array.isArray( arg ) ? 'string[]' : typeof arg;

			if ( isSpecial( arg ) ) {
				type = arg.typeLabel;
				arg = arg.defaultValue;
			}

			const value = this.values[ key ];
			const isDefaultValue = value === arg || arraysEqual( arg, value );

			const valueStr = truncate( stringify( value ) );
			const styles: string[] = [];

			let content = `%c${key}: `;
			styles.push( 'font-weight: bold' );

			if ( !isDefaultValue ) {

				content += `%c${valueStr}`;
				styles.push( 'font-weight: bold; color: #f70' );

				content += ` %c${stringify( arg )}`;
				styles.push( 'color: #a6f7; text-decoration: line-through' );

			} else {
				content += `%c${valueStr}`;
				styles.push( 'color: #a6f' );
			}

			content += `%c · ${type}`;
			styles.push( 'color: #999' );

			if ( description ) {
				content += `%c · ${description}`;
				styles.push( 'color: #ddd' );
			}

			console.log( content, ...styles );

		}

	}

	/**
	 * Print descriptions of all the URL arguments to the console. Differs from `describe()`
	 * in that it logs all the available arguments, not just those with descriptions.
	 */
	public describeAll( descriptions: Partial<Record<keyof T, string>> = {} ): void {
		const all = {} as Record<keyof T, string>;
		for ( const key of Object.keys( this.defaults ) ) {
			all[ key as keyof T ] = descriptions[ key ] || '';
		}
		this.describe( all );
	}

}
