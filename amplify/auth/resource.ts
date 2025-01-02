import { defineAuth, secret } from '@aws-amplify/backend';
import { ProviderAttribute } from 'aws-cdk-lib/aws-cognito';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,

    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'openid', 'profile', 'phone'],
        attributeMapping: {
          email: 'email',
          givenName: 'given_name',
          familyName: 'family_name',
          phoneNumber: 'phone_number',
          profilePicture: 'picture',
        }
      },
      callbackUrls: [
        process.env.GOOGLE_CALLBACK_URL || '',
      ],
      logoutUrls: [process.env.GOOGLE_LOGOUT_URL || ''],
    }
  },
  
});
