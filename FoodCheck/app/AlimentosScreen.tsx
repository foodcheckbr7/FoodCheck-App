import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Linking,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  agendarNotificacaoValidade,
  cancelarNotificacao,
} from "../services/notificacoes";

type Alimento = {
  id: string;
  nome: string;
  dataCompra: string;
  dataValidade: string;
  notificacaoId?: string | null;
};

type Desperdicio = {
  id: string;
  nome: string;
  dataCompra: string;
  dataValidade: string;
  dataDescarte: string;
  motivo: string;
};

const CHAVE_ALIMENTOS = "@foodcheck_alimentos";
const CHAVE_DESPERDICIO = "@foodcheck_desperdicio";

function formatarDataHoje() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

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

export default function AlimentosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filtro?: string }>();
  const filtroInicial = params.filtro === "proximos" ? "proximos" : "todos";
  const [nome, setNome] = useState("");
  const [dataCompra, setDataCompra] = useState(formatarDataHoje());
  const [dataValidade, setDataValidade] = useState("");
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState(filtroInicial);

  const listaRef = useRef<FlatList<Alimento>>(null);

  useFocusEffect(
    useCallback(() => {
      carregarAlimentos();
    }, []),
  );

  useEffect(() => {
    setFiltro(filtroInicial);
  }, [filtroInicial]);

  async function carregarAlimentos() {
    try {
      const dadosSalvos = await AsyncStorage.getItem(CHAVE_ALIMENTOS);

      if (dadosSalvos) {
        setAlimentos(JSON.parse(dadosSalvos));
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os alimentos.");
    }
  }

  async function salvarListaNoCelular(lista: Alimento[]) {
    try {
      await AsyncStorage.setItem(CHAVE_ALIMENTOS, JSON.stringify(lista));
      setAlimentos(lista);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar os alimentos.");
    }
  }

  async function adicionarAoDesperdicio(item: Alimento) {
    try {
      const dadosSalvos = await AsyncStorage.getItem(CHAVE_DESPERDICIO);
      const listaAtual: Desperdicio[] = dadosSalvos
        ? JSON.parse(dadosSalvos)
        : [];

      const novoItem: Desperdicio = {
        id: Date.now().toString(),
        nome: item.nome,
        dataCompra: item.dataCompra,
        dataValidade: item.dataValidade,
        dataDescarte: formatarDataHoje(),
        motivo: "vencido",
      };

      const novaLista = [novoItem, ...listaAtual];
      await AsyncStorage.setItem(CHAVE_DESPERDICIO, JSON.stringify(novaLista));
    } catch {
      Alert.alert("Erro", "Não foi possível enviar o item para desperdício.");
    }
  }

  function limparCampos() {
    setNome("");
    setDataCompra(formatarDataHoje());
    setDataValidade("");
    setIdEditando(null);
  }

  function calcularDiasParaValidade(dataValidadeTexto: string) {
    if (!dataValidadeTexto) {
      return null;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = converterTextoParaData(dataValidadeTexto);

    if (!vencimento) {
      return null;
    }

    const diferencaEmMilissegundos = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));
  }

  function estaDentroDaValidade(dataValidadeTexto: string) {
    const dias = calcularDiasParaValidade(dataValidadeTexto);
    return dias !== null && dias > 30;
  }

  function estaParaAcompanhar(dataValidadeTexto: string) {
    const dias = calcularDiasParaValidade(dataValidadeTexto);
    return dias !== null && dias >= 6 && dias <= 30;
  }

  function estaProximoDoVencimento(dataValidadeTexto: string) {
    const dias = calcularDiasParaValidade(dataValidadeTexto);
    return dias !== null && dias >= 0 && dias <= 5;
  }

  function estaVencido(dataValidadeTexto: string) {
    const dias = calcularDiasParaValidade(dataValidadeTexto);
    return dias !== null && dias < 0;
  }

  function obterCorStatusValidade(dataValidadeTexto: string) {
    if (
      estaVencido(dataValidadeTexto) ||
      estaProximoDoVencimento(dataValidadeTexto)
    ) {
      return styles.dataVermelha;
    }

    if (estaParaAcompanhar(dataValidadeTexto)) {
      return styles.dataAmarela;
    }

    if (estaDentroDaValidade(dataValidadeTexto)) {
      return styles.dataVerde;
    }

    return null;
  }

  function renderStatusValidade(dataValidadeTexto: string) {
    if (!dataValidadeTexto) {
      return "Validade: não informada";
    }

    const dias = calcularDiasParaValidade(dataValidadeTexto);

    if (dias === null) {
      return `Validade: ${dataValidadeTexto}`;
    }

    if (dias < 0) {
      return `Validade: ${dataValidadeTexto} (vencido)`;
    }

    if (dias === 0) {
      return `Validade: ${dataValidadeTexto} (vence hoje)`;
    }

    if (dias >= 1 && dias <= 5) {
      return `Validade: ${dataValidadeTexto} (${dias} dia(s) restante(s))`;
    }

    if (dias >= 6 && dias <= 30) {
      return `Validade: ${dataValidadeTexto} (${dias} dia(s) restantes)`;
    }

    return `Validade: ${dataValidadeTexto}`;
  }

  function abrirReceitas(nomeAlimento: string) {
    const alimentoFormatado = encodeURIComponent(nomeAlimento);
    const url = `https://www.tudogostoso.com.br/busca?q=${alimentoFormatado}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir as receitas.");
    });
  }

  async function handleSalvarAlimento() {
    if (nome.trim() === "") {
      Alert.alert("Atenção", "Digite o nome do alimento.");
      return;
    }

    if (dataCompra.trim() === "") {
      Alert.alert("Atenção", "Digite a data da compra.");
      return;
    }

    const dataCompraConvertida = converterTextoParaData(dataCompra);

    if (!dataCompraConvertida) {
      Alert.alert("Erro", "A data da compra deve estar no formato DD/MM/AAAA.");
      return;
    }

    if (dataValidade.trim() !== "") {
      const dataValidadeConvertida = converterTextoParaData(dataValidade);

      if (!dataValidadeConvertida) {
        Alert.alert(
          "Erro",
          "A data de validade deve estar no formato DD/MM/AAAA.",
        );
        return;
      }

      if (dataValidadeConvertida.getTime() < dataCompraConvertida.getTime()) {
        Alert.alert(
          "Erro",
          "A data de validade não pode ser menor que a data da compra.",
        );
        return;
      }
    }

    if (idEditando) {
      const alimentoAntigo = alimentos.find((item) => item.id === idEditando);

      await cancelarNotificacao(alimentoAntigo?.notificacaoId);

      let novoNotificacaoId: string | null = null;

      if (dataValidade.trim() !== "") {
        novoNotificacaoId = await agendarNotificacaoValidade(
          nome,
          dataValidade,
        );
      }

      const listaAtualizada = alimentos.map((item) =>
        item.id === idEditando
          ? {
              ...item,
              nome,
              dataCompra,
              dataValidade,
              notificacaoId: novoNotificacaoId,
            }
          : item,
      );

      await salvarListaNoCelular(listaAtualizada);
      Alert.alert("Sucesso", "Alimento editado com sucesso.");
      limparCampos();

      listaRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      });

      return;
    }

    let notificacaoId: string | null = null;

    if (dataValidade.trim() !== "") {
      notificacaoId = await agendarNotificacaoValidade(nome, dataValidade);
    }

    const novoAlimento: Alimento = {
      id: Date.now().toString(),
      nome,
      dataCompra,
      dataValidade,
      notificacaoId,
    };

    const novaLista = [novoAlimento, ...alimentos];
    await salvarListaNoCelular(novaLista);
    Alert.alert("Sucesso", "Alimento cadastrado com sucesso.");
    limparCampos();

    listaRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  }

  function handleEditar(item: Alimento) {
    setNome(item.nome);
    setDataCompra(item.dataCompra);
    setDataValidade(item.dataValidade);
    setIdEditando(item.id);
    setFiltro("todos");

    listaRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  }

  function handleConsumido(item: Alimento) {
    Alert.alert("Confirmar", `Deseja marcar "${item.nome}" como consumido?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sim",
        onPress: async () => {
          await cancelarNotificacao(item.notificacaoId);

          const novaLista = alimentos.filter(
            (alimento) => alimento.id !== item.id,
          );
          await salvarListaNoCelular(novaLista);

          if (idEditando === item.id) {
            limparCampos();
          }

          Alert.alert("Sucesso", "Alimento removido da lista.");
        },
      },
    ]);
  }

  function handleDescartar(item: Alimento) {
    Alert.alert(
      "Produto vencido",
      `Deseja descartar "${item.nome}" e enviar para Desperdício?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
            await cancelarNotificacao(item.notificacaoId);
            await adicionarAoDesperdicio(item);

            const novaLista = alimentos.filter(
              (alimento) => alimento.id !== item.id,
            );
            await salvarListaNoCelular(novaLista);

            if (idEditando === item.id) {
              limparCampos();
            }

            Alert.alert("Sucesso", "Produto enviado para Desperdício.");
          },
        },
      ],
    );
  }

  const alimentosFiltrados =
    filtro === "proximos"
      ? alimentos.filter((item) => estaProximoDoVencimento(item.dataValidade))
      : alimentos;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.areaRolavel}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={listaRef}
          data={alimentosFiltrados}
          keyExtractor={(item) => item.id}
          style={styles.lista}
          contentContainerStyle={styles.listaConteudo}
          ListHeaderComponent={
            <View>
              <View style={styles.topoMovel}>
                <Text style={styles.titulo}>Meus Alimentos</Text>

                <TouchableOpacity
                  style={styles.botaoVoltar}
                  onPress={() => router.back()}
                >
                  <Text style={styles.textoBotaoVoltar}>Voltar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.container}>
                <View style={styles.formulario}>
                  <Text style={styles.subtitulo}>
                    {idEditando ? "Editando alimento" : "Cadastrar alimento"}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Nome do alimento"
                    value={nome}
                    onChangeText={setNome}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Data da compra (DD/MM/AAAA)"
                    value={dataCompra}
                    onChangeText={setDataCompra}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Data da validade (opcional) - DD/MM/AAAA"
                    value={dataValidade}
                    onChangeText={setDataValidade}
                  />

                  <TouchableOpacity
                    style={styles.botaoSalvar}
                    onPress={handleSalvarAlimento}
                  >
                    <Text style={styles.textoBotaoSalvar}>
                      {idEditando ? "Salvar edição" : "Cadastrar alimento"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.areaFiltro}>
                  <Text style={styles.listaTitulo}>
                    {filtro === "proximos"
                      ? "Itens próximos de vencer"
                      : "Alimentos cadastrados"}
                  </Text>

                  {filtro === "proximos" && (
                    <TouchableOpacity
                      style={styles.botaoMostrarTodos}
                      onPress={() => setFiltro("todos")}
                    >
                      <Text style={styles.textoBotaoMostrarTodos}>
                        Mostrar todos
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <Text style={styles.nomeAlimento}>{item.nome}</Text>
              </View>

              <View style={styles.linhaDatas}>
                <Text style={styles.textoData}>Compra: {item.dataCompra}</Text>

                <Text
                  style={[
                    styles.textoData,
                    obterCorStatusValidade(item.dataValidade),
                  ]}
                >
                  {renderStatusValidade(item.dataValidade)}
                </Text>
              </View>

              <View style={styles.areaBotoes}>
                <TouchableOpacity
                  style={styles.botaoEditar}
                  onPress={() => handleEditar(item)}
                >
                  <Text style={styles.textoBotaoEditar}>Editar</Text>
                </TouchableOpacity>

                {estaVencido(item.dataValidade) ? (
                  <TouchableOpacity
                    style={styles.botaoDescartar}
                    onPress={() => handleDescartar(item)}
                  >
                    <Text style={styles.textoBotaoDescartar}>Descartar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.botaoConsumido}
                    onPress={() => handleConsumido(item)}
                  >
                    <Text style={styles.textoBotaoConsumido}>Consumido</Text>
                  </TouchableOpacity>
                )}

                {estaProximoDoVencimento(item.dataValidade) && (
                  <TouchableOpacity
                    style={styles.botaoReceita}
                    onPress={() => abrirReceitas(item.nome)}
                  >
                    <Text style={styles.textoBotaoReceita}>Receita</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.listaVazia}>
              {filtro === "proximos"
                ? "Nenhum item próximo de vencer."
                : "Nenhum alimento cadastrado ainda."}
            </Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  areaRolavel: {
    flex: 1,
  },

  topoMovel: {
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

  lista: {
    flex: 1,
  },

  listaConteudo: {
    paddingBottom: 40,
  },

  container: {
    padding: 16,
  },

  formulario: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  subtitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2f9e44",
    marginBottom: 14,
  },

  input: {
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },

  botaoSalvar: {
    backgroundColor: "#f76707",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },

  textoBotaoSalvar: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  areaFiltro: {
    marginBottom: 12,
  },

  listaTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2f9e44",
    marginBottom: 10,
  },

  botaoMostrarTodos: {
    backgroundColor: "#2f9e44",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  textoBotaoMostrarTodos: {
    color: "#fff",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
  },

  cardTopo: {
    marginBottom: 6,
  },

  nomeAlimento: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  linhaDatas: {
    marginTop: 6,
    gap: 4,
  },

  textoData: {
    fontSize: 14,
    color: "#555",
  },

  areaBotoes: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },

  botaoEditar: {
    backgroundColor: "#2f9e44",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  textoBotaoEditar: {
    color: "#fff",
    fontWeight: "bold",
  },

  botaoConsumido: {
    backgroundColor: "#f76707",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  textoBotaoConsumido: {
    color: "#fff",
    fontWeight: "bold",
  },

  botaoDescartar: {
    backgroundColor: "#d62828",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  botaoReceita: {
    backgroundColor: "#2f9e44",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  textoBotaoDescartar: {
    color: "#fff",
    fontWeight: "bold",
  },

  textoBotaoReceita: {
    color: "#fff",
    fontWeight: "bold",
  },

  listaVazia: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
  },

  dataVerde: {
    color: "#2f9e44",
    fontWeight: "bold",
  },

  dataAmarela: {
    color: "#f59f00",
    fontWeight: "bold",
  },

  dataVermelha: {
    color: "#d62828",
    fontWeight: "bold",
  },
});
