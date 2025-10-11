export const TRUE_VALUES = [ 'true', '1', '' ];
export const FALSE_VALUES = [ 'false', '0' ];
export const BOOL_VALUES = [ ...TRUE_VALUES, ...FALSE_VALUES ];

export const validateBoolean = ( value: string ): boolean => {
	return BOOL_VALUES.includes( value.toLowerCase() );
};

export const validateNumber = ( value: string ): boolean => {
	return !isNaN( Number( value ) );
};

export const isTrue = ( value: string ): boolean => {
	return TRUE_VALUES.includes( value.toLowerCase() );
};

export const arraysEqual = ( a: any, b: any ): boolean => {
	if ( Array.isArray( a ) && Array.isArray( b ) ) {
		return a.every( ( value, index ) => value === b[ index ] );
	}
	return false;
};

export const stringify = ( value: any ): string => {
	if ( value === null ) return 'null';
	if ( value === undefined ) return 'undefined';
	return JSON.stringify( value );
};

export const truncate = ( str: string, maxLength = 40 ): string => {
	return str.length > maxLength ? str.substring( 0, maxLength ) + '…' : str;
};
