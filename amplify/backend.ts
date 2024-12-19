import { defineBackend } from '@aws-amplify/backend';
import * as iam from "aws-cdk-lib/aws-iam"
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { auth } from './auth/resource';
import { data } from './data/resource';
import { submitQueryFunction } from './functions/submitqueryfunction/resources';
import { claimPatreonBenefitsFunction } from './functions/claimPatreonBenefitsFunction/resources';
import { patreonOauthRequestHandlerFunction } from './functions/handlePatreonOauthRequest/resources';

const backend = defineBackend({
  auth,
  data,
  submitQueryFunction,
  claimPatreonBenefitsFunction,
  patreonOauthRequestHandlerFunction,
});

const submitQueryLambda = backend.submitQueryFunction.resources.lambda;

const statement = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    "lambda:InvokeFunction",
    "sqs:SendMessage",
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
    ],
  resources: ['*'],
});

submitQueryLambda.addToRolePolicy(statement);

const patreonOauthLambda = backend.patreonOauthRequestHandlerFunction.resources.lambda;
const customResourceStack = backend.createStack('LambdaCustomResourceStack');

const endpoint = new apigw.LambdaRestApi(customResourceStack, `ApiGwEndpoint`, {
  handler: patreonOauthLambda,
  restApiName: `PatreonOauthAPI`,
});
