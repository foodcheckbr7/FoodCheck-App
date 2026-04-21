import React, { useState } from "react";
import LoginScreen from "./app/LoginScreen";
import HomeScreen from "./app/HomeScreen";
import AlimentosScreen from "./app/AlimentosScreen";
import DesperdicioScreen from "./app/DesperdicioScreen";

export default function App() {
  const [logado, setLogado] = useState(false);
  const [tela, setTela] = useState("home");
  const [filtroAlimentos, setFiltroAlimentos] = useState("todos");

  if (!logado) {
    return <LoginScreen onLoginSuccess={() => setLogado(true)} />;
  }

  if (tela === "home") {
    return (
      <HomeScreen
        irParaAlimentos={(filtro: string) => {
          setFiltroAlimentos(filtro);
          setTela("alimentos");
        }}
        irParaDesperdicio={() => setTela("desperdicio")}
      />
    );
  }

  if (tela === "alimentos") {
    return (
      <AlimentosScreen
        voltar={() => setTela("home")}
        filtroInicial={filtroAlimentos}
      />
    );
  }

  if (tela === "desperdicio") {
    return <DesperdicioScreen voltar={() => setTela("home")} />;
  }

  return null;
}