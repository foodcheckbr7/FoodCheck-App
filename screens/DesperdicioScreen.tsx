import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Desperdicio = {
  id: string;
  nome: string;
  dataCompra: string;
  dataValidade: string;
  dataDescarte: string;
  motivo: string;
};

const CHAVE_DESPERDICIO = "@foodcheck_desperdicio";

function converterTextoParaData(dataTexto: string) {
  const partes = dataTexto.split("/");

  if (partes.length !== 3) {
    return null;
  }

  const dia = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const ano = Number(partes[2]);

  const data = new Date(ano, mes, dia);
  data.setHours(0, 0, 0, 0);

  if (
    data.getDate() !== dia ||
    data.getMonth() !== mes ||
    data.getFullYear() !== ano
  ) {
    return null;
  }

  return data;
}

export default function DesperdicioScreen({ voltar }: any) {
  const [itens, setItens] = useState<Desperdicio[]>([]);

  useEffect(() => {
    carregarDesperdicio();
  }, []);

  async function carregarDesperdicio() {
    try {
      const dadosSalvos = await AsyncStorage.getItem(CHAVE_DESPERDICIO);

      if (!dadosSalvos) {
        setItens([]);
        return;
      }

      const lista: Desperdicio[] = JSON.parse(dadosSalvos);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const itensValidos = lista.filter((item) => {
        const dataDescarte = converterTextoParaData(item.dataDescarte);

        if (!dataDescarte) {
          return false;
        }

        const diferencaEmMilissegundos =
          hoje.getTime() - dataDescarte.getTime();

        const diferencaEmDias = Math.floor(
          diferencaEmMilissegundos / (1000 * 60 * 60 * 24)
        );

        return diferencaEmDias <= 30;
      });

      await AsyncStorage.setItem(
        CHAVE_DESPERDICIO,
        JSON.stringify(itensValidos)
      );

      setItens(itensValidos);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os itens de desperdício.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topo}>
        <Text style={styles.titulo}>Desperdício</Text>

        <TouchableOpacity style={styles.botaoVoltar} onPress={voltar}>
          <Text style={styles.textoBotaoVoltar}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={itens}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.texto}>Compra: {item.dataCompra}</Text>
            <Text style={styles.texto}>Validade: {item.dataValidade}</Text>
            <Text style={styles.texto}>Descarte: {item.dataDescarte}</Text>
            <Text style={styles.motivo}>Motivo: {item.motivo}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Nenhum item descartado nos últimos 30 dias.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  topo: {
    backgroundColor: "#2f9e44",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  botaoVoltar: {
    backgroundColor: "#ffffff",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  textoBotaoVoltar: {
    color: "#2f9e44",
    fontWeight: "bold",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  nome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  texto: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  motivo: {
    fontSize: 14,
    color: "#d62828",
    fontWeight: "bold",
    marginTop: 6,
  },
  vazio: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
  },
});