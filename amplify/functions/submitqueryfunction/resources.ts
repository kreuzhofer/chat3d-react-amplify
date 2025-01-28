import { defineFunction } from '@aws-amplify/backend';

export const submitQueryFunction = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'submitQueryFunction',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  timeoutSeconds: 420,  // 5 minutes timeout for content creation
  environment: {
    // optionally specify environment variables
    MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_PROJECT_ID: process.env.OPENAI_PROJECT_ID || '',
    OPENAI_ORGANIZATION_ID: process.env.OPENAI_ORGANIZATION_ID || '',
  },
});