import React from "react";
import ReactDOM from "react-dom/client";
import WithResponsiveness from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import 'semantic-ui-css/semantic.min.css'

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator>
      <WithResponsiveness />
    </Authenticator>
  </React.StrictMode>
);
