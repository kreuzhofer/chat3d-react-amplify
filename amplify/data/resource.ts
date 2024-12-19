import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { submitQueryFunction } from "../functions/submitqueryfunction/resources";
import { claimPatreonBenefitsFunction } from "../functions/claimPatreonBenefitsFunction/resources";

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  ChatItem: a
    .model({
      context: a.string(),
      itemType: a.string(),
      role: a.string(),
      message: a.string(),
      attachment: a.string(),
    }).authorization((allow) => [allow.owner()]),
  
  submitQuery: a
    .query()
    .arguments({
      query: a.string(),
    })
    .returns(a.string())
    .handler(a.handler.function(submitQueryFunction))
    .authorization((allow) => [allow.authenticated()]),

  claimPatreonBenefits: a
    .query().arguments({
      code: a.string(),
    })
    .returns(a.string())
    .handler(a.handler.function(claimPatreonBenefitsFunction))
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
