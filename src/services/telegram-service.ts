import axios, { AxiosError } from "axios";
import { AGENTES_COMERCIAL } from "../data/nomes-comercial";
import { AGENTES_TI } from "../data/nomes-ti";
import { AMBIENTE } from "../main";
import { BotPinCommandResponse } from "../models/bot-command-response";
import { BotEditMessageCommand } from "../models/bot-edit-message-command";
import { BotMessageResponse } from "../models/bot-message-response";
import { BotPinCommand } from "../models/bot-pin-command";
import { BotPinnedMessage } from "../models/bot-pinned-message";
import { BotUpdate } from "../models/bot-update";
import { BotUpdateResponse } from "../models/bot-update-response";
import { Candidato } from "../models/candidato";
import { ChatCadastrado } from "../models/chat-cadastrado";
import { UsuarioCadastrado } from "../models/usuario-registrado";
import { geraRespostaCompleta } from "./html-service";
import { buscaDadosTelegram, salvaDadosTelegram } from "./storage-service";

const nomesCandidatos = [
  ...AGENTES_COMERCIAL.map((a) => a.nome),
  ...AGENTES_TI.map((a) => a.nome),
];
export let usuariosCadastrados: UsuarioCadastrado[] = [];
export let chatsCadastrados: ChatCadastrado[] = [];
export let mensagensFixadas: BotPinnedMessage[] = [];

const pilhaMensagens: BotUpdateResponse[] = [];

// consome a pilha de mensagens a cada 1s
setInterval(() => {
  if (pilhaMensagens.length) {
    const api = AMBIENTE.TELEGRAM_API + "/sendMessage";
    const mensagem = pilhaMensagens.shift();
    axios.post(api, mensagem).catch((e: AxiosError) => {
      if (mensagem) pilhaMensagens.push(mensagem);
      console.log("Erro=>", e.response?.data || e);
    });
  }
}, 1000);

// restaura backup do telegram
buscaDadosTelegram().then((dados) => {
  if (dados) {
    usuariosCadastrados = dados.usuariosCadastrados || [];
    chatsCadastrados = dados.chatsCadastrados || [];
    mensagensFixadas = dados.mensagensFixadas || [];
  }
});

export const checaMensagem = (mensagemRecebida: BotUpdate) => {
  if (!mensagemRecebida?.message?.text) return null;
  const textoMensagem = mensagemRecebida.message.text
    .replace(/\@BB_convocacao_bot/gi, "")
    .toLocaleLowerCase()
    .trim();

  if (textoMensagem.startsWith("/status")) return status(mensagemRecebida);

  if (textoMensagem.startsWith("/cadastrar"))
    return cadastrar(mensagemRecebida);

  if (textoMensagem.startsWith("/descadastrar"))
    return descadastrar(mensagemRecebida);

  // comandos abaixo somente permitidos para admins reconhecidos
  if (mensagemRecebida.message.from.id.toString() != AMBIENTE.TELEGRAM_ADMIN_ID)
    return null;

  if (textoMensagem.startsWith("/iniciar")) return iniciar(mensagemRecebida);

  if (textoMensagem.startsWith("/parar")) return parar(mensagemRecebida);

  if (textoMensagem.startsWith("/fixar")) {
    fixar(mensagemRecebida);
    return null;
  }

  return null;
};

