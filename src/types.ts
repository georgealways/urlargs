import type { Nullish } from './optional.js';

export type ResolveNullish<T> = {
	[K in keyof T]:
	T[K] extends Nullish<infer U, infer N>
		? ( N extends undefined ? U | undefined : U | null )
		: T[K] extends boolean ? boolean : T[K]
};

export type DefaultValue =
	| string
	| number
	| boolean
	| Nullish<string | number | boolean, null | undefined>
	| string[];

