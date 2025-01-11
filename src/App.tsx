import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "./Pages/Layout";
import Chat from "./Pages/Chat";
import Profile from "./Pages/Profile";
import ClaimPatreon from "./Pages/ClaimPatreon";
import { ResponsivenessProvider } from "react-responsiveness";
import mixpanel from 'mixpanel-browser'
mixpanel.init(import.meta.env.MIXPANEL_TOKEN, {track_pageview: "full-url"});

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

const WithResponsiveness = () => (
  <ResponsivenessProvider>
    <App />
  </ResponsivenessProvider>
);
export default WithResponsiveness;