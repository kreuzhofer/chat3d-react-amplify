import type { PostAuthenticationTriggerHandler } from 'aws-lambda';
import { env } from '$amplify/env/pre-sign-up';

export const handler: PostAuthenticationTriggerHandler = async (event) => {
//   const email = event.request.userAttributes['email'];

//   if (!email.endsWith(env.ALLOW_DOMAIN)) {
//     throw new Error('Invalid email domain');
//   }
    console.log(JSON.stringify(event));
    return event;
    //throw new Error("You cannot sign up at this time.");
};