import { expectError, expectType } from 'tsd';

import { $null, $undefined, UrlArgs } from './src/index.js';

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
	myInvalid: undefined as number | undefined,
} );

expectType<string>( args.values.myString );
expectType<number>( args.values.myNumber );
expectType<boolean>( args.values.myBoolean );
expectType<string[]>( args.values.myArray );
expectType<string | null>( args.values.myNull );
expectType<string | null>( args.values.myNull2 );
expectType<number | undefined>( args.values.myUndefined );
expectType<MyEnum>( args.values.myEnum );
expectType<number | undefined>( args.values.myInvalid );

expectError( new UrlArgs( {
	invalid: Symbol( 'invalid' )
} ) );

expectError( new UrlArgs( {
	invalid: {}
} ) );
