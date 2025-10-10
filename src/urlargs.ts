import type { AllowedPrimitives, DefaultValue, ResolveNullish } from './types.js';

import { isArray, isNullish } from './special.js';
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

	readonly values: ResolveNullish<T>;

	private validateDefaults( defaults: T ) {
		for ( const [ key, defaultValue ] of Object.entries( defaults ) ) {
			if ( isNullish( defaultValue ) || isArray( defaultValue ) ) continue;
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

		const values = {} as ResolveNullish<T>;

		for ( const [ key, arg ] of Object.entries( this.defaults ) ) {

			if ( !this.urlSearchParams.has( key ) ) {
				let v: DefaultValue | AllowedPrimitives[] | undefined | null = arg;
				if ( isNullish( arg ) ) {
					v = arg.defaultValue ?? arg.type;
				} else if ( isArray( arg ) ) {
					v = arg.defaultValue ?? [];
				}
				values[ key as keyof T ] = v as ResolveNullish<T>[keyof T];
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

			if ( isNullish( arg ) ) {
				const fallback = arg.defaultValue ?? arg.type;
				assign( arg.parse( stringValue ), arg.validate, fallback );
			} else if ( isArray( arg ) ) {
				assign(
					arrayValue.map( arg.parse ),
					() => arrayValue.every( arg.validate ),
					arg.defaultValue ?? []
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
		const rows: string[][] = [];
		const styles: string[][] = [];
		for ( const key of keys ) {
			let description = descriptions[ key ] || '';
			const defaultValue = this.defaults[ key ];
			const type = Array.isArray( defaultValue ) ? 'array' : typeof defaultValue;
			const value = this.values[ key ];
			if ( defaultValue !== value ) {
				description += ` (default: ${JSON.stringify( defaultValue )})`;
			}
			rows.push( [
				key,
				type,
				this.truncate( JSON.stringify( value ) ),
				description.trim(),
			] );
			styles.push( [
				'font-weight: bold',
				'color: #999',
				defaultValue !== value ? 'font-weight: bold; color: #f70' : '',
				'color: #999',
			] );
		}
		this.printTable( rows, styles );
	}

	private truncate( str: string, maxLength = 40 ): string {
		return str.length > maxLength ? str.substring( 0, maxLength ) + '…' : str;
	}

	private printTable( rows: string[][], styles: string[][] ): void {
		const colWidths: number[] = [];
		for ( const row of rows ) {
			for ( let c = 0; c < row.length; c++ ) {
				const cellWidth = row[ c ]?.length ?? 0;
				if ( !colWidths[ c ] || cellWidth > colWidths[ c ] ) {
					colWidths[ c ] = cellWidth;
				}
			}
		}

		rows.forEach( ( row, i ) => {
			const rowStyles = styles[ i ];
			const lineParts = row.map( ( cell, c ) => {
				const padding = ( colWidths[ c ] ?? 0 ) - cell.length;
				const paddedCell = `${cell}${ ' '.repeat( padding ) }`;
				return `%c${paddedCell}`;
			} );
			const line = lineParts.join( '  ' );
			console.log( line, ...rowStyles );
		} );
	}

}

