import { expectType } from 'tsd';

import { UrlArgs } from './urlargs';

type MyType = { a: number, b: number };

const args = new UrlArgs( {
	myObj: ( value: string ) => JSON.parse( value ) as MyType,
	myString: 'hello',
	myNumber: 123,
	myBoolean: true,
	myArray: [ 'a', 'b' ],
} );

expectType<MyType>( args.values.myObj );
expectType<string>( args.values.myString );
expectType<number>( args.values.myNumber );
expectType<boolean>( args.values.myBoolean );
expectType<string[]>( args.values.myArray );
