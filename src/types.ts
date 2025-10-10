import type { ArrayArg, NullishArg } from './special.js';

export type ResolveNullish<T> = {
	[K in keyof T]:
	T[K] extends NullishArg<infer U, infer N>
		? ( N extends undefined ? U | undefined : U | null )
		: T[K] extends ArrayArg<infer A> ? A[]
			: T[K] extends boolean ? boolean : T[K]
};

export type AllowedPrimitives = string | number | boolean;

export type DefaultValue =
	| AllowedPrimitives
	| NullishArg<AllowedPrimitives, null | undefined>
	| ArrayArg<AllowedPrimitives>
	| string[];

