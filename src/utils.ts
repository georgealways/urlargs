export const TRUE_VALUES = [ 'true', '1', '' ];
export const FALSE_VALUES = [ 'false', '0' ];
export const BOOL_VALUES = [ ...TRUE_VALUES, ...FALSE_VALUES ];

export const validateBoolean = ( value: string ): boolean =>
	BOOL_VALUES.includes( value.toLowerCase() );

export const validateNumber = ( value: string ): boolean =>
	value.trim() !== '' && !isNaN( Number( value ) );

export const isTrue = ( value: string ): boolean =>
	TRUE_VALUES.includes( value.toLowerCase() );

export const arraysEqual = ( a: unknown, b: unknown ): boolean => {
	if ( !Array.isArray( a ) || !Array.isArray( b ) ) return false;
	if ( a.length !== b.length ) return false;
	return a.every( ( v, i ) => v === b[ i ] );
};

export const stringify = ( value: unknown ): string => {
	if ( value === null ) return 'null';
	if ( value === undefined ) return 'undefined';
	return JSON.stringify( value );
};

export const truncate = ( str: string, maxLength = 40 ): string =>
	str.length > maxLength ? str.substring( 0, maxLength ) + '…' : str;

export const defaultSearch = (): string =>
	typeof window !== 'undefined' ? window.location.search : '';

export const splitComma = ( input: string ): string[] => {
	if ( !input ) return [];

	const BACKSLASH = '\u0000';
	const escaped = input.replace( /\\\\/g, BACKSLASH );

	const parts: string[] = [];
	let current = '';
	let isEscaped = false;

	for ( const char of escaped ) {
		if ( char === '\\' && !isEscaped ) {
			isEscaped = true;
			continue;
		}
		if ( char === ',' && !isEscaped ) {
			parts.push( current.trim() );
			current = '';
			continue;
		}
		current += char;
		isEscaped = false;
	}

	if ( isEscaped ) current += '\\';
	if ( current.length > 0 ) parts.push( current.trim() );

	return parts.map( s => s
		.replace( new RegExp( BACKSLASH, 'g' ), '\\\\' )
		.replace( /\\,/g, ',' )
	);
};
