import { BotConfig } from "./models/bot-config"
import { iniciaChecagemCandidatos } from "./services/candidato-service"

const BOT_CONTIG: BotConfig = {
  tempoEntreChecagens: 250, // em milissegundos
  tempoDescansoFila: 60, // em segundos
  timeout: 5, // em segundos
}

export const iniciarBot = async () => {
  console.log("Bot iniciado.")
  console.log("Configuração do BOT:", BOT_CONTIG)
  iniciaChecagemCandidatos(BOT_CONTIG)
}
