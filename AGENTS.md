# urlargs (for coding agents)

Tool for parsing URL query parameters into a typed object.

```ts
import { UrlArgs } from 'urlargs';

const args = new UrlArgs( {
	enabled: false,
	count:   10,
	name:    'test',
} );

// 🌐 ?count=20&enabled=true&name=foo
args.values.count    // → 20
args.values.enabled  // → true
args.values.name     // → 'foo'
```

See `./examples.ts` for complete usage examples.
