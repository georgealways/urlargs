import { expectError, expectType } from 'tsd';

import { $allowed, $array, $null, $undefined, UrlArgs } from './src/index.js';

type MyEnum = 'a' | 'b' | 'c';

const args = new UrlArgs( {
	myString: 'hello',
	myNumber: 123,
	myBoolean: true,
	myArray: [ 'a', 'b' ],
	myNull: $null.string,
	myNull2: $null.string( 'test' ),
	myUndefined: $undefined.number,
	myEnum: 'a' as MyEnum,
	myNumberArray: $array.number,
	myBooleanArray: $array.boolean,
	myAllowedString: $allowed.string( 'a', 'b', 'c' ),
	myAllowedNumber: $allowed.number( 1, 2, 3 ),
} );

expectType<string>( args.values.myString );
expectType<number>( args.values.myNumber );
expectType<boolean>( args.values.myBoolean );
expectType<string[]>( args.values.myArray );
expectType<string | null>( args.values.myNull );
expectType<string | null>( args.values.myNull2 );
expectType<number | undefined>( args.values.myUndefined );
expectType<MyEnum>( args.values.myEnum );
expectType<number[]>( args.values.myNumberArray );
expectType<boolean[]>( args.values.myBooleanArray );
expectType<string>( args.values.myAllowedString );
expectType<number>( args.values.myAllowedNumber );

// expected errors
expectError( new UrlArgs( { invalid: undefined } ) );
expectError( new UrlArgs( { invalid: null } ) );
expectError( new UrlArgs( { invalid: {} } ) );
expectError( new UrlArgs( { invalid: Symbol( 'invalid' ) } ) );
