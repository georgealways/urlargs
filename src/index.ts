export class UrlArgs<T> {
	private readonly urlSearchParams: URLSearchParams;
	private readonly defaults: T;
	constructor( defaults: T ) {
		this.defaults = defaults;
		this.urlSearchParams = new URLSearchParams( window.location.search );
	}

	get(): T {
		const result = { ...this.defaults };
		for ( const key of Object.keys( this.urlSearchParams ) ) {
			const keyStr = String( key );

			if ( !this.urlSearchParams.has( keyStr ) ) continue;

			const value = this.urlSearchParams.get( keyStr );
			const defaultValue = typeof this.defaults[ key ];
			const type = typeof defaultValue;
			const assign = ( value: any ) => result[ key as keyof T ] = value;

			if ( type === 'boolean' )
				assign( value !== 'false' );
			else if ( type === 'number' )
				assign( Number( value ) );
			else if ( Array.isArray( defaultValue ) )
				assign( this.urlSearchParams.getAll( keyStr ) );
			else
				assign( value );
		}
		return result;
	}
}
