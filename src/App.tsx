import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "./Pages/Layout";
//import Home from "./Pages/Home";
import Chat from "./Pages/Chat";
import Profile from "./Pages/Profile";
import ClaimPatreon from "./Pages/ClaimPatreon";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Chat />} />
          <Route path="/chat/:chatId?" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/claim-patreon" element={<ClaimPatreon />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
