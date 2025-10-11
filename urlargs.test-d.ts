import { expectError, expectType } from 'tsd';

import { $allowed, $array, $json, $null, $undefined, UrlArgs } from './src/index';

type MyEnum = 'a' | 'b' | 'c';
type JSONType = {
	a: number;
	b: number;
	c: { d: boolean };
};

const args = new UrlArgs( {
	myString: 'hello',
	myNumber: 123,
	myBoolean: true,
	myArray: [ 'a', 'b' ],
	myNull: $null.string,
	myNull2: $null.string( 'test' ),
	myUndefined: $undefined.number,
	myUndefined2: $undefined.number( 123 ),
	myEnum: 'a' as MyEnum,
	myNumberArray: $array.number,
	myBooleanArray: $array.boolean,
	myAllowedString: $allowed.string( 'd', 'e', 'f' ),
	myAllowedNumber: $allowed.number( 1, 2, 3 ),
	myJson: $json<JSONType>( {
		a: 1,
		b: 2,
		c: { d: false },
	} )
} );

expectType<string>( args.values.myString );
expectType<number>( args.values.myNumber );
expectType<boolean>( args.values.myBoolean );
expectType<string[]>( args.values.myArray );
expectType<string | null>( args.values.myNull );
expectType<string | null>( args.values.myNull2 );
expectType<number | undefined>( args.values.myUndefined );
expectType<number | undefined>( args.values.myUndefined2 );
expectType<MyEnum>( args.values.myEnum );
expectType<number[]>( args.values.myNumberArray );
expectType<boolean[]>( args.values.myBooleanArray );
expectType<'d' | 'e' | 'f'>( args.values.myAllowedString );
expectType<1 | 2 | 3>( args.values.myAllowedNumber );
expectType<JSONType>( args.values.myJson );

expectError( new UrlArgs( { invalid: undefined } ) );
expectError( new UrlArgs( { invalid: null } ) );
expectError( new UrlArgs( { invalid: {} } ) );
expectError( new UrlArgs( { invalid: Symbol( 'invalid' ) } ) );
