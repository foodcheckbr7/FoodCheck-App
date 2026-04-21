import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";

export default function LoginScreen({ onLoginSuccess }: any) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleLogin() {
    if (email === "teste@teste.com" && senha === "123456") {
      onLoginSuccess();
    } else {
      alert("Email ou senha incorretos");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            
            {/* LOGO */}
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
            />

            <Text style={styles.titulo}>FoodCheck</Text>
            <Text style={styles.subtitulo}>Bem-vindo!</Text>

            <TextInput
              style={styles.input}
              placeholder="Seu e-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />

            <TouchableOpacity style={styles.botao} onPress={handleLogin}>
              <Text style={styles.botaoTexto}>Entrar</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2f9e44",
    justifyContent: "center",
    padding: 20,
  },

  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  titulo: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },

  botao: {
    backgroundColor: "#f76707",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  botaoTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});