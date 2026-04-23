import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configurarNotificacoes() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("validade", {
      name: "Validade dos alimentos",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function pedirPermissaoNotificacao() {
  const { status } = await Notifications.getPermissionsAsync();

  if (status !== "granted") {
    const resposta = await Notifications.requestPermissionsAsync();
    return resposta.status === "granted";
  }

  return true;
}

export function converterTextoParaData(dataTexto: string) {
  const partes = dataTexto.split("/");

  if (partes.length !== 3) return null;

  const dia = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const ano = Number(partes[2]);

  const data = new Date(ano, mes, dia);
  data.setHours(9, 0, 0, 0);

  if (
    data.getDate() !== dia ||
    data.getMonth() !== mes ||
    data.getFullYear() !== ano
  ) {
    return null;
  }

  return data;
}

export async function agendarNotificacaoValidade(
  nomeProduto: string,
  dataValidade: string
) {
  const data = converterTextoParaData(dataValidade);

  if (!data) return null;

  const umDiaAntes = new Date(data);
  umDiaAntes.setDate(umDiaAntes.getDate() - 1);
  umDiaAntes.setHours(9, 0, 0, 0);

  const agora = new Date();

  if (umDiaAntes <= agora) {
    return null;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Produto perto da validade",
      body: `${nomeProduto} vence em breve.`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: umDiaAntes,
      channelId: "validade",
    },
  });

  return id;
}

export async function cancelarNotificacao(id?: string | null) {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}
