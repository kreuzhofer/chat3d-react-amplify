import type { PreSignUpTriggerHandler } from 'aws-lambda';
//import { env } from '$amplify/env/pre-sign-up';

const listOfPreviewEmails = [
    "dkreuzh@gmail.com",
    "daniel.kreuzhofer@gmail.com",
    "amanksingh7777@gmail.com"
];

export const handler: PreSignUpTriggerHandler = async (event) => {
//   const email = event.request.userAttributes['email'];

//   if (!email.endsWith(env.ALLOW_DOMAIN)) {
//     throw new Error('Invalid email domain');
//   }
    console.log(JSON.stringify(event));
    if(event.triggerSource ==="PreSignUp_ExternalProvider")
    {
        if(listOfPreviewEmails.indexOf(event.request.userAttributes.email) === -1)
        {
            throw new Error("You cannot sign up at this time.");
        }    

    }
    return event;
    //throw new Error("You cannot sign up at this time.");
};