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
