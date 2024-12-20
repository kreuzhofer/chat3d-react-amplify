import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "./Pages/Layout";
import Home from "./Pages/Home";
import Chat from "./Pages/Chat";
import Profile from "./Pages/Profile";
import ClaimPatreon from "./Pages/ClaimPatreon";

function App() {
  //const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  // const [query, setQuery] = useState<string>("");
  // const [resultsList, setResultsList] = useState<string>("");
  // const [resultImage] = useState<string>("");

  // const { signOut } = useAuthenticator();

  // useEffect(() => {
  //   client.models.Todo.observeQuery().subscribe({
  //     next: (data) => setTodos([...data.items]),
  //   });
  // }, []);

  // function createTodo() {
  //   client.models.Todo.create({ content: window.prompt("Todo content") });
  // }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/chat/:chatId?" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/claim-patreon" element={<ClaimPatreon />} />
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
}

export default App;
