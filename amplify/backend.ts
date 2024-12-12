import { defineBackend } from '@aws-amplify/backend';
import * as iam from "aws-cdk-lib/aws-iam"
import { auth } from './auth/resource';
import { data } from './data/resource';
import { submitQueryFunction } from './functions/submitqueryfunction/resources';
import { claimPatreonBenefitsFunction } from './functions/claimPatreonBenefitsFunction/resources';

const backend = defineBackend({
  auth,
  data,
  submitQueryFunction,
  claimPatreonBenefitsFunction,
});

const submitQueryLambda = backend.submitQueryFunction.resources.lambda;

const statement = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    "lambda:InvokeFunction",
    "sqs:SendMessage",
    ],
  resources: ['*'],
});

submitQueryLambda.addToRolePolicy(statement);
