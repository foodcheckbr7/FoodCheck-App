import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Alimento = {
  id: string;
  nome: string;
  dataCompra: string;
  dataValidade: string;
};

const CHAVE_ALIMENTOS = "@foodcheck_alimentos";

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

export default function HomeScreen({
  irParaAlimentos,
  irParaDesperdicio,
}: any) {
  const [quantidadeVencendo, setQuantidadeVencendo] = useState(0);

  useEffect(() => {
    carregarQuantidadeVencendo();
  }, []);

  async function carregarQuantidadeVencendo() {
    try {
      const dadosSalvos = await AsyncStorage.getItem(CHAVE_ALIMENTOS);

      if (!dadosSalvos) {
        setQuantidadeVencendo(0);
        return;
      }

      const alimentos: Alimento[] = JSON.parse(dadosSalvos);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const proximosDoVencimento = alimentos.filter((item) => {
        if (!item.dataValidade) {
          return false;
        }

        const vencimento = converterTextoParaData(item.dataValidade);

        if (!vencimento) {
          return false;
        }

        const diferencaEmMilissegundos = vencimento.getTime() - hoje.getTime();
        const diferencaEmDias = Math.ceil(
          diferencaEmMilissegundos / (1000 * 60 * 60 * 24)
        );

        return diferencaEmDias >= 0 && diferencaEmDias <= 5;
      });

      setQuantidadeVencendo(proximosDoVencimento.length);
    } catch (error) {
      console.log("Erro ao carregar alimentos:", error);
      setQuantidadeVencendo(0);
    }
  }

  function handleVerItens() {
    irParaAlimentos("proximos");
  }

  function handleMeusAlimentos() {
    irParaAlimentos("todos");
  }

  function handleDesperdicio() {
    irParaDesperdicio();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2f9e44" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, Thiago Torres!</Text>

          <View style={styles.bellContainer}>
            <Text style={styles.bell}>🔔</Text>

            {quantidadeVencendo > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{quantidadeVencendo}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Alerta de Vencimento</Text>
            <Text style={styles.infoIcon}>ⓘ</Text>
          </View>

          <View style={styles.alertBox}>
            <Text style={styles.alertNumber}>{quantidadeVencendo}</Text>
            <Text style={styles.alertText}>Itens próximos de vencer</Text>
          </View>

          <Pressable style={styles.orangeButton} onPress={handleVerItens}>
            <Text style={styles.orangeButtonText}>Ver Itens</Text>
          </Pressable>
        </View>

        <Pressable style={styles.menuItem} onPress={handleMeusAlimentos}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🥬</Text>
            <Text style={styles.menuText}>Meus Alimentos</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <View style={styles.bottomNav}>
          <View style={styles.navItemActive}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navTextActive}>Início</Text>
          </View>

          <Pressable style={styles.navItem} onPress={handleDesperdicio}>
            <Text style={styles.navIcon}>🗑️</Text>
            <Text style={styles.navText}>Desperdício</Text>
          </Pressable>

          <View style={styles.navItem}>
            <Text style={styles.navIcon}>🍽️</Text>
            <Text style={styles.navText}>Receitas</Text>
          </View>

          <View style={styles.navItem}>
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navText}>Perfil</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#2f9e44",
  },
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  header: {
    backgroundColor: "#2f9e44",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  bellContainer: {
    position: "relative",
  },
  bell: {
    fontSize: 24,
    color: "#fff",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -10,
    backgroundColor: "red",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2f9e44",
  },
  infoIcon: {
    fontSize: 18,
    color: "#888",
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  alertNumber: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#f76707",
    marginRight: 10,
  },
  alertText: {
    fontSize: 18,
    color: "#444",
    flex: 1,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  orangeButton: {
    backgroundColor: "#f76707",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  orangeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  menuItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  menuText: {
    fontSize: 20,
    color: "#333",
    fontWeight: "600",
  },
  arrow: {
    fontSize: 28,
    color: "#666",
  },
  bottomNav: {
    marginTop: "auto",
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  navItem: {
    alignItems: "center",
  },
  navItemActive: {
    alignItems: "center",
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 13,
    color: "#666",
  },
  navTextActive: {
    fontSize: 13,
    color: "#2f9e44",
    fontWeight: "bold",
  },
});