const status = (mensagemRecebida: BotUpdate): BotUpdateResponse | null => {
  const statusCompleto = geraRespostaCompleta();
  const reply_to_message_id = mensagemRecebida?.message?.message_id;
  const parametros = mensagemRecebida.message.text
    .toLocaleUpperCase()
    .trim()
    .replace("/ss/gi", " ")
    .split(" ");
  let tipo: "TI" | "COMERCIAL" | undefined;
  if (
    parametros &&
    parametros[1] &&
    (parametros[1] == "TI" || parametros[1] == "COMERCIAL")
  )
    tipo = parametros[1];
  return {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text:
      `Status geral atualizado:\n` +
      `<pre>\n` +
      // só inclui este texto no caso de TI ou sem tipo
      (tipo == "TI" || !tipo
        ? `--- TI ---\n` +
          `${statusCompleto.ti.ultimaAtualizacao.toLocaleString("pt-br", {
            timeStyle: "short",
            dateStyle: "short",
            timeZone: "America/Sao_Paulo",
          } as any)}\n` +
          `\n` +
          `Aprovados     : ${
            statusCompleto.ti.naoConvocados + statusCompleto.ti.convocados
          }\n` +
          `Convocados    : ${statusCompleto.ti.convocados} (${(
            (statusCompleto.ti.convocados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Não Convocados: ${statusCompleto.ti.naoConvocados} (${(
            (statusCompleto.ti.naoConvocados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Empossados    : ${statusCompleto.ti.empossados} (${(
            (statusCompleto.ti.empossados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          (statusCompleto.ti.proximoConvocado
            ? `Proximo       : ${statusCompleto.ti.proximoConvocado}\n`
            : "\n") +
          `\n` +
          `Autorizadas : ${statusCompleto.ti.autorizadas}\n` +
          `Expedidas   : ${statusCompleto.ti.expedidas}\n` +
          `Qualificação: ${statusCompleto.ti.emQualificacao}\n` +
          `Qualificados: ${statusCompleto.ti.qualificados}\n` +
          `\n` +
          `Cancelados : ${statusCompleto.ti.cancelados} (${(
            (statusCompleto.ti.cancelados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Desistentes: ${statusCompleto.ti.desistentes} (${(
            (statusCompleto.ti.desistentes /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Inaptos    : ${statusCompleto.ti.inaptos} (${(
            (statusCompleto.ti.inaptos /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n`
        : "") +
      // adiciona um espaço no caso de ambos
      (!tipo ? `\n\n` : "") +
      // só inclui este texto no caso de COMERCIAL ou sem tipo
      (tipo == "COMERCIAL" || !tipo
        ? `--- COMERCIAL ---\n` +
          `${statusCompleto.comercial.ultimaAtualizacao.toLocaleString(
            "pt-br",
            {
              timeStyle: "short",
              dateStyle: "short",
              timeZone: "America/Sao_Paulo",
            } as any
          )}\n` +
          `\n` +
          `Aprovados     : ${
            statusCompleto.comercial.naoConvocados +
            statusCompleto.comercial.convocados
          }\n` +
          `Convocados    : ${statusCompleto.comercial.convocados} (${(
            (statusCompleto.comercial.convocados /
              (statusCompleto.comercial.naoConvocados +
                statusCompleto.comercial.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Não Convocados: ${statusCompleto.comercial.naoConvocados} (${(
            (statusCompleto.comercial.naoConvocados /
              (statusCompleto.comercial.naoConvocados +
                statusCompleto.comercial.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Empossados    : ${statusCompleto.comercial.empossados} (${(
            (statusCompleto.comercial.empossados /
              (statusCompleto.comercial.naoConvocados +
                statusCompleto.comercial.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `\n` +
          `Autorizadas : ${statusCompleto.comercial.autorizadas}\n` +
          `Expedidas   : ${statusCompleto.comercial.expedidas}\n` +
          `Qualificação: ${statusCompleto.comercial.emQualificacao}\n` +
          `Qualificados: ${statusCompleto.comercial.qualificados}\n` +
          `\n` +
          `Cancelados : ${statusCompleto.comercial.cancelados} (${(
            (statusCompleto.comercial.cancelados /
              (statusCompleto.comercial.naoConvocados +
                statusCompleto.comercial.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Desistentes: ${statusCompleto.comercial.desistentes} (${(
            (statusCompleto.comercial.desistentes /
              (statusCompleto.comercial.naoConvocados +
                statusCompleto.comercial.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Inaptos    : ${statusCompleto.comercial.inaptos} (${(
            (statusCompleto.comercial.inaptos /
              (statusCompleto.comercial.naoConvocados +
                statusCompleto.comercial.convocados)) *
            100
          ).toFixed(2)}%)\n`
        : "") +
      `</pre>`,
  };
};

const cadastrar = (mensagemRecebida: BotUpdate): BotUpdateResponse | null => {
  const nome = mensagemRecebida.message.text
    .split("/cadastrar")[1]
    .replace(/\ \ /gi, " ")
    .trim()
    .toUpperCase();
  const idDestinatario = `${mensagemRecebida.message.from.id}`;
  const idChat = `${mensagemRecebida.message.chat.id}`;
  const nomeUsuario = `${
    mensagemRecebida.message.from.username ||
    mensagemRecebida.message.from.first_name
  }`;
  const usuario = usuariosCadastrados.find((u) => u.id == idDestinatario);
  const reply_to_message_id = mensagemRecebida?.message?.message_id;

  let text = ``;
  const candidato = nomesCandidatos.find((n) => n == nome);

  if (!nome)
    text = `Você precisa usar a sintaxe correta: <pre>/cadastrar NOME COMPLETO</pre>`;
  else if (!candidato)
    text = `Este nome não existe no resultado final oficial.`;
  else {
    text =
      `Olá, <a href="tg://user?id=${mensagemRecebida.message.from.id}">@${mensagemRecebida.message.from.first_name}</a>. ` +
      `A partir de agora, você será marcado nas alterações para "${nome}" neste chat. ` +
      `Para cancelar, use o comando <pre>/descadastrar</pre>`;
    if (usuario) usuario.nomeChecagem = nome;
    else {
      console.log("Cadastrando novo usuário para marcação:", {
        id: idDestinatario,
        nomeChecagem: nome,
      });
      usuariosCadastrados.push({
        id: idDestinatario,
        nomeChecagem: nome,
        idChat,
        usuario: nomeUsuario,
      });
      salvaDadosTelegram({
        usuariosCadastrados,
        chatsCadastrados,
        mensagensFixadas,
      });
    }
  }

  return {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text,
  };
};

const descadastrar = (
  mensagemRecebida: BotUpdate
): BotUpdateResponse | null => {
  const idDestinatario = `${mensagemRecebida.message.from.id}`;
  const usuario = usuariosCadastrados.find((u) => u.id == idDestinatario);

  const reply_to_message_id = mensagemRecebida?.message?.message_id;

  let text = `A partir de agora, você não será mais marcado neste chat.`;
  if (usuario) {
    console.log("Descadastrando usuário para marcação:", usuario);
    usuariosCadastrados.splice(usuariosCadastrados.indexOf(usuario), 1);
    salvaDadosTelegram({
      usuariosCadastrados,
      chatsCadastrados,
      mensagensFixadas,
    });
  } else text = `Você ainda não está cadastrado para ser marcado.`;

  return {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text,
  };
};

const iniciar = (mensagemRecebida: BotUpdate): BotUpdateResponse | null => {
  // somente permitido para admins reconhecidos
  if (mensagemRecebida.message.from.id != 1574661558) return null;
  const parametros = mensagemRecebida.message.text
    .toLocaleUpperCase()
    .trim()
    .replace("/ss/gi", " ")
    .split(" ");
  let tipo: "TI" | "COMERCIAL" | undefined;
  if (
    parametros &&
    parametros[1] &&
    (parametros[1] == "TI" || parametros[1] == "COMERCIAL")
  )
    tipo = parametros[1];
  const chat = chatsCadastrados.find(
    (c) => c.id == mensagemRecebida.message.chat.id
  );
  let text = "";
  if (chat) text = `As atualizações já estão ativas para este chat.`;
  else {
    console.log(
      `Ativando atualizações ${tipo ? "de " + tipo + " " : ""}para o chat:`,
      mensagemRecebida.message.chat.id
    );
    text = `Ativando atualizações ${
      tipo ? "de " + tipo + " " : ""
    }para este chat. Para interrompê-las, use o comando /parar.`;
    chatsCadastrados.push({ id: mensagemRecebida.message.chat.id, tipo });
    salvaDadosTelegram({
      usuariosCadastrados,
      chatsCadastrados,
      mensagensFixadas,
    });
  }
  const reply_to_message_id = mensagemRecebida?.message?.message_id;
  return {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text,
  };
};

const parar = (mensagemRecebida: BotUpdate): BotUpdateResponse | null => {
  const chat = chatsCadastrados.find(
    (c) => c.id == mensagemRecebida.message.chat.id
  );
  let text = "";
  if (chat) {
    const indiceChat = chatsCadastrados.indexOf(chat);
    chatsCadastrados.splice(indiceChat, 1);
    salvaDadosTelegram({
      usuariosCadastrados,
      chatsCadastrados,
      mensagensFixadas,
    });
    console.log(
      "Desativando atualizações para o chat:",
      mensagemRecebida.message.chat.id
    );
    text = `As atualizações foram interrompidas para este chat.`;
  } else {
    text = `Não há atualizações ativas para este chat. Caso deseje ativa-las, use o comando /iniciar.`;
  }
  const reply_to_message_id = mensagemRecebida?.message?.message_id;
  return {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text,
  };
};

const fixar = async (mensagemRecebida: BotUpdate) => {
  const statusCompleto = geraRespostaCompleta();
  const parametros = mensagemRecebida.message.text
    .toLocaleUpperCase()
    .trim()
    .replace("/ss/gi", " ")
    .split(" ");
  let tipo: "TI" | "COMERCIAL" | undefined;
  if (
    parametros &&
    parametros[1] &&
    (parametros[1] == "TI" || parametros[1] == "COMERCIAL")
  )
    tipo = parametros[1];
  const mensagem: BotUpdateResponse = {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    text:
      `Status geral atualizado:\n` +
      `<pre>\n` +
      // só inclui este texto no caso de TI ou sem tipo
      (tipo == "TI" || !tipo
        ? `--- TI ---\n` +
          `${statusCompleto.ti.ultimaAtualizacao.toLocaleString("pt-br", {
            timeStyle: "short",
            dateStyle: "short",
            timeZone: "America/Sao_Paulo",
          } as any)}\n` +
          `\n` +
          `Aprovados     : ${
            statusCompleto.ti.naoConvocados + statusCompleto.ti.convocados
          }\n` +
          `Convocados    : ${statusCompleto.ti.convocados} (${(
            (statusCompleto.ti.convocados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Não Convocados: ${statusCompleto.ti.naoConvocados} (${(
            (statusCompleto.ti.naoConvocados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Empossados    : ${statusCompleto.ti.empossados} (${(
            (statusCompleto.ti.empossados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          (statusCompleto.ti.proximoConvocado
            ? `Proximo       : ${statusCompleto.ti.proximoConvocado}\n`
            : "\n") +
          `\n` +
          `Autorizadas : ${statusCompleto.ti.autorizadas}\n` +
          `Expedidas   : ${statusCompleto.ti.expedidas}\n` +
          `Qualificação: ${statusCompleto.ti.emQualificacao}\n` +
          `Qualificados: ${statusCompleto.ti.qualificados}\n` +
          `\n` +
          `Cancelados : ${statusCompleto.ti.cancelados} (${(
            (statusCompleto.ti.cancelados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Desistentes: ${statusCompleto.ti.desistentes} (${(
            (statusCompleto.ti.desistentes /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Inaptos    : ${statusCompleto.ti.inaptos} (${(
            (statusCompleto.ti.inaptos /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n`
        : "") +
      // adiciona um espaço no caso de ambos
      (!tipo ? `\n\n` : "") +
      // só inclui este texto no caso de COMERCIAL ou sem tipo
      (tipo == "COMERCIAL" || !tipo
        ? `--- COMERCIAL ---\n` +
          `${statusCompleto.comercial.ultimaAtualizacao.toLocaleString(
            "pt-br",
            {
              timeStyle: "short",
              dateStyle: "short",
              timeZone: "America/Sao_Paulo",
            } as any
          )}\n` +
          `\n` +
          `Aprovados     : ${
            statusCompleto.comercial.naoConvocados +
            statusCompleto.comercial.convocados
          }\n` +
          `Convocados    : ${statusCompleto.comercial.convocados} (${(
            (statusCompleto.comercial.convocados /
              (statusCompleto.comercial.naoConvocados +
                statusCompleto.comercial.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Não Convocados: ${statusCompleto.comercial.naoConvocados} (${(
            (statusCompleto.ti.naoConvocados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Empossados    : ${statusCompleto.comercial.empossados} (${(
            (statusCompleto.ti.empossados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `\n` +
          `Autorizadas : ${statusCompleto.comercial.autorizadas}\n` +
          `Expedidas   : ${statusCompleto.comercial.expedidas}\n` +
          `Qualificação: ${statusCompleto.comercial.emQualificacao}\n` +
          `Qualificados: ${statusCompleto.comercial.qualificados}\n` +
          `\n` +
          `Cancelados : ${statusCompleto.comercial.cancelados} (${(
            (statusCompleto.ti.cancelados /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Desistentes: ${statusCompleto.comercial.desistentes} (${(
            (statusCompleto.ti.desistentes /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n` +
          `Inaptos    : ${statusCompleto.comercial.inaptos} (${(
            (statusCompleto.ti.inaptos /
              (statusCompleto.ti.naoConvocados +
                statusCompleto.ti.convocados)) *
            100
          ).toFixed(2)}%)\n`
        : "") +
      `</pre>`,
  };

  axios
    .post<BotMessageResponse>(AMBIENTE.TELEGRAM_API + "/sendMessage", mensagem)
    .then(({ data: resposta }) => {
      if (resposta.ok) {
        const mensagemFixada: BotPinCommand = {
          chat_id: resposta.result.chat.id,
          message_id: resposta.result.message_id,
          disable_notification: false,
        };
        axios
          .post<BotPinCommandResponse>(
            AMBIENTE.TELEGRAM_API + "/pinChatMessage",
            mensagemFixada
          )
          .then(({ data: respostaFixada }) => {
            if (respostaFixada.result) {
              console.log("Mensagem fixada:", mensagemFixada);
              mensagensFixadas.push({
                chat_id: resposta.result.chat.id,
                message_id: resposta.result.message_id,
                tipo,
              });
              salvaDadosTelegram({
                chatsCadastrados,
                mensagensFixadas,
                usuariosCadastrados,
              });
            } else console.log("Falha ao fixar mensagem:", mensagemFixada);
          })
          .catch((erro) => {
            console.log("Erro=>", erro);
          });
      }
    })
    .catch((e: AxiosError) => {
      console.log("Erro=>", e.response?.data || e);
    });
};

export const enviaMensagemAlteracao = (
  situacaoAnterior: string,
  candidato: Candidato,
  tipo: "TI" | "COMERCIAL",
  proximos: number[]
) => {
  chatsCadastrados.forEach(async (chat) => {
    const usuariosChat = usuariosCadastrados.filter(
      (u) => u.nomeChecagem == candidato.nome && u.idChat == `${chat.id}`
    );
    const usuariosPrivado = usuariosCadastrados.filter(
      (u) => u.nomeChecagem == candidato.nome && u.idChat == u.id
    );
    let avisaUsuarios = "";
    if (usuariosChat.length) {
      avisaUsuarios += "\n\n";
      usuariosChat.forEach((usuario) => {
        avisaUsuarios += `<a href="tg://user?id=${usuario.id}">@${usuario.usuario}</a> `;
      });
    }
    try {
      if (
        (chat.tipo && chat.tipo != tipo) ||
        (chat.tipo == "TI" &&
          candidato.situacao.search(/qualificado|autorizada|desistente/gi) < 0)
      )
        return null;
      const mensagem: BotUpdateResponse = {
        chat_id: chat.id,
        parse_mode: "HTML",
        text:
          `Alteração ${tipo}:\n` +
          `<pre>\n` +
          `Nome: ${candidato.nome}\n` +
          `\n` +
          `Situação: ${candidato.situacao.toUpperCase()}\n` +
          `\n` +
          `Anterior: ${situacaoAnterior.toUpperCase()}\n` +
          `\n` +
          `Agência: ${
            candidato.agenciaSituacao
              ? candidato.agenciaSituacao
              : "SEM AGÊNCIA"
          }\n` +
          `Data: ${
            candidato.dataSituacao ? candidato.dataSituacao : "SEM DATA"
          }\n` +
          `Macro: ${
            candidato.macroRegiao ? candidato.macroRegiao : "SEM MACRO REGIÃO"
          }\n` +
          `Micro: ${
            candidato.microRegiao ? candidato.microRegiao : "SEM MICRO REGIÃO"
          }\n` +
          `\n` +
          `Próximos:${
            proximos.length ? proximos.map((proximo) => " " + proximo) : " 0"
          }\n` +
          `\n` +
          `Tipo: ${candidato.tipo ? candidato.tipo : "SEM TIPO"}\n` +
          `</pre>\n` +
          `Status geral na mensagem fixada.` +
          avisaUsuarios,
      };
      pilhaMensagens.push(mensagem);
      if (usuariosPrivado.length)
        usuariosPrivado.forEach((up) =>
          pilhaMensagens.push({ ...mensagem, chat_id: up.id })
        );
    } catch (error) {
      console.log("Erro=> Erro enviando mensagem para o grupo do Telegram");
      console.log("Erro=> ", error);
    }
  });
};

export const enviaMensagemAdmin = async (
  candidatosInconsistentes: Candidato[]
) => {
  try {
    let textoInconsistentes = "";
    candidatosInconsistentes.forEach((c) => {
      textoInconsistentes +=
        `\n\n` +
        `Nome: ${c.nome}\n` +
        `Situação: ${c.situacao}\n` +
        `Micro-Região: ${c.microRegiao}`;
    });
    const mensagem: BotUpdateResponse = {
      chat_id: AMBIENTE.TELEGRAM_ADMIN_ID,
      parse_mode: "HTML",
      text:
        `Candidatos com inconsistência detectados:\n` +
        `<pre>\n` +
        `Inconsistências: ${candidatosInconsistentes.length}\n` +
        `${
          textoInconsistentes.length > 3000
            ? "Muitos candidatos. Olhe o LOG."
            : textoInconsistentes
        }\n` +
        `</pre>`,
    };
    pilhaMensagens.push(mensagem);
  } catch (error) {
    console.log("Erro=> Erro enviando mensagem para usuário do Telegram");
    console.log("Erro=> ", error);
  }
};

export const editaMensagensFixadas = async () => {
  const statusCompleto = geraRespostaCompleta();
  mensagensFixadas.forEach((mensagem) => {
    const { chat_id, message_id } = mensagem;
    const novaMensagemFixada: BotEditMessageCommand = {
      chat_id,
      message_id,
      parse_mode: "HTML",
      text:
        `Status geral atualizado:\n` +
        `<pre>\n` +
        // só inclui este texto no caso de TI ou sem tipo
        (mensagem.tipo == "TI" || !mensagem.tipo
          ? `--- TI ---\n` +
            `${statusCompleto.ti.ultimaAtualizacao.toLocaleString("pt-br", {
              timeStyle: "short",
              dateStyle: "short",
              timeZone: "America/Sao_Paulo",
            } as any)}\n` +
            `\n` +
            `Aprovados     : ${
              statusCompleto.ti.naoConvocados + statusCompleto.ti.convocados
            }\n` +
            `Convocados    : ${statusCompleto.ti.convocados} (${(
              (statusCompleto.ti.convocados /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            `Não Convocados: ${statusCompleto.ti.naoConvocados} (${(
              (statusCompleto.ti.naoConvocados /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            `Empossados    : ${statusCompleto.ti.empossados} (${(
              (statusCompleto.ti.empossados /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            (statusCompleto.ti.proximoConvocado
              ? `Proximo       : ${statusCompleto.ti.proximoConvocado}\n`
              : "\n") +
            `\n` +
            `Autorizadas : ${statusCompleto.ti.autorizadas}\n` +
            `Expedidas   : ${statusCompleto.ti.expedidas}\n` +
            `Qualificação: ${statusCompleto.ti.emQualificacao}\n` +
            `Qualificados: ${statusCompleto.ti.qualificados}\n` +
            `\n` +
            `Cancelados : ${statusCompleto.ti.cancelados} (${(
              (statusCompleto.ti.cancelados /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            `Desistentes: ${statusCompleto.ti.desistentes} (${(
              (statusCompleto.ti.desistentes /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            `Inaptos    : ${statusCompleto.ti.inaptos} (${(
              (statusCompleto.ti.inaptos /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n`
          : "") +
        // adiciona um espaço no caso de ambos
        (!mensagem.tipo ? `\n\n` : "") +
        // só inclui este texto no caso de COMERCIAL ou sem tipo
        (mensagem.tipo == "COMERCIAL" || !mensagem.tipo
          ? `--- COMERCIAL ---\n` +
            `${statusCompleto.comercial.ultimaAtualizacao.toLocaleString(
              "pt-br",
              {
                timeStyle: "short",
                dateStyle: "short",
                timeZone: "America/Sao_Paulo",
              } as any
            )}\n` +
            `\n` +
            `Aprovados     : ${
              statusCompleto.comercial.naoConvocados +
              statusCompleto.comercial.convocados
            }\n` +
            `Convocados    : ${statusCompleto.comercial.convocados} (${(
              (statusCompleto.comercial.convocados /
                (statusCompleto.comercial.naoConvocados +
                  statusCompleto.comercial.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            `Não Convocados: ${statusCompleto.comercial.naoConvocados} (${(
              (statusCompleto.ti.naoConvocados /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            `Empossados    : ${statusCompleto.comercial.empossados} (${(
              (statusCompleto.ti.empossados /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            `\n` +
            `Autorizadas : ${statusCompleto.comercial.autorizadas}\n` +
            `Expedidas   : ${statusCompleto.comercial.expedidas}\n` +
            `Qualificação: ${statusCompleto.comercial.emQualificacao}\n` +
            `Qualificados: ${statusCompleto.comercial.qualificados}\n` +
            `\n` +
            `Cancelados : ${statusCompleto.comercial.cancelados} (${(
              (statusCompleto.ti.cancelados /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            `Desistentes: ${statusCompleto.comercial.desistentes} (${(
              (statusCompleto.ti.desistentes /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n` +
            `Inaptos    : ${statusCompleto.comercial.inaptos} (${(
              (statusCompleto.ti.inaptos /
                (statusCompleto.ti.naoConvocados +
                  statusCompleto.ti.convocados)) *
              100
            ).toFixed(2)}%)\n`
          : "") +
        `</pre>`,
    };
    axios
      .post<BotMessageResponse>(
        AMBIENTE.TELEGRAM_API + "/editMessageText",
        novaMensagemFixada
      )
      .then(({ data: resposta }) => {
        console.log("Editando mensagem fixada:", {
          chat: resposta.result.chat.id,
          mensagem: resposta.result.message_id,
        });
      })
      .catch((e: AxiosError) => {
        console.log("Erro=>", e.response?.data || e);
      });
  });
};
