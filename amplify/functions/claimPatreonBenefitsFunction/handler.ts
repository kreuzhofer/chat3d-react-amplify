import type { Schema } from "../../data/resource"
import { env } from "$amplify/env/claimPatreonBenefitsFunction";

var patreon = require('patreon');
var patreonAPI = patreon.patreon;
var patreonOAuth = patreon.oauth;

class PatreonApiClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async get(resource: string): Promise<any> {
    const response = await fetch(`https://www.patreon.com/api/oauth2/v2/${resource}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching data from Patreon API: ${response.statusText}`);
    }

    return response.json();
  }
}

async function handleOAuthRedirectRequest(oauthGrantCode: String): Promise<any> {

  const CLIENT_ID = env.PATREON_CLIENT_ID;
  console.log("CLIENT_ID: "+CLIENT_ID);
  const CLIENT_SECRET = env.PATREON_CLIENT_SECRET;
  console.log("CLIENT_SECRET: "+CLIENT_SECRET);
  const patreonOAuthClient = patreonOAuth(CLIENT_ID, CLIENT_SECRET);
  const redirectURL = env.PATREON_REDIRECT_URI;

  var result = await patreonOAuthClient
    .getTokens(oauthGrantCode, redirectURL)
    .then(async function(tokensResponse: { access_token: any }) {
        console.log('tokensResponse', tokensResponse);
        var patreonAPIClient = new PatreonApiClient(tokensResponse.access_token)
        var requestParameters = "include=memberships.currently_entitled_tiers,memberships.campaign&fields[user]=email,first_name,full_name,image_url,last_name,thumb_url,url,vanity,is_email_verified&fields[member]=currently_entitled_amount_cents,lifetime_support_cents,campaign_lifetime_support_cents,last_charge_status,patron_status,last_charge_date,pledge_relationship_start,pledge_cadence";
        requestParameters = requestParameters.replaceAll("[", "%5B").replaceAll("]", "%5D");
        //requestParameters = encodeURIComponent(requestParameters);
        var apiResult = await patreonAPIClient.get('identity?' + requestParameters);
        console.log(apiResult);
        return apiResult;
    })
    .then(function(apiResult: any) {
        return apiResult;
    })
    .catch(function(err: any) {
        console.error('error!', err)
        return err;
    })
  return result;
}

export const handler: Schema["claimPatreonBenefits"]["functionHandler"] = async (event) => {
  const { code } = event.arguments;
  if (!code) {
      throw new Error("Code is required");
  }
  console.log("code: "+code);

  const oauthResult = await handleOAuthRedirectRequest(code);
  console.log("oauthResult: "+oauthResult);

  return oauthResult
}