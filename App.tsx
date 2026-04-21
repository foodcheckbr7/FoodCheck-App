import React, { useState } from "react";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import AlimentosScreen from "./screens/AlimentosScreen";
import DesperdicioScreen from "./screens/DesperdicioScreen";

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