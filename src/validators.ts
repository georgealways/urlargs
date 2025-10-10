import { BOOL_VALUES, TRUE_VALUES } from './constants.js';

export const validateBoolean = ( value: string ): boolean => {
	return BOOL_VALUES.includes( value.toLowerCase() );
};

export const validateNumber = ( value: string ): boolean => {
	return !isNaN( Number( value ) );
};

export const isTrue = ( value: string ): boolean => {
	return TRUE_VALUES.includes( value.toLowerCase() );
};
