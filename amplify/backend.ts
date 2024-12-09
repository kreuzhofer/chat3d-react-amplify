import { defineBackend } from '@aws-amplify/backend';
import * as iam from "aws-cdk-lib/aws-iam"
import { auth } from './auth/resource';
import { data } from './data/resource';
import { submitQueryFunction } from './functions/submitqueryfunction/resources';

const backend = defineBackend({
  auth,
  data,
  submitQueryFunction
});

const submitQueryLambda = backend.submitQueryFunction.resources.lambda;

const statement = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    "lambda:InvokeFunction",
    ],
  resources: ['*'],
});

submitQueryLambda.addToRolePolicy(statement);
