import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { submitQueryFunction } from "../functions/submitqueryfunction/resources";
import { claimPatreonBenefitsFunction } from "../functions/claimPatreonBenefitsFunction/resources";

export interface IChatMessage {
  id: string;
  text: string;
  state: string;
  stateMessage: string;
  itemType: string;
  attachment: string;
  intputTokens: number;
  outputTokens: number;
  inputTokenCost: number;
  outputTokenCost: number;
  tokenCost: number;
}

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
      role: a.string(),
      messages: a.json(),
      rating: a.integer(), // -1 = thumbs down, 0 = no rating, 1 = thumbs up
    }).authorization((allow) => [allow.owner()]),
  
  submitQuery: a
    .query()
    .arguments({
      chatContextId: a.id(),
      newUserChatItemId: a.id(),
      newAssistantChatItemId: a.id(),
      query: a.string(),
      executorFunctionName: a.string(),
      bucket: a.string(),
      llmconfiguration: a.string(),
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

  chatNamer: a
  .generation({
    aiModel: a.ai.model("Claude 3 Haiku"),
    systemPrompt: `You are a helpful assistant that writes descriptive names for conversations. Names should be 2-10 words long`,
  })
  .arguments({
    content: a.string(),
  })
  .returns(
    a.customType({
      name: a.string(),
    })
  )
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
