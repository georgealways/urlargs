import { isTrue, validateBoolean, validateNumber } from './validators.js';

const NULLISH_MARKER = Symbol( 'nullish' );
const ARRAY_MARKER = Symbol( 'array' );

export class NullishArg<T, K extends null | undefined> {
	readonly type: K;
	readonly parse: ( value: string ) => T;
	readonly validate: ( value: string ) => boolean;
	readonly defaultValue?: T;
	readonly [ NULLISH_MARKER ] = true;
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

export class ArrayArg<T> {
	readonly parse: ( value: string ) => T;
	readonly validate: ( value: string ) => boolean;
	readonly defaultValue?: T[];
	readonly [ ARRAY_MARKER ] = true;
	constructor(
		parse = ( value: string ) => value as T,
		validate = ( _: string ) => true,
		defaultValue?: T[],
	) {
		this.parse = parse;
		this.validate = validate;
		this.defaultValue = defaultValue;
	}
}

export const isNullish = ( value: any ): value is NullishArg<any, any> =>
	value && ( typeof value === 'object' || typeof value === 'function' ) && NULLISH_MARKER in value;

export const isArray = ( value: any ): value is ArrayArg<any> =>
	value && ( typeof value === 'object' || typeof value === 'function' ) && ARRAY_MARKER in value;

const createNullish = <T, K extends null | undefined>(
	type: K,
	parse = ( value: string ) => value as T,
	validate = ( _: string ) => true,
) => {
	const nullish = new NullishArg<T, K>( type, parse, validate );
	const fn = ( defaultValue: T ) => new NullishArg<T, K>( type, parse, validate, defaultValue );
	return Object.assign( fn, nullish );
};

export const createArray = <T>( parse = ( value: string ) => value as T, validate = ( _: string ) => true ) => {
	const array = new ArrayArg<T>( parse, validate );
	const fn = ( defaultValue: T[] ) => new ArrayArg<T>( parse, validate, defaultValue );
	return Object.assign( fn, array );
};

export const $undefined = Object.freeze( {
	number: createNullish<number, undefined>( undefined, Number, validateNumber ),
	boolean: createNullish<boolean, undefined>( undefined, isTrue, validateBoolean ),
	string: createNullish<string, undefined>( undefined ),
} );

export const $null = Object.freeze( {
	number: createNullish<number, null>( null, Number, validateNumber ),
	boolean: createNullish<boolean, null>( null, isTrue, validateBoolean ),
	string: createNullish<string, null>( null ),
} );

export const $array = Object.freeze( {
	number: createArray<number>( Number, validateNumber ),
	boolean: createArray<boolean>( isTrue, validateBoolean ),
	string: createArray<string>(),
} );

