import type { ArrayMode, Default, ResolveDefaults, Spec, UrlArgsOptions } from './types.js';

import { isSpec, u } from './spec.js';
import { arraysEqual, defaultSearch, splitComma, stringify, truncate } from './utils.js';

/**
 * Parses URL query parameters into a typed, frozen object.
 *
 * Use plain values for primitive defaults. Use the `u` namespace for arrays, optional/nullable,
 * enums, and JSON.
 *
 * @example
 * import { UrlArgs, u } from 'urlargs';
 *
 * const args = new UrlArgs( {
 *     count:   10,
 *     enabled: true,
 *     name:    'test',
 *     tags:    u.array( [ 'a', 'b' ] ),
 *     port:    u.optional( u.number() ),
 *     theme:   u.oneof( [ 'light', 'dark' ] ),
 * } );
 *
 * args.values.count;            // typed, frozen
 * args.parse( '?count=42' );    // re-parse later
 * args.describe( { count: 'The number of items' } );
 *
 * @example
 * // constructor options:
 * new UrlArgs( defaults, {
 *     search:    '?count=42',  // explicit query string (SSR / tests)
 *     arrayMode: 'auto',       // 'auto' (default) | 'comma' | 'repeated'
 *     strict:    false,        // throw on invalid input instead of warning
 * } );
 */
export class UrlArgs<T extends Record<string, Default>> {

	private readonly defaults: T;
	private readonly specs: Record<keyof T, Spec<unknown>>;
	private readonly arrayMode: ArrayMode;
	private readonly strict: boolean;

	private _values!: Readonly<ResolveDefaults<T>>;

	get values(): Readonly<ResolveDefaults<T>> {
		return this._values;
	}

	constructor( defaults: T, options: UrlArgsOptions = {} ) {
		this.defaults = defaults;
		this.arrayMode = options.arrayMode ?? 'auto';
		this.strict = options.strict ?? false;
		this.specs = this.toSpecs( defaults );
		this.parse( options.search );
	}

	/**
	 * Re-parse values from a query string. Defaults to `window.location.search`.
	 * Useful for testing and for SPAs that respond to URL changes.
	 * @example
	 * args.parse( '?count=42' );
	 * args.parse();  // reads window.location.search
	 */
	parse( search: string = defaultSearch() ): void {
		const params = new URLSearchParams( search );
		const values = {} as Record<keyof T, unknown>;
		for ( const key of Object.keys( this.specs ) as ( keyof T )[] ) {
			values[ key ] = this.resolveValue( params, key as string, this.specs[ key ] );
		}
		this.shallowFreeze( values );
		this._values = values as Readonly<ResolveDefaults<T>>;
	}

	private toSpecs( defaults: T ): Record<keyof T, Spec<unknown>> {
		const specs = {} as Record<keyof T, Spec<unknown>>;
		for ( const [ key, value ] of Object.entries( defaults ) ) {
			specs[ key as keyof T ] = this.toSpec( key, value );
		}
		return specs;
	}

	private toSpec( key: string, value: unknown ): Spec<unknown> {
		if ( isSpec( value ) ) return value;
		if ( value === undefined ) {
			throw new Error( `${ key }: use u.optional() to allow undefined` );
		}
		if ( value === null ) {
			throw new Error( `${ key }: use u.nullable() to allow null` );
		}
		if ( typeof value === 'string' ) return u.string( value );
		if ( typeof value === 'number' ) return u.number( value );
		if ( typeof value === 'boolean' ) return u.boolean( value );
		throw new Error( `${ key }: unsupported default value of type ${ typeof value }` );
	}

	private resolveValue( params: URLSearchParams, key: string, spec: Spec<unknown> ): unknown {
		if ( !params.has( key ) ) return spec.defaultValue;

		if ( spec.kind === 'scalar' ) {
			const raw = params.get( key )!;
			if ( spec.validate( raw ) ) return spec.parse( raw );
			return this.handleInvalid( key, raw, spec.defaultValue );
		}

		const raw = this.collectArray( params, key );
		if ( spec.validate( raw ) ) return spec.parse( raw );
		return this.handleInvalid( key, raw.join( ',' ), spec.defaultValue );
	}

	private collectArray( params: URLSearchParams, key: string ): string[] {
		const repeated = params.getAll( key );

		if ( this.arrayMode === 'repeated' ) return repeated;

		if ( this.arrayMode === 'comma' ) {
			if ( repeated.length > 1 ) {
				console.warn(
					`urlargs: '${ key }' appears multiple times but arrayMode is 'comma'; using repeated values`
				);
				return repeated;
			}
			return splitComma( repeated[ 0 ] );
		}

		if ( repeated.length === 1 ) return splitComma( repeated[ 0 ] );
		return repeated.flatMap( splitComma );
	}

	private handleInvalid( key: string, raw: string, fallback: unknown ): unknown {
		const message = `urlargs: invalid value for '${ key }': ${ JSON.stringify( raw ) }`;
		if ( this.strict ) throw new Error( message );
		console.warn( message );
		console.warn( `urlargs: using default value: ${ stringify( fallback ) }` );
		return fallback;
	}

	private shallowFreeze( values: Record<keyof T, unknown> ): void {
		for ( const value of Object.values( values ) ) {
			if ( Array.isArray( value ) ) Object.freeze( value );
		}
		Object.freeze( values );
	}

	/**
	 * Print descriptions of the specified URL arguments to the console.
	 * Only logs keys present in the descriptions object.
	 * @example
	 * args.describe( {
	 *     count:   'The number of items to display',
	 *     enabled: 'Whether the items are enabled',
	 * } );
	 */
	describe( descriptions: Partial<Record<keyof T, string>> = {} ): void {
		for ( const key of Object.keys( descriptions ) as ( keyof T )[] ) {
			this.describeOne( key, descriptions[ key ] || '' );
		}
	}

	/**
	 * Like `describe()`, but logs every argument, not just those with descriptions.
	 * @example
	 * args.describeAll();
	 * args.describeAll( { count: 'The number of items' } );  // descriptions are optional
	 */
	describeAll( descriptions: Partial<Record<keyof T, string>> = {} ): void {
		const all = {} as Record<keyof T, string>;
		for ( const key of Object.keys( this.defaults ) as ( keyof T )[] ) {
			all[ key ] = descriptions[ key ] || '';
		}
		this.describe( all );
	}

	private describeOne( key: keyof T, description: string ): void {
		const spec = this.specs[ key ];
		const value = this._values[ key ];
		const isDefault = value === spec.defaultValue || arraysEqual( value, spec.defaultValue );
		const valueStr = truncate( stringify( value ) );
		const styles: string[] = [];

		let content = `%c${ String( key ) }: `;
		styles.push( 'font-weight: bold' );

		if ( isDefault ) {
			content += `%c${ valueStr }`;
			styles.push( 'color: #a6f' );
		} else {
			content += `%c${ valueStr }`;
			styles.push( 'font-weight: bold; color: #f70' );
			content += ` %c${ stringify( spec.defaultValue ) }`;
			styles.push( 'color: #a6f7; text-decoration: line-through' );
		}

		content += `%c · ${ spec.typeLabel }`;
		styles.push( 'color: #999' );

		if ( description.trim() ) {
			content += `%c · ${ description.trim() }`;
			styles.push( 'color: #ddd' );
		}

		console.log( content, ...styles );
	}

}
