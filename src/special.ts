import { isTrue, validateBoolean, validateNumber } from './validators.js';

const NULLISH_MARKER = Symbol( 'nullish' );
const ARRAY_MARKER = Symbol( 'array' );
const ALLOWED_MARKER = Symbol( 'allowed' );
const JSON_MARKER = Symbol( 'json' );

class BaseArg<T> {
	constructor(
		readonly typeLabel: string,
		readonly parse = ( value: string ) => value as T,
		readonly validate = ( _: string ) => true,
	) {}
}

export class NullishArg<T, K extends null | undefined> extends BaseArg<T> {
	readonly [ NULLISH_MARKER ] = true;
	constructor(
		readonly defaultValue: T | K,
		...args: ConstructorParameters<typeof BaseArg<T>>
	) {
		super( ...args );
	}
}

export class ArrayArg<T> extends BaseArg<T> {
	readonly [ ARRAY_MARKER ] = true;
	constructor(
		readonly defaultValue?: T[],
		...args: ConstructorParameters<typeof BaseArg<T>>
	) {
		super( ...args );
	}
}

export class AllowedArg<T, A extends readonly T[] = T[]> extends BaseArg<T> {
	readonly [ ALLOWED_MARKER ] = true;
	readonly defaultValue: T;
	constructor(
		readonly allowed: A,
		...args: ConstructorParameters<typeof BaseArg<T>>
	) {
		super( ...args );
		this.defaultValue = allowed[ 0 ];
	}
}

export class JsonArg<T> extends BaseArg<T> {
	readonly [ JSON_MARKER ] = true;
	constructor(
		readonly defaultValue: T,
		...args: ConstructorParameters<typeof BaseArg<T>>
	) {
		super( ...args );
	}
}

export const isNullish = ( v: any ): v is NullishArg<any, any> =>
	v && ( typeof v === 'object' || typeof v === 'function' ) && NULLISH_MARKER in v;

export const isArray = ( v: any ): v is ArrayArg<any> =>
	v && ( typeof v === 'object' || typeof v === 'function' ) && ARRAY_MARKER in v;

export const isAllowed = ( v: any ): v is AllowedArg<any> =>
	v && ( typeof v === 'object' || typeof v === 'function' ) && ALLOWED_MARKER in v;

export const isJson = ( v: any ): v is JsonArg<any> =>
	v && ( typeof v === 'object' || typeof v === 'function' ) && JSON_MARKER in v;

export const isSpecial = ( v: any ): v is NullishArg<any, any> | ArrayArg<any> | AllowedArg<any> | JsonArg<any> =>
	isNullish( v ) || isArray( v ) || isAllowed( v ) || isJson( v );

const createNullish = <T, K extends null | undefined>(
	type: K,
	typeLabel: string,
	parse = ( value: string ) => value as T,
	validate = ( _: string ) => true,
) => {
	const wrapParse = ( value: string ): T => {
		if ( value === 'null' ) return null as T;
		if ( value === 'undefined' ) return undefined as T;
		return parse( value );
	};
	const wrapValidate = ( value: string ) => {
		if ( value === 'null' || value === 'undefined' ) return true;
		return validate( value );
	};
	const nullish = new NullishArg<T, K>( type, typeLabel, wrapParse, wrapValidate );
	const fn = ( defaultValue: T | K ) => new NullishArg<T, K>( defaultValue, typeLabel, wrapParse, wrapValidate );
	return Object.assign( fn, nullish );
};

const createArray = <T>(
	typeLabel: string,
	parse = ( value: string ) => value as T,
	validate = ( _: string ) => true,
) => {
	const array = new ArrayArg<T>( [], typeLabel, parse, validate );
	const fn = ( defaultValue: T[] ) => new ArrayArg<T>( defaultValue, typeLabel, parse, validate );
	return Object.assign( fn, array );
};

const createAllowed = <T extends string | number | boolean>(
	baseTypeLabel: string,
	parse: ( value: string ) => T,
	baseValidate: ( value: string ) => boolean,
) => <const A extends readonly T[]>( ...allowed: A ) => {
	const typeLabel = `${baseTypeLabel} (${allowed.join( ', ' )})`;
	const validate = ( value: string ) => {
		const parsed = parse( value );
		return baseValidate( value ) && allowed.includes( parsed );
	};
	return new AllowedArg<T, A>( allowed, typeLabel, parse, validate );
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

export const $allowed = Object.freeze( {
	number: createAllowed<number>( 'number', Number, validateNumber ),
	string: createAllowed<string>( 'string', v => v, () => true ),
} );

export const $json = <T>( fallback: T ): JsonArg<T> => {
	const parse = ( value: string ): T => JSON.parse( value );
	const validate = ( value: string ): boolean => {
		try {
			JSON.parse( value );
			return true;
		} catch {
			return false;
		}
	};
	return new JsonArg<T>( fallback, 'json', parse, validate );
};

