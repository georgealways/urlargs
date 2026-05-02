export type AllowedPrimitive = string | number | boolean;

export interface ScalarSpec<T> {
	readonly kind: 'scalar';
	readonly parse: ( raw: string ) => T;
	readonly validate: ( raw: string ) => boolean;
	readonly defaultValue: T;
	readonly typeLabel: string;
}

export interface ArraySpec<T> {
	readonly kind: 'array';
	readonly parse: ( raw: string[] ) => T;
	readonly validate: ( raw: string[] ) => boolean;
	readonly defaultValue: T;
	readonly typeLabel: string;
}

export type Spec<T> = ScalarSpec<T> | ArraySpec<T>;

export type Default = AllowedPrimitive | Spec<unknown>;

export type ResolveDefault<D> =
	D extends Spec<infer T> ? T :
		D extends boolean ? boolean :
			D extends number ? number :
				D extends string ? string :
					never;

export type ResolveDefaults<T extends Record<string, Default>> = {
	[K in keyof T]: ResolveDefault<T[K]>;
};

export type ArrayMode = 'auto' | 'comma' | 'repeated';

export interface UrlArgsOptions {
	search?: string;
	arrayMode?: ArrayMode;
	strict?: boolean;
}
