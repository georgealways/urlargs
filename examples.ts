/**
 * Every form of the urlargs API in one file.
 * Strip the relative import, change to `from 'urlargs'`, and you have a starting point for any project.
 */

import { UrlArgs, u } from './src/index.js';

type Config = { width: number; height: number };

const args = new UrlArgs( {

	// primitives — plain values become typed args with that default
	count:    10,
	enabled:  true,
	name:     'test',

	// arrays — pass defaults to infer the element type
	tags:     u.array( [ 'a', 'b' ] ),       // string[]
	weights:  u.array( [ 1, 2, 3 ] ),        // number[]
	flags:    u.array( [ true, false ] ),    // boolean[]

	// arrays — pass an inner spec for an empty array
	scores:   u.array( u.number() ),         // empty number[]
	emptyTags: u.array( u.string() ),        // empty string[]

	// optional / nullable — wrap any other type
	port:     u.optional( u.number() ),                 // number | undefined, default undefined
	timeout:  u.optional( u.number(), 5000 ),           // number | undefined, default 5000
	bio:      u.nullable( u.string() ),                 // string | null, default null
	nickname: u.nullable( u.string(), 'anonymous' ),    // string | null, default 'anonymous'

	// composition — wrappers stack
	maybeTags: u.optional( u.array( u.string() ) ),     // string[] | undefined
	maybeNum:  u.nullable( u.oneof( [ 1, 2, 3 ] ) ),    // 1 | 2 | 3 | null

	// enum-like — restrict to a fixed set of strings or numbers
	theme:    u.oneof( [ 'light', 'dark', 'auto' ] ),     // first option is default
	fontSize: u.oneof( [ 12, 14, 16 ], 14 ),              // explicit default

	// JSON — type from generic, optional runtime predicate
	config:   u.json<Config>( { width: 100, height: 100 } ),
	checked:  u.json<Config>(
		{ width: 100, height: 100 },
		v => typeof ( v as Config )?.width === 'number'
	),

}, {

	// constructor options (all optional)
	search:    '?count=42&tags=x,y,z',  // explicit query string (SSR / tests)
	arrayMode: 'auto',                  // 'auto' (default) | 'comma' | 'repeated'
	strict:    false,                   // throw on invalid input instead of warning

} );

// values are typed and frozen
const { count, tags, theme, maybeTags } = args.values;
//      ^number ^readonly string[]
//                      ^'light' | 'dark' | 'auto'
//                             ^string[] | undefined
console.log( count, tags, theme, maybeTags );

// re-parse later (useful for SPAs and tests)
args.parse( '?count=99' );

// describe the args (logs to console with a styled table)
args.describe( {
	count: 'The number of items',
	theme: 'Color theme',
} );

// or log every argument
args.describeAll();

export { args };
