import React from "react";
import ReactDOM from "react-dom/client";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import "./app/styles/index.css";
import NiiVue from "./app/niivue";
import AppContextProvider from "./app/hooks/context";

const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);
root.render(
  <AppContextProvider>
    <NiiVue />
  </AppContextProvider>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
