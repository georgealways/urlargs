import type { AllowedArg, ArrayArg, JsonArg, NullishArg } from './special.js';

export type ResolveSpecial<T> = {
	[K in keyof T]:
	T[K] extends NullishArg<infer U, any> & { defaultValue: infer D }
		? ( undefined extends D ? U | undefined : U | null )
		: T[K] extends ArrayArg<infer A> ? A[]
			: T[K] extends AllowedArg<any, infer A>
				? ( A extends readonly ( infer L )[] ? L : never )
				: T[K] extends JsonArg<infer J> ? J
					: T[K] extends boolean ? boolean : T[K]
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
