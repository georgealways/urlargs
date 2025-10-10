import { isTrue, validateBoolean, validateNumber } from './validators.js';

export class Optional<T, K extends null | undefined> {
	type: K;
	parse: ( value: string ) => T;
	validate: ( value: string ) => boolean;
	constructor(
		type: K,
		parse = ( value: string ) => value as T,
		validate = ( _: string ) => true,
	) {
		this.type = type;
		this.parse = parse;
		this.validate = validate;
	}
}

export const $undefined = Object.freeze( {
	number: new Optional<number, undefined>( undefined, Number, validateNumber ),
	boolean: new Optional<boolean, undefined>( undefined, isTrue, validateBoolean ),
	string: new Optional<string, undefined>( undefined ),
} );

export const $null = Object.freeze( {
	number: new Optional<number, null>( null, Number, validateNumber ),
	boolean: new Optional<boolean, null>( null, isTrue, validateBoolean ),
	string: new Optional<string, null>( null ),
} );

