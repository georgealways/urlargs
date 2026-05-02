import type { AllowedPrimitive, ArraySpec, ScalarSpec, Spec } from './types.js';

import { isTrue, validateBoolean, validateNumber } from './utils.js';

export const isSpec = ( v: unknown ): v is Spec<unknown> => {
	if ( v === null || typeof v !== 'object' ) return false;
	const kind = ( v as { kind?: unknown } ).kind;
	return kind === 'scalar' || kind === 'array';
};

const string = ( defaultValue = '' ): ScalarSpec<string> => ( {
	kind: 'scalar',
	parse: raw => raw,
	validate: () => true,
	defaultValue,
	typeLabel: 'string',
} );

const number = ( defaultValue = 0 ): ScalarSpec<number> => ( {
	kind: 'scalar',
	parse: Number,
	validate: validateNumber,
	defaultValue,
	typeLabel: 'number',
} );

const boolean = ( defaultValue = false ): ScalarSpec<boolean> => ( {
	kind: 'scalar',
	parse: isTrue,
	validate: validateBoolean,
	defaultValue,
	typeLabel: 'boolean',
} );

function array<T>( inner: ScalarSpec<T> ): ArraySpec<T[]>;
function array( defaults: readonly string[] ): ArraySpec<string[]>;
function array( defaults: readonly number[] ): ArraySpec<number[]>;
function array( defaults: readonly boolean[] ): ArraySpec<boolean[]>;
function array(
	arg: ScalarSpec<unknown> | readonly AllowedPrimitive[],
): ArraySpec<unknown[]> {
	if ( isSpec( arg ) ) return makeArray( arg as ScalarSpec<unknown>, [] );
	return makeArray( inferInner( arg ), [ ...arg ] );
}

const inferInner = ( defaults: readonly AllowedPrimitive[] ): ScalarSpec<unknown> => {
	if ( defaults.length === 0 ) return string() as ScalarSpec<unknown>;
	const first = defaults[ 0 ];
	if ( typeof first === 'string' ) return string() as ScalarSpec<unknown>;
	if ( typeof first === 'number' ) return number() as ScalarSpec<unknown>;
	if ( typeof first === 'boolean' ) return boolean() as ScalarSpec<unknown>;
	throw new Error( `u.array: cannot infer element type from ${ typeof first }` );
};

const makeArray = <T>( inner: ScalarSpec<T>, defaultValue: T[] ): ArraySpec<T[]> => ( {
	kind: 'array',
	parse: raw => raw.map( inner.parse ),
	validate: raw => raw.every( inner.validate ),
	defaultValue,
	typeLabel: `${ inner.typeLabel }[]`,
} );

function optional<T>( inner: Spec<T>, defaultValue?: T | undefined ): Spec<T | undefined> {
	if ( inner.kind === 'scalar' ) {
		return {
			kind: 'scalar',
			parse: raw => raw === 'undefined' ? undefined : inner.parse( raw ),
			validate: raw => raw === 'undefined' || inner.validate( raw ),
			defaultValue,
			typeLabel: `${ inner.typeLabel }|undefined`,
		};
	}
	return {
		kind: 'array',
		parse: raw => isUndefinedSentinel( raw ) ? undefined : inner.parse( raw ),
		validate: raw => isUndefinedSentinel( raw ) || inner.validate( raw ),
		defaultValue,
		typeLabel: `${ inner.typeLabel }|undefined`,
	};
}

function nullable<T>( inner: Spec<T>, defaultValue: T | null = null ): Spec<T | null> {
	if ( inner.kind === 'scalar' ) {
		return {
			kind: 'scalar',
			parse: raw => raw === 'null' ? null : inner.parse( raw ),
			validate: raw => raw === 'null' || inner.validate( raw ),
			defaultValue,
			typeLabel: `${ inner.typeLabel }|null`,
		};
	}
	return {
		kind: 'array',
		parse: raw => isNullSentinel( raw ) ? null : inner.parse( raw ),
		validate: raw => isNullSentinel( raw ) || inner.validate( raw ),
		defaultValue,
		typeLabel: `${ inner.typeLabel }|null`,
	};
}

const isUndefinedSentinel = ( raw: string[] ): boolean =>
	raw.length === 1 && raw[ 0 ] === 'undefined';

const isNullSentinel = ( raw: string[] ): boolean =>
	raw.length === 1 && raw[ 0 ] === 'null';

const oneof = <const A extends readonly ( string | number )[]>(
	options: A,
	defaultValue: A[ number ] = options[ 0 ],
): ScalarSpec<A[ number ]> => {
	const isNumeric = typeof options[ 0 ] === 'number';
	const parse = ( raw: string ): A[ number ] =>
		( isNumeric ? Number( raw ) : raw ) as A[ number ];
	return {
		kind: 'scalar',
		parse,
		validate: raw => {
			if ( isNumeric && !validateNumber( raw ) ) return false;
			return options.includes( parse( raw ) );
		},
		defaultValue,
		typeLabel: options.map( v => JSON.stringify( v ) ).join( '|' )
	};
};

const json = <T>(
	defaultValue: T,
	isValid: ( v: unknown ) => boolean = () => true,
): ScalarSpec<T> => ( {
	kind: 'scalar',
	parse: raw => JSON.parse( raw ) as T,
	validate: raw => {
		try {
			return isValid( JSON.parse( raw ) );
		} catch {
			return false;
		}
	},
	defaultValue,
	typeLabel: 'json'
} );

export const u = {
	string,
	number,
	boolean,
	array,
	optional,
	nullable,
	oneof,
	json,
};
