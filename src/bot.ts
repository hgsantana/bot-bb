import { BotConfig } from "./models/bot-config"
import { iniciaChecagemCandidatos } from "./services/candidato-service"

const BOT_CONTIG: BotConfig = {
  tempoEntreChecagens: 500, // em milissegundos
  tempoDescansoFila: 60, // sem segundos
}

export const iniciarBot = async () => {
  console.log("Bot iniciado.")
  console.log("Configuração do BOT:", BOT_CONTIG)
  iniciaChecagemCandidatos(BOT_CONTIG)
}
