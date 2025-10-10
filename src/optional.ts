import { isTrue, validateBoolean, validateNumber } from './validators.js';

const NULLISH_MARKER = Symbol( 'nullish' );

export class Nullish<T, K extends null | undefined> {
	type: K;
	parse: ( value: string ) => T;
	validate: ( value: string ) => boolean;
	defaultValue?: T;
	[ NULLISH_MARKER ] = true;
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

export const isNullish = ( value: any ): value is Nullish<any, any> =>
	value && ( typeof value === 'object' || typeof value === 'function' ) && NULLISH_MARKER in value;

const createNullish = <T, K extends null | undefined>(
	type: K,
	parse = ( value: string ) => value as T,
	validate = ( _: string ) => true,
) => {
	const nullish = new Nullish<T, K>( type, parse, validate );
	const fn = ( defaultValue: T ) => new Nullish<T, K>( type, parse, validate, defaultValue );
	return Object.assign( fn, nullish );
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

