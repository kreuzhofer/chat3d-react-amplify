import { defineFunction } from '@aws-amplify/backend';

export const submitQueryFunction = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'submitQueryFunction',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  timeoutSeconds: 60,  
});