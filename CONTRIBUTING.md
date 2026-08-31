# Contributing

Install the locked JavaScript dependencies and run the available checks:

~~~bash
npm ci
npm test
npm run build
~~~

Keep wake-word parsing deterministic and separate from browser permissions, speech output, and desktop bridges. Add tests for parser transitions and recovery paths when changing recognition behavior.

Do not commit microphone recordings, credentials, or private location data.
