import { defineFunction } from '@aws-amplify/backend';

export const claimPatreonBenefitsFunction = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'claimPatreonBenefitsFunction',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  timeoutSeconds: 60,
});