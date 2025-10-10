import type { AllowedPrimitives, DefaultValue, ResolveSpecial } from './types.js';

import { isAllowed, isArray, isNullish, isSpecial } from './special.js';
import { isTrue, validateBoolean, validateNumber } from './validators.js';

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

	private validateDefaults( defaults: T ) {
		for ( const [ key, defaultValue ] of Object.entries( defaults ) ) {
			if ( isNullish( defaultValue ) || isArray( defaultValue ) || isAllowed( defaultValue ) ) continue;
			if ( defaultValue === undefined ) {
				throw new Error( 'Use $undefined to allow undefined values' );
			}
			if ( defaultValue === null ) {
				throw new Error( 'Use $null to allow null values' );
			}
			if ( Array.isArray( defaultValue ) && !defaultValue.every( v => typeof v === 'string' ) ) {
				throw new Error( 'Use $array for non string[] arrays.' );
			}
			const type = typeof defaultValue;
			if ( ![ 'boolean', 'number', 'string' ].includes( type ) && !Array.isArray( defaultValue ) ) {
				throw new Error( `Unsupported type for ${key}: ${type}` );
			}
		}
	}

	constructor( defaults: T, search = window.location.search ) {
		this.validateDefaults( defaults );
		this.defaults = defaults;
		this.urlSearchParams = new URLSearchParams( search );
		this.values = this.getValues();
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
			const arrayValue = this.urlSearchParams.getAll( key );

			const assign = ( parsedValue: any, validator: ( v: string ) => boolean, fallback: any ) => {
				if ( validator( stringValue ) ) {
					values[ key as keyof T ] = parsedValue;
				} else {
					console.warn( `Invalid URL argument for ${key}: "${stringValue}"` );
					console.warn( `Using default value: ${JSON.stringify( fallback )}` );
					values[ key as keyof T ] = fallback;
				}
			};

			if ( isAllowed( arg ) ) {
				const parsed = arg.parse( stringValue );
				if ( !arg.validate( stringValue ) ) {
					console.warn( `Invalid URL argument for ${key}: "${stringValue}" (allowed: ${arg.allowed.join( ', ' )})` );
				}
				values[ key as keyof T ] = parsed as ResolveSpecial<T>[keyof T];
			} else if ( isNullish( arg ) ) {
				assign( arg.parse( stringValue ), arg.validate, arg.defaultValue );
			} else if ( isArray( arg ) ) {
				assign(
					arrayValue.map( arg.parse ),
					() => arrayValue.every( arg.validate ),
					arg.defaultValue
				);
			} else if ( typeof arg === 'boolean' ) {
				assign( isTrue( stringValue ), validateBoolean, arg );
			} else if ( typeof arg === 'number' ) {
				assign( Number( stringValue ), validateNumber, arg );
			} else if ( typeof arg === 'string' ) {
				assign( stringValue, () => true, arg );
			} else if ( Array.isArray( arg ) ) {
				assign( arrayValue, () => true, arg );
			}

		}

		return values;

	}

	/**
	 * Describe the URL arguments in a table format.
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
			let description = descriptions[ key ] || '';
			let defaultValue: DefaultValue | AllowedPrimitives[] | undefined | null = this.defaults[ key ];
			let type: string;
			if ( isSpecial( defaultValue ) ) {
				type = defaultValue.typeLabel;
				defaultValue = defaultValue.defaultValue;
			} else {
				type = Array.isArray( defaultValue ) ? 'string[]' : typeof defaultValue;
			}
			const value = this.values[ key ];
			const isDefaultValue = value === defaultValue || arraysEqual( defaultValue, value );

			const valueStr = this.truncate( this.stringify( value ) );
			const valueStyle = !isDefaultValue ? 'font-weight: bold; color: #f70' : '';

			console.log( `%c${key}: %c${valueStr}`, 'font-weight: bold', valueStyle );

			let secondLine = type + ' ·';
			if ( !isDefaultValue ) {
				const defaultStr = this.stringify( defaultValue );
				secondLine += ` (default: ${defaultStr})`;
			}
			if ( description.trim() ) {
				secondLine += ` ${description.trim()}`;
			}

			console.log( ` %c└─ ${type}%c${secondLine.substring( type.length )}`, 'font-style: italic; color: #999', 'color: #999' );
		}
	}

	private stringify( value: any ): string {
		if ( value === null ) return 'null';
		if ( value === undefined ) return 'undefined';
		return JSON.stringify( value );
	}

	private truncate( str: string, maxLength = 40 ): string {
		return str.length > maxLength ? str.substring( 0, maxLength ) + '…' : str;
	}

}

const arraysEqual = ( a: any, b: any ): boolean => {
	if ( Array.isArray( a ) && Array.isArray( b ) ) {
		return a.every( ( value, index ) => value === b[ index ] );
	}
	return false;
};
