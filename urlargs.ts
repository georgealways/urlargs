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

	readonly values: T;

	constructor( defaults: T ) {
		this.defaults = defaults;
		const searchParams = typeof window !== 'undefined' ? window.location.search : '';
		this.urlSearchParams = new URLSearchParams( searchParams );
		this.values = this.getValues();
	}

	private getValues(): T {

		const values = { ...this.defaults };

		for ( const [ key, value ] of this.urlSearchParams.entries() ) {

			if ( !( key in this.defaults ) ) continue;

			const assign = ( v: any ) => values[ key as keyof T ] = v;

			const defaultValue = this.defaults[ key as keyof T ];
			const type = typeof defaultValue;

			if ( type === 'boolean' )
				assign( value !== 'false' && value !== '0' );
			else if ( type === 'number' )
				assign( Number( value ) );
			else if ( Array.isArray( defaultValue ) )
				assign( this.urlSearchParams.getAll( key ) );
			else
				assign( value );

		}

		return values;

	}

	/**
	 * Describe the URL arguments in a table format.
	 * @param descriptions - An object mapping keys to descriptions.
	 * @example
	 * const args = new UrlArgs( { count: 10, enabled: true, name: 'test', tags: [ 'a', 'b' ] } );
	 * args.describe( {
	 *  count: 'The number of items to display',
	 *  enabled: 'Whether the items are enabled',
	 *  name: 'The name of the items',
	 * } );
	 *
	 * // Output:
	 * // count    10         The number of items to display
	 * // enabled  true       Whether the items are enabled
	 * // name     "test"     The name of the items
	 * // tags     ["a","b"]
	 */
	public describe( descriptions: Partial<Record<keyof T, string>> ): void {
		const keys = Object.keys( this.defaults );
		const rows: string[][] = [];
		const styles: string[][] = [];
		for ( const key of keys ) {
			const description = descriptions[ key ] || '';
			const defaultValue = this.defaults[ key ];
			const type = Array.isArray( defaultValue ) ? 'array' : typeof defaultValue;
			const value = this.values[ key ];
			const cols = [
				key,
				type,
				JSON.stringify( value ),
				description,
			];
			styles.push( [
				'font-weight: bold;',
				'color: #999;',
				defaultValue !== value ? 'font-weight: bold; color: #f70;' : '',
				'color: #999;',
			] );
			rows.push( cols );
		}
		console.log(
			'URL Arguments: %c%s',
			'font-style: italic;',
			this.urlSearchParams.toString() || 'defaults'
		);
		this.printTable( rows, styles );
	}

	private printTable( rows: string[][], styles: string[][] ): void {
		const colWidths: number[] = [];
		for ( const row of rows ) {
			for ( let c = 0; c < row.length; c++ ) {
				const cellWidth = row[ c ].length;
				if ( !colWidths[ c ] || cellWidth > colWidths[ c ] ) {
					colWidths[ c ] = cellWidth;
				}
			}
		}

		rows.forEach( ( row, i ) => {
			const rowStyles = styles[ i ];

			const lineParts = row.map( ( cell, c ) => {
				const padding = colWidths[ c ] - cell.length;
				const paddedCell = `${cell}${ ' '.repeat( padding ) }`;
				return `%c${paddedCell}`;
			} );

			const line = lineParts.join( '  ' );

			console.log( line, ...rowStyles );
		} );
	}

}
