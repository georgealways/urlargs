import type { Optional } from './optional.js';

export type ResolveOptionals<T> = {
	[K in keyof T]:
	T[K] extends Optional<infer U, infer N>
		? ( N extends undefined ? U | undefined : U | null )
		: T[K] extends boolean ? boolean : T[K]
};

export type DefaultValue =
	| string
	| number
	| boolean
	| Optional<string | number | boolean, null | undefined>
	| string[];

