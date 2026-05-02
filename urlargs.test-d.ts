import { expectType } from 'tsd';

import { UrlArgs, u } from './src/index.js';

// ensures examples.ts stays type-correct as the API evolves
import './examples.js';

type MyJsonType = {
  a: number;
  b: number;
  c: { d: boolean };
};

const args = new UrlArgs( {
  myString: 'hello',
  myNumber: 123,
  myBoolean: true,
  myEmptyStringArray: u.array( u.string() ),
  myEmptyNumberArray: u.array( u.number() ),
  myEmptyBooleanArray: u.array( u.boolean() ),
  myStringArray: u.array( [ 'a', 'b' ] ),
  myNumberArray: u.array( [ 1, 2, 3 ] ),
  myBooleanArray: u.array( [ true, false ] ),
  myOptional: u.optional( u.number() ),
  myOptionalWithDefault: u.optional( u.number(), 123 ),
  myNullable: u.nullable( u.string() ),
  myNullableWithDefault: u.nullable( u.string(), 'test' ),
  myOptionalArray: u.optional( u.array( u.number() ) ),
  myOneofString: u.oneof( [ 'd', 'e', 'f' ] ),
  myOneofNumber: u.oneof( [ 1, 2, 3 ] ),
  myOneofWithDefault: u.oneof( [ 'a', 'b', 'c' ], 'b' ),
  myJson: u.json<MyJsonType>( { a: 1, b: 2, c: { d: false } } ),
} );

expectType<string>( args.values.myString );
expectType<number>( args.values.myNumber );
expectType<boolean>( args.values.myBoolean );
expectType<string[]>( args.values.myEmptyStringArray );
expectType<number[]>( args.values.myEmptyNumberArray );
expectType<boolean[]>( args.values.myEmptyBooleanArray );
expectType<string[]>( args.values.myStringArray );
expectType<number[]>( args.values.myNumberArray );
expectType<boolean[]>( args.values.myBooleanArray );
expectType<number | undefined>( args.values.myOptional );
expectType<number | undefined>( args.values.myOptionalWithDefault );
expectType<string | null>( args.values.myNullable );
expectType<string | null>( args.values.myNullableWithDefault );
expectType<number[] | undefined>( args.values.myOptionalArray );
expectType<'d' | 'e' | 'f'>( args.values.myOneofString );
expectType<1 | 2 | 3>( args.values.myOneofNumber );
expectType<'a' | 'b' | 'c'>( args.values.myOneofWithDefault );
expectType<MyJsonType>( args.values.myJson );

// @ts-expect-error use u.optional() instead
new UrlArgs( { invalid: undefined } );
// @ts-expect-error use u.nullable() instead
new UrlArgs( { invalid: null } );
// @ts-expect-error objects are not supported
new UrlArgs( { invalid: {} } );
// @ts-expect-error symbols are not supported
new UrlArgs( { invalid: Symbol( 'invalid' ) } );
// @ts-expect-error use u.array() instead
new UrlArgs( { invalid: [] } );
