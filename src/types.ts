import type { AllowedArg, ArrayArg, JsonArg, NullishArg } from './special.js';

type ResolveNullishArg<T> =
	T extends NullishArg<infer U, any> & { defaultValue: infer D }
		? U | ( undefined extends D ? undefined : null )
		: never;

type ResolveAllowedArg<T> =
	T extends AllowedArg<any, infer A>
		? ( A extends readonly ( infer L )[] ? L : never )
		: never;

type ResolveArgType<T> =
	T extends NullishArg<any, any> ? ResolveNullishArg<T>
		: T extends ArrayArg<infer A> ? A[]
			: T extends AllowedArg<any, any> ? ResolveAllowedArg<T>
				: T extends JsonArg<infer J> ? J
					: T extends boolean ? boolean
						: T;

export type ResolveSpecial<T> = {
	[K in keyof T]: ResolveArgType<T[K]>
};

export type AllowedPrimitives = string | number | boolean;

export type DefaultValue =
	| AllowedPrimitives
	| NullishArg<AllowedPrimitives, undefined | null>
	| ArrayArg<AllowedPrimitives>
	| AllowedArg<AllowedPrimitives, readonly AllowedPrimitives[]>
	| JsonArg<any>
	| string[];

export type ArrayMode = 'repeated' | 'comma';
