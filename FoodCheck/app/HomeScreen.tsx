import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Animated } from "react-native";


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
  const [quantidadeDentroValidade, setQuantidadeDentroValidade] = useState(0);
  const [quantidadeAcompanhar, setQuantidadeAcompanhar] = useState(0);

  useEffect(() => {
    carregarQuantidadeVencendo();
  }, []);

  async function carregarQuantidadeVencendo() {
    try {
      const dadosSalvos = await AsyncStorage.getItem(CHAVE_ALIMENTOS);

      if (!dadosSalvos) {
        setQuantidadeDentroValidade(0);
        setQuantidadeAcompanhar(0);
        setQuantidadeVencendo(0);
        return;
      }

      const alimentos: Alimento[] = JSON.parse(dadosSalvos);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      let dentroValidade = 0;
      let acompanhar = 0;
      let proximosDoVencimento = 0;

      alimentos.forEach((item) => {
        if (!item.dataValidade) {
          return;
        }

        const vencimento = converterTextoParaData(item.dataValidade);

        if (!vencimento) {
          return;
        }

        const diferencaEmMilissegundos = vencimento.getTime() - hoje.getTime();
        const diferencaEmDias = Math.ceil(
          diferencaEmMilissegundos / (1000 * 60 * 60 * 24),
        );

        if (diferencaEmDias >= 0 && diferencaEmDias <= 5) {
          proximosDoVencimento += 1;
          return;
        }

        if (diferencaEmDias >= 6 && diferencaEmDias <= 30) {
          acompanhar += 1;
          return;
        }

        if (diferencaEmDias > 30) {
          dentroValidade += 1;
        }
      });

      setQuantidadeDentroValidade(dentroValidade);
      setQuantidadeAcompanhar(acompanhar);
      setQuantidadeVencendo(proximosDoVencimento);
    } catch (error) {
      console.log("Erro ao carregar alimentos:", error);
      setQuantidadeDentroValidade(0);
      setQuantidadeAcompanhar(0);
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

        <Card
          label="Itens Dentro Da Validade"
          color="#166534"
          cardColor="#DCFCE7"
          circuloColor="#22C55E"
          quantidade = {quantidadeDentroValidade}
        />
        <Card
          label="Itens Para Acompanhar"
          color="#92400E"
          cardColor="#FEF3C7"
          circuloColor="#F59E0B"
          quantidade = {quantidadeAcompanhar}
        />

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

function StatusDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.circulo,
        {
          backgroundColor: color,
          opacity,
        },
      ]}
    />
  );
}

function Card({
  label,
  cardColor,
  circuloColor,
  color,
  quantidade,
}: {
  label: string;
  cardColor: string;
  circuloColor: string;
  color: string;
  quantidade: number
}) {
  return (
    <View style={[styles.menuItem, { backgroundColor: cardColor }]}>
      <View style={styles.menuLeft}>
        <StatusDot color={circuloColor}/>
        <Text style={[styles.menuText, { color }]}>{label}</Text>
      </View>
       <Text style={[styles.status, { color }]}>{quantidade}</Text>
    </View>
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
  circulo: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#000",
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#c50101",
  },
  status:  {
    fontSize: 24,
    fontWeight: "bold"
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
