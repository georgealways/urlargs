import { expectError, expectType } from 'tsd';

import { UrlArgs } from './urlargs';

type MyType = { a: number, b: number };
type MyEnum = 'a' | 'b' | 'c';

const args = new UrlArgs( {
	myObj: ( value?: string ): MyType => {
		if ( !value ) return { a: 0, b: 0 };
		return JSON.parse( value );
	},
	myString: 'hello',
	myNumber: 123,
	myBoolean: true,
	myArray: [ 'a', 'b' ],
	myNull: null as string | null,
	myUndefined: 2 as number | undefined,
	myEnum: 'a' as MyEnum
} );

expectType<MyType>( args.values.myObj );
expectType<string>( args.values.myString );
expectType<number>( args.values.myNumber );
expectType<boolean>( args.values.myBoolean );
expectType<string[]>( args.values.myArray );
expectType<string | null>( args.values.myNull );
expectType<number | undefined>( args.values.myUndefined );
expectType<MyEnum>( args.values.myEnum );

expectError( new UrlArgs( {
	count: 10,
	enabled: true,
	name: 'test',
	tags: [ 'a', 'b' ],
	// @ts-expect-error - should throw on unsupported type
	invalid: Symbol( 'invalid' ),
} ) );
