import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { submitQueryFunction } from "../functions/submitqueryfunction/resources";
import { claimPatreonBenefitsFunction } from "../functions/claimPatreonBenefitsFunction/resources";

const schema = a.schema({
  // ChatContext and Chat store any chat conversations and their current state even if incomplete
  ChatContext: a
    .model({
      name: a.string(),
      chatItems: a.hasMany("ChatItem", "chatContextId"),
  }).authorization(allow => [allow.owner()]),
  ChatItem: a
    .model({
      chatContextId: a.id(),
      chatContext: a.belongsTo("ChatContext", "chatContextId"),
      itemType: a.string(),
      role: a.string(),
      message: a.string(),
      attachment: a.string(),
      state: a.string(),
    }).authorization((allow) => [allow.owner()]),
  
  submitQuery: a
    .query()
    .arguments({
      chatContextId: a.id(),
      newUserChatItemId: a.id(),
      newAssistantChatItemId: a.id(),
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
}).authorization((allow) => [allow.resource(submitQueryFunction)]);

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
