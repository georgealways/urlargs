/**
 * A class for parsing and describing URL arguments.
 * @template T - The type of the object to parse the URL arguments into.
 * @example
 * const args = new UrlArgs( { count: 10, enabled: true, name: 'test' } );
 * const result = args.get();
 * console.log( result ); // { count: 20, enabled: false, name: 'urlargs' }
 */
export class UrlArgs<T extends Record<string, any>> {
	private readonly urlSearchParams: URLSearchParams;
	private readonly defaults: T;
	constructor( defaults: T ) {
		this.defaults = defaults;
		this.urlSearchParams = new URLSearchParams( window.location.search );
	}

	/**
	 * Get the URL arguments as an object.
	 * @returns An object containing the URL arguments.
	 * @example
	 * // URL: /?count=20&enabled=false&name=urlargs
	 * const args = new UrlArgs( { count: 10, enabled: true, name: 'test' } );
	 * const result = args.get();
	 * console.log( result ); // { count: 20, enabled: false, name: 'urlargs' }
	 */
	get(): T {
		const result = { ...this.defaults };

		for ( const [ key, value ] of this.urlSearchParams.entries() ) {
			if ( !( key in this.defaults ) ) continue;

			const assign = ( v: any ) => result[ key as keyof T ] = v;

			const defaultValue = this.defaults[ key as keyof T ];
			const type = typeof defaultValue;

			if ( type === 'boolean' )
				assign( value !== 'false' );
			else if ( type === 'number' )
				assign( Number( value ) );
			else if ( Array.isArray( defaultValue ) )
				assign( this.urlSearchParams.getAll( key ) );
			else
				assign( value );
		}

		return result;
	}

	/**
	 * Describe the URL arguments in a table format.
	 * @param descriptions - An object mapping keys to descriptions.
	 * @example
	 * const args = new UrlArgs( { count: 10, enabled: true, name: 'test' } );
	 * args.describe( {
	 *  count: 'The number of items to display',
	 *  enabled: 'Whether the items are enabled',
	 *  name: 'The name of the items',
	 * } );
	 *
	 * // Output:
	 * // count   | number  | (default: 10)   | The number of items to display
	 * // enabled | boolean | (default: true) | Whether the items are enabled
	 * // name    | string  | (default: test) | The name of the items
	 */
	describe( descriptions: Partial<Record<keyof T, string>> ): void {
		const keys = Object.keys( descriptions );

		const rows: string[][] = [];

		for ( const key of keys ) {
			const description = descriptions[ key ] || '';
			const type = typeof this.defaults[ key ];
			const defaultValue = this.defaults[ key ];
			const cols: string[] = [
				type,
				key,
				`default: ${JSON.stringify( defaultValue )}`,
				description,
			];
			rows.push( cols );
		}

		console.log( 'urlargs:' );
		this.printTable( rows );
	}

	private printTable( rows: string[][] ): void {
		const colWidths: number[] = [];
		for ( const row of rows ) {
			for ( let c = 0; c < row.length; c++ ) {
				const cellWidth = row[ c ].length;
				if ( !colWidths[ c ] || cellWidth > colWidths[ c ] ) {
					colWidths[ c ] = cellWidth;
				}
			}
		}
		for ( const row of rows ) {
			const line: string[] = [];
			for ( let c = 0; c < row.length; c++ ) {
				const cell = row[ c ];
				const padding = colWidths[ c ] - cell.length;
				line.push( `${cell}${ ' '.repeat( padding ) }` );
			}
			console.log( line.join( ' | ' ) );
		}
	}
}
