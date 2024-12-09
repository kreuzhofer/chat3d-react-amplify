import { useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';

const client = generateClient<Schema>();

function App() {
  //const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [query, setQuery] = useState<string>("");
  const [resultsList, setResultsList] = useState<string>("");
  const [resultImage, setResultImage] = useState<string>("");

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
    chat_simple()
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
      <div>{resultsList}</div>
      <img src={resultImage}></img>
    </main>
  }
}

export default App;
