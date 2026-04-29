import { Stack } from "expo-router";
import React, { useEffect } from "react";

import {
  configurarNotificacoes,
  pedirPermissaoNotificacao,
} from "../services/notificacoes";

export default function RootLayout() {
  useEffect(() => {
    async function iniciarNotificacoes() {
      await configurarNotificacoes();
      await pedirPermissaoNotificacao();
    }

    iniciarNotificacoes();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="HomeScreen" />
      <Stack.Screen name="AlimentosScreen" />
      <Stack.Screen name="DesperdicioScreen" />
    </Stack>
  );
}
