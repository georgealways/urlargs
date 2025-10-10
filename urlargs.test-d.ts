import { expectError, expectType } from 'tsd';

import { UrlArgs, $null } from './src/index.js';

type MyEnum = 'a' | 'b' | 'c';

const args = new UrlArgs( {
	myString: 'hello',
	myNumber: 123,
	myBoolean: true,
	myArray: [ 'a', 'b' ],
	myNull: $null.string,
	myUndefined: 2 as number | undefined,
	myEnum: 'a' as MyEnum,
} );

expectType<string>( args.values.myString );
expectType<number>( args.values.myNumber );
expectType<boolean>( args.values.myBoolean );
expectType<string[]>( args.values.myArray );
expectType<string | null>( args.values.myNull );
expectType<number | undefined>( args.values.myUndefined );
expectType<MyEnum>( args.values.myEnum );

expectError( new UrlArgs( {
	invalid: Symbol( 'invalid' )
} ) );

expectError( new UrlArgs( {
	invalid: {}
} ) );
