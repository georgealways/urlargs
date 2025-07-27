type UnwrapFunctions<T> = {
	[K in keyof T]: T[K] extends ( v: string ) => infer R ? R : T[K];
};

type DefaultValue = null | undefined | string | number | boolean | string[] | ( ( v?: string ) => any );

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

	readonly values: UnwrapFunctions<T>;

	constructor( defaults: T, search = window.location.search ) {
		this.defaults = defaults;
		this.urlSearchParams = new URLSearchParams( search );
		this.values = this.getValues();
	}

	static readonly trueValues = [ 'true', '1', '' ];
	static readonly falseValues = [ 'false', '0' ];
	static readonly booleanValues = [ ...UrlArgs.trueValues, ...UrlArgs.falseValues ];

	static validateBoolean( value: string ): boolean {
		return UrlArgs.booleanValues.includes( value.toLowerCase() );
	}

	static validateNumber( value: string ): boolean {
		return !isNaN( Number( value ) );
	}

	private getValues() {

		const values = {} as UnwrapFunctions<T>;

		for ( const [ key, defaultValue ] of Object.entries( this.defaults ) ) {

			if ( !this.urlSearchParams.has( key ) ) {
				if ( typeof defaultValue === 'function' ) {
					values[ key as keyof T ] = defaultValue();
				} else {
					values[ key as keyof T ] = defaultValue as UnwrapFunctions<T>[keyof T];
				}
				continue;
			}

			const stringValue = this.urlSearchParams.get( key )!;

			const assign = ( parsedValue: any, validator?: ( v: string ) => boolean ) => {
				if ( !validator || validator( stringValue ) ) {
					values[ key as keyof T ] = parsedValue;
				} else {
					console.warn( `Invalid URL argument for ${key} [${typeof defaultValue}]: "${stringValue}"` );
					console.warn( `Using default value: ${JSON.stringify( defaultValue )}` );
					values[ key as keyof T ] = defaultValue as UnwrapFunctions<T>[keyof T];
				}
			};

			if ( typeof defaultValue === 'boolean' )
				assign( UrlArgs.trueValues.includes( stringValue.toLowerCase() ), UrlArgs.validateBoolean );
			else if ( typeof defaultValue === 'number' )
				assign( Number( stringValue ), UrlArgs.validateNumber );
			else if ( Array.isArray( defaultValue ) )
				assign( this.urlSearchParams.getAll( key ) );
			else if ( typeof defaultValue === 'string' )
				assign( stringValue );
			else if ( typeof defaultValue === 'function' )
				assign( defaultValue( stringValue ) );
			else
				throw new Error( `Unsupported type for ${key}: ${typeof defaultValue}` );

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
