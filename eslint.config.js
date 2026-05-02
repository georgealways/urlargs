import { defineConfig } from 'eslint/config';
import { ts } from 'eslint-config-gmb';

export default defineConfig( [
	...ts,
	{
		files: [ '**/*.ts' ],
		rules: {
			'no-redeclare': 'off'
		}
	},
	{
		ignores: [ 'dist' ]
	}
] );
