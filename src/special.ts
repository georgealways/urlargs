import { isTrue, validateBoolean, validateNumber } from './validators.js';

const NULLISH_MARKER = Symbol( 'nullish' );
const ARRAY_MARKER = Symbol( 'array' );

export class NullishArg<T, K extends null | undefined> {
	readonly type: K;
	readonly typeLabel: string;
	readonly parse: ( value: string ) => T;
	readonly validate: ( value: string ) => boolean;
	readonly defaultValue?: T;
	readonly [ NULLISH_MARKER ] = true;
	constructor(
		type: K,
		typeLabel: string,
		parse = ( value: string ) => value as T,
		validate = ( _: string ) => true,
		defaultValue?: T,
	) {
		this.type = type;
		this.typeLabel = typeLabel;
		this.parse = parse;
		this.validate = validate;
		this.defaultValue = defaultValue;
	}
}

export class ArrayArg<T> {
	readonly typeLabel: string;
	readonly parse: ( value: string ) => T;
	readonly validate: ( value: string ) => boolean;
	readonly defaultValue?: T[];
	readonly type: T[];
	readonly [ ARRAY_MARKER ] = true;
	constructor(
		typeLabel: string,
		parse = ( value: string ) => value as T,
		validate = ( _: string ) => true,
		defaultValue?: T[],
	) {
		this.type = [];
		this.typeLabel = typeLabel;
		this.parse = parse;
		this.validate = validate;
		this.defaultValue = defaultValue;
	}
}

export const isNullish = ( value: any ): value is NullishArg<any, any> =>
	value && ( typeof value === 'object' || typeof value === 'function' ) && NULLISH_MARKER in value;

export const isArray = ( value: any ): value is ArrayArg<any> =>
	value && ( typeof value === 'object' || typeof value === 'function' ) && ARRAY_MARKER in value;

export const isSpecial = ( value: any ): value is NullishArg<any, any> | ArrayArg<any> =>
	isNullish( value ) || isArray( value );

const createNullish = <T, K extends null | undefined>(
	type: K,
	typeLabel: string,
	parse = ( value: string ) => value as T,
	validate = ( _: string ) => true,
) => {
	const nullish = new NullishArg<T, K>( type, typeLabel, parse, validate );
	const fn = ( defaultValue: T ) => new NullishArg<T, K>( type, typeLabel, parse, validate, defaultValue );
	return Object.assign( fn, nullish );
};

export const createArray = <T>(
	typeLabel: string,
	parse = ( value: string ) => value as T,
	validate = ( _: string ) => true,
) => {
	const array = new ArrayArg<T>( typeLabel, parse, validate );
	const fn = ( defaultValue: T[] ) => new ArrayArg<T>( typeLabel, parse, validate, defaultValue );
	return Object.assign( fn, array );
};

export const $undefined = Object.freeze( {
	number: createNullish<number, undefined>( undefined, 'undefined | number', Number, validateNumber ),
	boolean: createNullish<boolean, undefined>( undefined, 'undefined | boolean', isTrue, validateBoolean ),
	string: createNullish<string, undefined>( undefined, 'undefined | string' ),
} );

export const $null = Object.freeze( {
	number: createNullish<number, null>( null, 'null | number', Number, validateNumber ),
	boolean: createNullish<boolean, null>( null, 'null | boolean', isTrue, validateBoolean ),
	string: createNullish<string, null>( null, 'null | string' ),
} );

export const $array = Object.freeze( {
	number: createArray<number>( 'number[]', Number, validateNumber ),
	boolean: createArray<boolean>( 'boolean[]', isTrue, validateBoolean ),
	string: createArray<string>( 'string[]' ),
} );

