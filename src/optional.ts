import { isTrue, validateBoolean, validateNumber } from './validators.js';

const OPTIONAL_MARKER = Symbol( 'optional' );

export class Optional<T, K extends null | undefined> {
	type: K;
	parse: ( value: string ) => T;
	validate: ( value: string ) => boolean;
	defaultValue?: T;
	[ OPTIONAL_MARKER ] = true;
	constructor(
		type: K,
		parse = ( value: string ) => value as T,
		validate = ( _: string ) => true,
		defaultValue?: T,
	) {
		this.type = type;
		this.parse = parse;
		this.validate = validate;
		this.defaultValue = defaultValue;
	}
}

export const isOptional = ( value: any ): value is Optional<any, any> =>
	value && ( typeof value === 'object' || typeof value === 'function' ) && OPTIONAL_MARKER in value;

const createOptional = <T, K extends null | undefined>(
	type: K,
	parse = ( value: string ) => value as T,
	validate = ( _: string ) => true,
) => {
	const optional = new Optional<T, K>( type, parse, validate );
	const fn = ( defaultValue: T ) => new Optional<T, K>( type, parse, validate, defaultValue );
	return Object.assign( fn, optional );
};

export const $undefined = Object.freeze( {
	number: createOptional<number, undefined>( undefined, Number, validateNumber ),
	boolean: createOptional<boolean, undefined>( undefined, isTrue, validateBoolean ),
	string: createOptional<string, undefined>( undefined ),
} );

export const $null = Object.freeze( {
	number: createOptional<number, null>( null, Number, validateNumber ),
	boolean: createOptional<boolean, null>( null, isTrue, validateBoolean ),
	string: createOptional<string, null>( null ),
} );

