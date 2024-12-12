import type { Schema } from "../../data/resource"

export const handler: Schema["submitQuery"]["functionHandler"] = async (event) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'MvmE1rACZyeWKOpBhynZjK0m4MWkJOKw_SXfo2CZfBFm7N2q9x7_ROzg8ZpAblZ0',
    redirect_uri: 'http://localhost:5173/patreon-connection'
  });

  await fetch(`https://www.patreon.com/oauth2/authorize?${params.toString()}`, {
    method: 'GET',
    headers: {
    'Content-Type': 'application/json',
    },
    mode: 'cors'
  })
  .then(response => { 
    console.log(response);
    return response.json() 
  })
  .then(data => {
    console.log('Success:', data);
    return 'success';
  })
  .catch((error) => {
    console.error('Error:', error);
    return 'error';
  });

  return "error";
}