import { useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "./Pages/Layout";
import Home from "./Pages/Home";

const client = generateClient<Schema>();

function App() {
  //const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [query, setQuery] = useState<string>("");
  const [resultsList, setResultsList] = useState<string>("");
  const [resultImage] = useState<string>("");

  const { signOut } = useAuthenticator();

  // useEffect(() => {
  //   client.models.Todo.observeQuery().subscribe({
  //     next: (data) => setTodos([...data.items]),
  //   });
  // }, []);

  // function createTodo() {
  //   client.models.Todo.create({ content: window.prompt("Todo content") });
  // }

  async function createModel()
  {
    var result = await client.queries.submitQuery({ query: query });
    alert("query submitted to backend: "+JSON.stringify(result));
    setResultsList(JSON.stringify(result));
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );

  // function main() {
  //   return <main>
  //     <h1>My todos</h1>
  //     <button onClick={createTodo}>+ new</button>
  //     <ul>
  //       {todos.map((todo) => (
  //         <li key={todo.id}>{todo.content}</li>
  //       ))}
  //     </ul>
  //     <div>
  //       🥳 App successfully hosted. Try creating a new todo.
  //       <br />
  //       <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
  //         Review next step of this tutorial.
  //       </a>
  //     </div>
  //   </main>;
  // }

  async function claimPatreonBenefits() {
    // send get request to patreon api, example: GET www.patreon.com/oauth2/authorize
    // ?response_type=code
    // &client_id=<your client id>
    // &redirect_uri=<one of your redirect_uris that you provided in step 1>
    // &scope=<optional list of requested scopes>
    // &state=<optional string></optional>
    // implement this web request in typescript
    //var result = await client.queries.claimPatreonBenefits();
    //alert("query submitted to backend: "+JSON.stringify(result));
  
    window.location.href="https://www.patreon.com/oauth2/authorize?response_type=code&client_id=MvmE1rACZyeWKOpBhynZjK0m4MWkJOKw_SXfo2CZfBFm7N2q9x7_ROzg8ZpAblZ0&redirect_uri=http://localhost:5173/patreon-connection";
  }

  function chat_simple() {
    return <main>
      <h1>What are you looking for?</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            createModel();
          }
        }}
      />
      <button onClick={createModel}>Create</button>
      <button onClick={signOut}>Sign out</button>
      <button onClick={claimPatreonBenefits}>Claim Your Patreon Benefits</button>

      <div>{resultsList}</div>
      <img src={resultImage}></img>
    </main>
  }
}

export default App;
