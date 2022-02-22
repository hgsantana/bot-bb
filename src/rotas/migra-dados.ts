import { Request, Response } from 'express'
import { Candidato } from '../models/candidato'
import { MacroRegiao } from '../models/macro-regiao'

export const migraDados = async (req: Request, res: Response) => {

    const matches = dados.match(/macro:(.)*?\|/gi)
    if (matches) {
        const objeto = matches.map(linha => {
            return linha.replace('|', "").split(',').map(l => l.trim())
        })
        const novoObj = objeto.map(o => {
            const nascimento = o[3].replace('nascimento: ', '').split('/')
            const ano = parseInt(nascimento[2])
            const mes = parseInt(nascimento[1]) - 1
            const dia = parseInt(nascimento[0])
            return {
                macroRegiao: parseInt(o[0].replace('macro: ', '')),
                microRegiao: parseInt(o[1].replace('micro: ', '')),
                nome: o[2].replace('nome: ', ''),
                nascimento: new Date(ano, mes, dia),
                posicao: parseInt(o[4].replace('posicao: ', '')),
                tipo: o[5].replace('tipo: ', '')
            }
        });
        const macros: MacroRegiao[] = []
        novoObj.forEach(obj => {
            const macroRegiao = macros.find(macro => macro?.id == obj.macroRegiao)
            const candidato: Candidato = {
                dataNascimento: obj.nascimento,
                nome: obj.nome,
                posicao: obj.posicao,
                situacao: "",
                tipo: obj.tipo
            }
            if (macroRegiao) {
                const microRegiao = macroRegiao.microRegioes.find(micro => micro?.id == obj.microRegiao)
                if (microRegiao) {
                    microRegiao.candidatos.push(candidato)
                } else {
                    macroRegiao.microRegioes.push({
                        id: obj.microRegiao,
                        candidatos: [candidato]
                    })
                }
            } else {
                macros.push({
                    id: obj.macroRegiao,
                    microRegioes: [
                        {
                            id: obj.microRegiao,
                            candidatos: [candidato]
                        }
                    ]
                })
            }
        })
        res.send(macros)
    }

}

const dados = `
macro: 10, micro: 16, nome: ADELSON JHONATA SILVA DE SOUSA, nascimento: 30/09/1997, posicao: 410, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ADERSON LUCAS MENDONCA E SILVA MEDEIROS, nascimento: 09/05/1985, posicao: 312, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ADRIANA DE FATIMA LOURENCON WATANABE, nascimento: 06/02/1981, posicao: 151, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ADRIANO DUTRA DE DEUS FERREIRA, nascimento: 30/10/1989, posicao: 203, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ADRIELLE ALVES CARDOSO, nascimento: 11/05/1994, posicao: 469, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: AFONSO LEAL TRESBACH, nascimento: 27/03/1989, posicao: 91, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ALAN CARDOSO FERREIRA, nascimento: 27/07/1995, posicao: 47, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ALAN SOARES BARBOSA, nascimento: 12/12/1991, posicao: 393, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALANDESSON LINHARES DE CARVALHO, nascimento: 04/07/1995, posicao: 16, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ALBERTO JOSE PAES LEME JOTA, nascimento: 30/06/1982, posicao: 405, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALBERTO MITSUO HIRATA, nascimento: 02/01/1984, posicao: 201, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALDRIN TAYLOR CAMPOS BITTENCOURT, nascimento: 25/05/1995, posicao: 342, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALEX DA SILVA MAROCO, nascimento: 27/12/1993, posicao: 371, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALEXANDRE CARNEIRO FROTA, nascimento: 07/10/1988, posicao: 336, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALEXANDRE DE MOURA PIMENTEL, nascimento: 02/06/2001, posicao: 90, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ALEXANDRE GUSTAVO FIGUEIREDO CARVALHO, nascimento: 18/01/2000, posicao: 82, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ALEXANDRE HENRIQUE MAGALHAES FERREIRA, nascimento: 02/07/1992, posicao: 314, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALEXANDRE MARCONDES, nascimento: 19/06/1992, posicao: 421, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALEXANDRE ROCHA DE SOUZA, nascimento: 17/03/1989, posicao: 244, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALEXSANDRO CANDIDO DE OLIVEIRA SILVA, nascimento: 21/10/1990, posicao: 133, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ALLISON CRISTIAN DA CUNHA, nascimento: 10/08/1985, posicao: 383, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ALVARO ROBERTO CAVALCANTE SANTOS, nascimento: 20/10/1992, posicao: 22, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ALVARO SOARES SA TELES SANTOS, nascimento: 14/10/1994, posicao: 117, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: AMANDA LUCENA GERMANO, nascimento: 07/12/1991, posicao: 284, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: AMANDA QUEIROZ SENA, nascimento: 26/12/1997, posicao: 402, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: AMELIA OLIVEIRA FREITAS DA SILVA, nascimento: 01/05/2002, posicao: 20, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ANA CAROLINA VITORIO PEREIRA, nascimento: 22/02/2000, posicao: 543, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ANA CLARA CUSTODIO GOSENHEIMER, nascimento: 13/11/1998, posicao: 229, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ANA LUISA SALVADOR ALVAREZ, nascimento: 01/05/1983, posicao: 197, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ANA MARIA DIB, nascimento: 20/03/1958, posicao: 106, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ANA VITORIA REZENDE RAMOS, nascimento: 18/11/1996, posicao: 381, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ANDRE GOMES PASSOS, nascimento: 23/09/1993, posicao: 166, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ANDRE LUIS DANTAS GADELHA, nascimento: 01/09/1990, posicao: 425, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ANDRE LUIS DE ALCANTARA RAMOS, nascimento: 27/06/1997, posicao: 2, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ANDRE RIBEIRO PAES DE CASTRO, nascimento: 27/07/1985, posicao: 362, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ANDRE RODRIGUES PEREIRA, nascimento: 05/03/1991, posicao: 269, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ANDRESSA PINHEIRO CONSTANTI, nascimento: 24/07/1991, posicao: 394, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ANDRESSA SOARES RODRIGUES, nascimento: 17/12/1993, posicao: 464, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ANDREY TARGA PRADO, nascimento: 16/07/1991, posicao: 186, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ANTONIO JAILTON CARVALHO ARAUJO, nascimento: 11/01/1985, posicao: 303, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ARTHUR ALCANTARA OLIVEIRA NEVES, nascimento: 21/07/1993, posicao: 74, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ARTHUR NOBRE BRITO, nascimento: 07/03/1993, posicao: 71, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ARTUR BEZERRA DELABIO FERRAZ, nascimento: 10/08/1990, posicao: 207, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ASAPH ENRICO DANTAS AVELAR, nascimento: 02/10/2002, posicao: 400, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ATHUS ASSUNCAO CAVALINI, nascimento: 11/11/1998, posicao: 105, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: AUGUSTO CESAR RODRIGUES LIMA, nascimento: 11/05/2000, posicao: 225, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: AUGUSTO PIZANO VIEIRA BELTRAO, nascimento: 11/09/1991, posicao: 118, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: AUREO RODRIGUES DE FARIAS, nascimento: 26/07/2003, posicao: 539, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: BARBARA DOS ANJOS TAPIOCA, nascimento: 02/06/2000, posicao: 263, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: BERNARDO BERNSTORFF, nascimento: 11/12/2002, posicao: 299, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: BERNARDO LOPES DE AGUIAR FILHO, nascimento: 28/08/1987, posicao: 103, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: BRENO BEZERRA DE MELO ALENCAR, nascimento: 22/11/1998, posicao: 9, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: BRUNO BARTOLOZZI CORREA, nascimento: 18/01/1994, posicao: 18, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: BRUNO BEZERRA LIMA DE FREITAS, nascimento: 01/12/1994, posicao: 240, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: BRUNO CANONGIA DE FARIA, nascimento: 26/10/1982, posicao: 415, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: BRUNO CAVALCANTE REGO, nascimento: 19/12/1987, posicao: 49, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: BRUNO COUTO MARINO, nascimento: 19/12/2000, posicao: 196, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: BRUNO CRUZ, nascimento: 11/07/1993, posicao: 517, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: BRUNO FAUSTINO CECILIO DA SILVA, nascimento: 23/04/1999, posicao: 167, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: BRUNO FERREIRA CORDEIRO, nascimento: 26/08/1989, posicao: 72, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: BRUNO NOGUEIRA DE ALMEIDA, nascimento: 04/02/1990, posicao: 428, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: BRUNO OLIVEIRA BOIKO, nascimento: 21/08/2000, posicao: 372, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: CAIO ANDRE LIMA CARVALHO TEIXEIRA DE ALBUQUERQUE, nascimento: 04/12/1991, posicao: 161, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CAIO CAVALCANTI DE AGUIAR CASTRO, nascimento: 06/10/1987, posicao: 129, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CAIO CLEMENTINO LAMARAO, nascimento: 21/11/1976, posicao: 155, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CAIO SAUSMIKAT LIMA, nascimento: 18/11/1988, posicao: 189, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CAIO VINICIUS NEVES BARCELOS, nascimento: 26/06/1998, posicao: 179, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CAIQUE PORTO LIRA, nascimento: 31/05/1994, posicao: 5, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CALEBE DO NASCIMENTO LINO, nascimento: 11/01/2004, posicao: 422, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: CARLOS CONRADO KONDO, nascimento: 12/04/1979, posicao: 282, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: CARLOS EDUARDO DIAS VINAGRE NETO, nascimento: 23/12/1998, posicao: 374, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: CARLOS EDUARDO SILVA BARBOSA, nascimento: 04/09/2000, posicao: 396, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CARLOS HENRIQUE ELLER CRUZ, nascimento: 13/11/1991, posicao: 363, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: CARLOS HENRIQUE NOGUEIRA DE LIMA, nascimento: 06/04/1992, posicao: 379, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: CARLOS TIAGO NASCIMENTO GOMES, nascimento: 13/03/1988, posicao: 558, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CASSIO MAZZA DE ANDRADE, nascimento: 19/03/1976, posicao: 252, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: CAYO VINICIUS SANTANA SANTOS, nascimento: 04/11/1994, posicao: 95, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CESAR TZANNO DE QUEIROZ, nascimento: 27/03/1998, posicao: 35, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CHARLES RODRIGUES PORTO, nascimento: 17/09/1990, posicao: 88, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CINTHIA MIE NAGAHAMA UNGEFEHR, nascimento: 22/02/2001, posicao: 357, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: CLAUDIO BESSA ARRUDA MENEZES, nascimento: 13/03/1995, posicao: 158, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: CRISTIELY GOMES PIRES, nascimento: 19/07/1993, posicao: 153, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DANIEL COIMBRA DOS SANTOS, nascimento: 28/04/2000, posicao: 438, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DANIEL COSTA GONCALVES, nascimento: 27/05/1994, posicao: 8, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DANIEL DE OLIVEIRA CAMPOS, nascimento: 26/09/1975, posicao: 247, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DANIEL MARCO DA COSTA FRANCO, nascimento: 27/05/1997, posicao: 302, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DANIEL YAMAMOTO DAMICO, nascimento: 21/12/2002, posicao: 241, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DANIELA FERREIRA DE PAIVA, nascimento: 12/04/1985, posicao: 306, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DANIELI SIMON NEVES, nascimento: 24/06/1998, posicao: 351, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DANIELLE AFONSO LEITE, nascimento: 21/03/1993, posicao: 12, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DANIELSON MACEDO MESQUITA, nascimento: 13/12/1992, posicao: 230, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DANILO DA SILVA E SILVA, nascimento: 13/06/2000, posicao: 315, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DARCIO ROCHA DA SILVA, nascimento: 17/02/1991, posicao: 524, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DAVI GUERRA ALVES, nascimento: 18/08/2001, posicao: 305, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DAVI NAKAMURA CARDOSO, nascimento: 19/05/2003, posicao: 412, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DAVID DE MELO ALMEIDA DOS REIS, nascimento: 15/03/1999, posicao: 341, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DELSON DOUGLAS BARBOSA LIMA, nascimento: 15/05/1996, posicao: 408, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DIEGO CARDOSO, nascimento: 04/08/1993, posicao: 89, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DIEGO GONZALES DALMEIDA, nascimento: 07/02/1995, posicao: 144, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DIEGO SCHMITZ DE OLIVEIRA, nascimento: 13/06/1996, posicao: 276, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DIMITRI GODOY BARBOSA LEITE, nascimento: 18/06/1978, posicao: 344, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: DIOGO GOMES DE ATAIDES, nascimento: 03/11/2003, posicao: 83, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DIOGO PINHO BRANDAO, nascimento: 21/06/1998, posicao: 387, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: DJALMA AGUIAR RODRIGUES, nascimento: 02/06/1986, posicao: 487, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: EDGARD SCHIMIDTT DE PAULA, nascimento: 07/06/1995, posicao: 356, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: EDIANA CARVALHO DA SILVEIRA, nascimento: 27/01/1992, posicao: 162, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: EDILSON SOUTO DE HOLANDA, nascimento: 14/04/1976, posicao: 446, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: EDMAR FELICIANO DE SOUSA, nascimento: 20/07/1970, posicao: 152, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: EDUARDO ALVES DA SILVA, nascimento: 27/04/1984, posicao: 388, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: EDUARDO ALVES DO PRADO REIS, nascimento: 20/06/1991, posicao: 418, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: EDUARDO ALVIM GUEDES ALCOFORADO, nascimento: 15/02/1985, posicao: 462, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: EDUARDO FERREIRA DE ASSIS, nascimento: 06/11/1998, posicao: 119, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: EDUARDO HENRIQUE TEIXEIRA, nascimento: 19/12/1994, posicao: 455, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: EDUARDO JACOME RODRIGUES, nascimento: 29/11/2001, posicao: 84, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: EDUARDO JERONIMO BERNARDINO, nascimento: 05/08/1978, posicao: 220, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: EDUARDO LUIS DOLINSKI DE LIMA, nascimento: 17/12/1997, posicao: 465, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: EMANUELLE FREITAS RODRIGUES, nascimento: 07/02/1996, posicao: 406, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: EMANUELLE SOUZA ALVES DA SILVA, nascimento: 21/09/1994, posicao: 559, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ENZO YOSHIO NIHO, nascimento: 26/07/2001, posicao: 294, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ERIBERTO OLIVEIRA DO NASCIMENTO, nascimento: 18/01/1994, posicao: 277, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ERIC DOS SANTOS COELHO, nascimento: 17/06/1996, posicao: 177, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ERIC RIBEIRO FERNANDES, nascimento: 28/01/1994, posicao: 52, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ERNANDO OLIVEIRA SANTANA, nascimento: 19/08/1995, posicao: 327, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ERYCK DE AGUIAR DALTRO TAQUES, nascimento: 29/10/1992, posicao: 96, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ESDRAS ORNAGHI KUTOMI, nascimento: 31/07/1987, posicao: 172, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FABIANA DE CASSIA SILVA ARANHA, nascimento: 31/08/1986, posicao: 138, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FABIANO BATISTA DA SILVA, nascimento: 31/10/1989, posicao: 459, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: FABIO MENDES SOARES, nascimento: 11/10/1982, posicao: 53, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FABIO MESQUITA BUIATI, nascimento: 09/07/1979, posicao: 254, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: FABIO RIOS MIRANDA, nascimento: 14/10/1988, posicao: 120, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FABIO SHINDI UCHIDATE, nascimento: 28/03/1986, posicao: 243, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: FELIPE ARQUELAU TEIXEIRA PINTO, nascimento: 19/09/1996, posicao: 140, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FELIPE BINCOLETO DE SOUSA SANTOS, nascimento: 27/02/1996, posicao: 194, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FELIPE CHULLI LOPES, nascimento: 10/01/1995, posicao: 48, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FELIPE DE GODOY AQUINO, nascimento: 28/10/1986, posicao: 264, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: FELIPE GONCALVES SOARES DE SOUZA, nascimento: 27/06/1997, posicao: 222, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: FELIPE PEROTTI NETTO, nascimento: 13/04/1994, posicao: 401, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: FELIPE VIANA SANTANA, nascimento: 29/08/1998, posicao: 218, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: FELIPE YURI INOUE, nascimento: 17/08/1992, posicao: 185, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FERNANDO CARLOS DOS SANTOS SILVA FILHO, nascimento: 21/12/1992, posicao: 39, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FERNANDO TOMIO YAMAMOTU TANAKA, nascimento: 13/03/1989, posicao: 420, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: FILIPE BISPO SILVA MAIA, nascimento: 30/09/1999, posicao: 460, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FILLIPE LOPES DO COUTO, nascimento: 06/03/1985, posicao: 295, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: FLAVIA MEGUMI OHARA, nascimento: 01/02/1992, posicao: 78, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FLAVIO NUNO MAIA DE SOUSA FILHO, nascimento: 04/05/1997, posicao: 27, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: FRANCISCO ALEXANDRE DE MELO CASTRO, nascimento: 15/07/1978, posicao: 450, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GABRIEL ALVARES DE FARIA, nascimento: 27/09/1995, posicao: 60, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GABRIEL AMORIM SOARES E SILVA, nascimento: 24/03/2003, posicao: 403, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL BELTRAO DE ABREU, nascimento: 23/12/1996, posicao: 250, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL BRAGA ZAMPRONI LIMA, nascimento: 18/01/2001, posicao: 10, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GABRIEL DE OLIVEIRA SANTANA, nascimento: 17/10/1997, posicao: 270, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL DE PAULA DA SILVA OLIVEIRA, nascimento: 01/10/1994, posicao: 397, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GABRIEL DELOLMO ERHARDT, nascimento: 31/05/1998, posicao: 31, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GABRIEL FAUSTINO LIMA DA ROCHA, nascimento: 10/09/1999, posicao: 325, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL GUSTAVO MAEDA PORTO, nascimento: 11/02/1986, posicao: 163, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GABRIEL KARAN MAIA, nascimento: 17/01/1997, posicao: 360, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL KAZUYUKI ISOMURA, nascimento: 01/08/1997, posicao: 309, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL KENDY FARIA KOMATSU, nascimento: 14/12/2000, posicao: 300, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL LUNA ROSSETO, nascimento: 28/07/1998, posicao: 290, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL LYRA GALVAO DOS SANTOS, nascimento: 15/04/2000, posicao: 378, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL MARTINS DA ROCHA, nascimento: 23/12/1998, posicao: 395, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GABRIEL OLIVEIRA DA SILVA SERGIO, nascimento: 29/11/1995, posicao: 322, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GABRIEL RACHE CARMONA, nascimento: 13/01/1994, posicao: 248, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIEL SAMPAIO DO AMARAL, nascimento: 10/08/1997, posicao: 67, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GABRIEL WILLANS DE SOUSA ANDRADE, nascimento: 15/02/1997, posicao: 265, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GABRIELA MENDES DA ROCHA VAZ, nascimento: 14/03/1997, posicao: 122, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GEORGE RAPPEL MOREIRA DA CONCEICAO, nascimento: 17/09/1996, posicao: 246, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GESIEL DOS SANTOS FREITAS, nascimento: 13/01/1988, posicao: 463, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GIOVANNA BIAGI FILIPAKIS SOUZA, nascimento: 04/03/1999, posicao: 399, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GIUSEPPE LUCA MARESCHI OUTERELO, nascimento: 01/10/1999, posicao: 187, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GLAUBER BORGES LINDOLFO, nascimento: 05/02/2001, posicao: 434, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GUILHERME FISCHMANN FERREIRA, nascimento: 28/05/1987, posicao: 184, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GUILHERME ISSAO CHIBA, nascimento: 15/11/1991, posicao: 296, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GUILHERME MAIA BATISTA, nascimento: 20/01/1993, posicao: 46, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GUILHERME MOREIRA FELIX, nascimento: 07/03/1991, posicao: 323, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GUILHERME OLIVEIRA LOIOLA, nascimento: 02/10/1999, posicao: 382, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GUILHERME RODRIGUES LODRON PIRES, nascimento: 22/11/1998, posicao: 51, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GUSTAVO BRITO DE ALMEIDA MENDONCA, nascimento: 27/06/1994, posicao: 190, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GUSTAVO DE MAGALHAES BARBOSA, nascimento: 03/07/1995, posicao: 25, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GUSTAVO FERMINO UESSLER, nascimento: 09/02/1999, posicao: 443, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GUSTAVO FORTES BARBOSA DA SILVA, nascimento: 05/06/1990, posicao: 181, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GUSTAVO PAIVA REIS, nascimento: 09/12/1982, posicao: 355, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: GUSTAVO SILVA MARQUES DE PAULA, nascimento: 05/11/1993, posicao: 157, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: GUSTAVO TEIXEIRA DOS SANTOS, nascimento: 22/07/1994, posicao: 87, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HALYNE APARECIDA DIOGO DA SILVA, nascimento: 28/10/1988, posicao: 94, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HARIEL RIBEIRO FRANCA OLIVEIRA, nascimento: 29/12/1998, posicao: 45, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HELENA SCHUBERT DA INCARNACAO LIMA DA SILVA, nascimento: 07/02/1992, posicao: 32, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HELIO DINIZ, nascimento: 11/02/1974, posicao: 188, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HENRIQUE SENOO HIRATA, nascimento: 22/05/1993, posicao: 19, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HENRIQUE VOLPI JAVAREZ, nascimento: 10/06/1998, posicao: 268, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: HERBERT LUAN SILVA, nascimento: 22/05/2001, posicao: 398, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: HEYDER ANTONIO SILVA DE ARAUJO, nascimento: 12/10/1988, posicao: 164, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HIGOR PIRES DA SILVEIRA, nascimento: 02/03/1993, posicao: 273, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: HIPOLITO FILIPE COSTA DE ARAUJO, nascimento: 23/05/1995, posicao: 124, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HUDSON SILVA ALVES, nascimento: 04/05/1993, posicao: 111, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HUGO GERALDO DE LIMA, nascimento: 14/09/1979, posicao: 429, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: HUGO HENRIQUE SALES BARBOSA, nascimento: 20/06/1979, posicao: 444, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HUGO MOES GALVAO MACIEL, nascimento: 02/05/1993, posicao: 44, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HUGO PRADO AMARAL, nascimento: 07/04/1991, posicao: 34, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: HUGO RICARDO SOUZA BEZERRA, nascimento: 20/07/2000, posicao: 345, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: HUGO SANT ANA GUIMARAES, nascimento: 16/10/1986, posicao: 195, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: IGOR DE ALMEDA GENTIL, nascimento: 01/06/1986, posicao: 313, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: IGOR FRANCA GAMA, nascimento: 30/12/1993, posicao: 40, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: IGOR LUIZ AMORIM E SILVA, nascimento: 05/11/1982, posicao: 180, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: IGOR MARQUES DE CASTRO, nascimento: 05/10/1990, posicao: 61, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: IGOR RHAMON CARDOSO DO NASCIMENTO, nascimento: 17/03/1993, posicao: 441, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: IRONILDO NUNES PORTO JUNIOR, nascimento: 16/10/2003, posicao: 328, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ISAAC GOMES MEDEIROS, nascimento: 23/07/1998, posicao: 326, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ISAAC NEVES FARIAS, nascimento: 29/04/1999, posicao: 280, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ISABELLA AZARIAS DE SOUZA, nascimento: 08/08/1995, posicao: 175, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ISABELLE SILVA CONTRERAS, nascimento: 09/04/1993, posicao: 81, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ITALO BARBOSA BRASILEIRO, nascimento: 03/07/1993, posicao: 414, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ITALO BARBOSA SANTOS, nascimento: 28/01/1997, posicao: 445, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ITALO FERREIRA CARVALHO, nascimento: 22/09/1995, posicao: 233, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ITALO FRANCHESCO MAGALHAES FEITOSA, nascimento: 01/02/1983, posicao: 11, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: IZAIAS JORGE DE MAGALHAES, nascimento: 27/01/1995, posicao: 217, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JACKSON VINICIUS OLIVEIRA MARQUES, nascimento: 09/11/1998, posicao: 366, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JADE AMORIM, nascimento: 02/09/1995, posicao: 239, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JEFFERSON SALOMAO RODRIGUES, nascimento: 18/04/1990, posicao: 391, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JESSICA GOUGET SERGIO MIRANDA, nascimento: 31/03/1988, posicao: 114, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOAO ALEXANDRE DE SOUZA FERREIRA, nascimento: 10/06/1980, posicao: 281, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO ANTONIO DESIDERIO DE MORAES, nascimento: 24/05/1994, posicao: 26, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOAO AUGUSTO GUEDES FERREIRA DE LIMA, nascimento: 09/01/1978, posicao: 41, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOAO MARCELO RODRIGUES SANTANA, nascimento: 16/06/1980, posicao: 202, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO MARCOS LUCENA DA FONSECA, nascimento: 11/11/1992, posicao: 419, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO PAULO COSTA DE ARAUJO, nascimento: 14/01/1993, posicao: 148, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOAO PAULO CUNHA BOTELHO, nascimento: 16/09/1992, posicao: 193, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO PAULO SILVEIRA RESCALA, nascimento: 31/01/1991, posicao: 210, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO PEDRO ALBUQUERQUE DOS SANTOS, nascimento: 07/12/2001, posicao: 216, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO PEDRO MOTA JARDIM, nascimento: 22/08/1997, posicao: 136, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOAO PEDRO PINHEIRO GHESTI, nascimento: 27/10/2002, posicao: 333, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO PEDRO RABELO DO NASCIMENTO, nascimento: 20/06/2000, posicao: 253, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO PEDRO RIBEIRO DE MENEZES, nascimento: 30/06/1990, posicao: 145, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOAO PEDRO SOARES FERREIRA, nascimento: 29/04/2002, posicao: 417, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO VICTOR GOMES DE ARAUJO SANTANA, nascimento: 11/05/1999, posicao: 389, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOAO VITOR SIQUEIRA RESENDE, nascimento: 19/08/1996, posicao: 292, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOBSON GILBERTO BARROS AMORIM, nascimento: 04/07/1988, posicao: 125, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JONAS FREIRE DE ALCANTARA MARQUES DE BARROS, nascimento: 19/02/1997, posicao: 432, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JONATAN FAGUNDES DO CARMO, nascimento: 04/06/1991, posicao: 354, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JONATAS SILVEIRA DE ANDRADE, nascimento: 22/12/1991, posicao: 287, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JONATHAN RIBEIRO SILVA, nascimento: 16/06/1993, posicao: 192, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOSE ANTONIO EUZEBIO PAIVA, nascimento: 22/04/1994, posicao: 92, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOSE AUGUSTO DOS SANTOS SILVA, nascimento: 19/03/1998, posicao: 134, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOSE DA CONCEICAO FERREIRA NETO, nascimento: 27/06/1992, posicao: 274, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOSE ERIVALDO OLIVEIRA JUNIOR, nascimento: 28/09/1997, posicao: 77, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JOSE MARIA DOS SANTOS JUNIOR, nascimento: 26/11/1984, posicao: 471, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOSE RAILSON BARROS RIBEIRO, nascimento: 17/08/1995, posicao: 226, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: JOSE RODRIGUES GUIMARAES FILHO, nascimento: 25/05/1984, posicao: 447, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JUAN GARBELLOTTE BOMFIM, nascimento: 30/10/2001, posicao: 3, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: JULIANA SINAI SOUZA DOS SANTOS, nascimento: 23/08/1998, posicao: 291, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: KARINE QUARESMA LIMA, nascimento: 21/01/1997, posicao: 199, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: KAWE TAKAMOTO, nascimento: 04/09/2003, posicao: 310, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: KELLY CRISTINA DE PAULA BRASIL, nascimento: 27/11/1992, posicao: 109, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: KENNEDY EDMILSON CUNHA MELO, nascimento: 21/06/2001, posicao: 368, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: KENNEDY VIANA AGUIAR, nascimento: 05/08/2000, posicao: 112, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: KLESLEY GONCALVES FRANCISCO, nascimento: 21/10/1997, posicao: 427, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LARISSA GALVAO BARCELOS, nascimento: 04/04/2001, posicao: 56, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LAURO KENNEDY CARVALHO DE OLIVEIRA JUNIOR, nascimento: 06/12/2000, posicao: 453, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LEANDRO CESAR MEHRET, nascimento: 31/05/1986, posicao: 50, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LEANDRO DE SOUZA SANTOS, nascimento: 13/06/1990, posicao: 365, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LEANDRO JUREN LUCAS, nascimento: 09/11/1993, posicao: 289, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LEONARDO AUGUSTO PICANCO BARRETO, nascimento: 13/02/1998, posicao: 171, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LEONARDO BENTTES ALMEIDA PLACIDO DOS SANTOS, nascimento: 27/12/2002, posicao: 347, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LEONARDO CLEMENTE DE FIGUEIREDO SILVA, nascimento: 27/12/1997, posicao: 404, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LEONARDO DA SILVEIRA, nascimento: 04/04/1997, posicao: 170, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LEONARDO NUNES CORNELIO REGO, nascimento: 17/10/1996, posicao: 113, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LEONIDAS BARBOSA DA SILVA JUNIOR, nascimento: 26/07/1992, posicao: 100, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LETICIA CAMPOS CALLADO, nascimento: 23/11/1996, posicao: 364, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LETICIA FERREIRA REIS, nascimento: 20/05/1997, posicao: 169, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LIZANDRA REGIS MALTA, nascimento: 20/09/2000, posicao: 198, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUARA MORENO DE ASSIS, nascimento: 12/08/1990, posicao: 79, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUCAS BARBOSA DA SILVA, nascimento: 18/12/2001, posicao: 307, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS DE MORAES PINTO PEREIRA, nascimento: 09/01/2001, posicao: 107, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUCAS DE PAULA OLIVEIRA DANTAS AZARIAS, nascimento: 26/07/1985, posicao: 131, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUCAS DUARTE PINHEIRO, nascimento: 17/11/1994, posicao: 235, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS GOMES DE OLIVEIRA, nascimento: 12/02/1998, posicao: 430, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS KAZUO MIMURA, nascimento: 04/07/1996, posicao: 278, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS MAIA RIOS, nascimento: 08/04/1994, posicao: 127, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUCAS MIGUEL ANTUNES DA SILVA, nascimento: 28/08/2003, posicao: 370, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS MONTEIRO MIRANDA, nascimento: 02/08/2000, posicao: 33, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUCAS MOREIRA COSTA, nascimento: 21/12/2001, posicao: 223, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS REINEHR DE ANDRADE, nascimento: 28/02/1987, posicao: 346, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS RODRIGUES FERREIRA, nascimento: 22/04/1995, posicao: 76, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUCAS SEABRA GOMES OLIVEIRA, nascimento: 30/10/1998, posicao: 334, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS SILVA BARRETO, nascimento: 24/08/1995, posicao: 440, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS SOUZA MACEDO COSTA, nascimento: 29/07/1996, posicao: 340, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCAS VINICIUS SILVA DE JESUS, nascimento: 23/04/1995, posicao: 200, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCIANO AUGUSTO CAMPAGNOLI DA SILVA, nascimento: 04/04/1997, posicao: 205, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUCIANO BRAGA GONCALVES, nascimento: 08/06/1997, posicao: 386, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUIS ALBERTO MARTINS SALES, nascimento: 26/12/1994, posicao: 13, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUIS AUGUSTO SIQUEIRA MOURAO SOARES, nascimento: 21/04/1985, posicao: 213, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUIS FELIPE BATISTA DE SOUZA, nascimento: 13/09/1997, posicao: 339, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUIS FELIPE TOMAZ, nascimento: 06/05/1997, posicao: 28, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUIS FERNANDO BARRETO DOS SANTOS, nascimento: 08/05/2000, posicao: 385, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUIS FERNANDO SHIGUEKI ARAKI, nascimento: 08/09/1997, posicao: 332, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUIS GUSTAVO BECCHERI DARIO, nascimento: 31/10/1997, posicao: 470, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUIZ ANTONIO BORGES MARTINS, nascimento: 27/12/1997, posicao: 85, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUIZ FILIPE MORAES SALDANHA OLIVEIRA, nascimento: 08/12/1996, posicao: 97, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUIZ HENRIQUE GONCALVES MIRANDA, nascimento: 07/06/1995, posicao: 242, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: LUIZ MATHEUS TEIXEIRA RODRIGUES, nascimento: 03/12/1996, posicao: 411, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUIZA PINHEIRO ANDRADE VIANA, nascimento: 05/09/1996, posicao: 227, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: LUKAS NASCIMENTO BARCELLOS, nascimento: 21/11/1996, posicao: 361, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCELINO IOSHIO KUZUHARA, nascimento: 26/12/1974, posicao: 128, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARCELO GERMANO ALENCAR, nascimento: 05/08/1972, posicao: 116, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARCELO LEAO CORREA FAY, nascimento: 26/10/1988, posicao: 245, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCELO VASCONCELOS NOGUEIRA, nascimento: 17/04/1996, posicao: 468, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCIO BRENER JESUINO DA COSTA, nascimento: 11/11/1978, posicao: 348, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCOS ALVES DE OLIVEIRA, nascimento: 19/08/1985, posicao: 304, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCOS ANTONIO PINHEIRO SILVA, nascimento: 10/09/1998, posicao: 301, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCOS ANTONIO VICTOR ARCE, nascimento: 08/10/1999, posicao: 147, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARCOS FERNANDO TURIAL DE MORAES, nascimento: 07/04/1998, posicao: 426, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCOS PAULO MACHADO MATHEUS, nascimento: 27/12/1994, posicao: 24, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARCOS RODRIGUES MONTALVAO GALVAO, nascimento: 12/05/1991, posicao: 392, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCOS TERUAKI HOSOYA, nascimento: 14/02/1993, posicao: 349, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCOS VINICIUS CAMPOS, nascimento: 05/10/1989, posicao: 320, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCOS VINICIUS LISBOA MELO, nascimento: 02/09/1998, posicao: 298, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCOS VINICIUS SILVA, nascimento: 08/02/1988, posicao: 431, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCOS VINICIUS SUGUINO, nascimento: 20/11/1985, posicao: 14, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARCUS ALDREY SOARES DOS SANTOS, nascimento: 24/03/1997, posicao: 260, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARCUS PAULO MARQUES PEREIRA, nascimento: 21/02/1996, posicao: 219, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARCUS VINICIUS OLIVEIRA DE ABRANTES, nascimento: 04/12/2000, posicao: 15, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARCUS VINICIUS PEREIRA REGO, nascimento: 16/05/1992, posicao: 238, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MARIA JULIA DIAS LIMA, nascimento: 10/12/1999, posicao: 209, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARIA LUISA SILVA, nascimento: 24/11/1998, posicao: 110, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARIA LUIZA FERREIRA ASSUMPCAO ALMEIDA, nascimento: 22/10/1997, posicao: 178, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARIANA LEMOS SILVA LISBOA, nascimento: 01/01/1995, posicao: 173, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARIANA XAVIER MOREIRA, nascimento: 21/02/1997, posicao: 146, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARILIA LEAL CUNHA, nascimento: 15/08/1996, posicao: 494, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MARIO WATANABE, nascimento: 29/04/1961, posicao: 126, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MATEUS CIRILO DE SOUZA, nascimento: 29/03/1997, posicao: 285, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATEUS LUIS ROCKENBACH, nascimento: 02/02/1994, posicao: 212, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATEUS PENA MACHADO DE JESUS, nascimento: 03/09/1995, posicao: 353, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MATHEUS AFONSO DE ALBUQUERQUE E SILVA, nascimento: 23/02/1995, posicao: 324, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATHEUS ANDRADE MONTEIRO, nascimento: 17/04/1994, posicao: 139, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MATHEUS ATAIDES REIS, nascimento: 19/07/1996, posicao: 64, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MATHEUS BARBOSA E SILVA, nascimento: 16/08/1994, posicao: 234, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATHEUS BASILIO GAGLIANO, nascimento: 08/04/1998, posicao: 37, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MATHEUS BERNARDI DA SILVA, nascimento: 03/03/1999, posicao: 143, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MATHEUS GABRIEL ALVES RODRIGUES, nascimento: 07/06/2000, posicao: 456, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATHEUS HENRIQUE AGUIAR NUNES, nascimento: 24/09/1999, posicao: 416, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATHEUS MAGALHAES RIBEIRO, nascimento: 01/10/1992, posicao: 338, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATHEUS MARTINS CASTRO ALMEIDA, nascimento: 30/04/2001, posicao: 176, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MATHEUS MARTINS DE CARVALHO, nascimento: 19/10/1991, posicao: 271, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATHEUS MORA SENE, nascimento: 20/11/1993, posicao: 359, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATHEUS MORAIS DALVI, nascimento: 02/08/1996, posicao: 149, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MATHEUS NANTES COSTA, nascimento: 08/12/1995, posicao: 266, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MATHEUS PHILLIPE VELOZO AMARAL, nascimento: 01/10/1991, posicao: 63, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MATHEUS RODRIGUES DE JESUS, nascimento: 14/09/1994, posicao: 262, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MAURICIO DE SOUZA, nascimento: 18/07/1993, posicao: 249, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MAURO FERRARE JUNIOR, nascimento: 24/05/1986, posicao: 330, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MAXWELL MOURA FERNANDES, nascimento: 14/01/1991, posicao: 102, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MAYARA CARVALHO ALBUQUERQUE, nascimento: 18/06/1997, posicao: 21, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MIQUEIAS MOREIRA PEIXOTO, nascimento: 18/10/1989, posicao: 317, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: MURILO ALBERTO DOS SANTOS, nascimento: 12/04/1995, posicao: 550, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: MURILO VIDOTTO, nascimento: 19/11/1990, posicao: 316, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: NATALIA RIBEIRO CABRAL, nascimento: 11/06/1997, posicao: 369, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: NATAN DE PONTES DA SILVA, nascimento: 26/06/1993, posicao: 358, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: NATASHA BARREIRA FLAUSINO, nascimento: 01/10/1997, posicao: 413, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: NATHANY DE MOURA REIS, nascimento: 04/05/1991, posicao: 448, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: NEWTON DE LIMA CARLINI, nascimento: 10/11/1979, posicao: 308, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: OTAVIO AUGUSTO MARIANO MENEGUELA, nascimento: 28/03/1975, posicao: 141, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PABLO ANDERSON DE LUNA LIMA, nascimento: 16/06/1991, posicao: 373, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PABLO PEREIRA PUPULIN, nascimento: 24/03/1992, posicao: 275, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PATRICIA TAKAKI NEVES, nascimento: 05/08/1977, posicao: 232, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PAULO ALVES COSTA JUNIOR, nascimento: 07/11/1987, posicao: 424, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PAULO JOSE VALERIO CRUZ, nascimento: 31/08/1999, posicao: 437, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PAULO ROBERTO DE SOUZA JUNIOR, nascimento: 30/09/1978, posicao: 466, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PAULO ROBERTO RAMOS MOTA, nascimento: 17/11/1997, posicao: 256, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PAULO VICTOR SOUZA DA SILVA, nascimento: 27/12/1996, posicao: 6, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PAULO VITOR BETTINI DE PAIVA LIMA, nascimento: 01/11/1987, posicao: 59, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PEDRO ANTONIO DE ALMEIDA ADELINO, nascimento: 29/08/1985, posicao: 58, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PEDRO AUGUSTO FERREIRA DA SILVA, nascimento: 18/10/1993, posicao: 454, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PEDRO BRAGA PLA, nascimento: 23/09/1993, posicao: 174, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PEDRO CAIAFA MARQUES, nascimento: 03/06/1995, posicao: 224, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PEDRO DE SOUZA ALMEIDA, nascimento: 31/07/1995, posicao: 130, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PEDRO EMANUEL BORGES COSTA, nascimento: 12/06/2001, posicao: 208, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PEDRO FAUSTINO DE OLIVEIRA RODRIGUES DE MELO, nascimento: 08/02/2003, posicao: 457, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PEDRO HENRIQUE BATISTA BORGES, nascimento: 19/02/1991, posicao: 331, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PEDRO HENRIQUE BITTENCOURT LEITE, nascimento: 13/03/1995, posicao: 69, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PEDRO HENRIQUE IANES RODRIGUES, nascimento: 08/02/1996, posicao: 57, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PEDRO HENRIQUE LIMA CARDOSO, nascimento: 06/09/2000, posicao: 261, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PEDRO HENRIQUE SOARES DA SILVA, nascimento: 06/04/1995, posicao: 221, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: PEDRO VARELLA BARCA GUIMARAES, nascimento: 05/09/1988, posicao: 70, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: PRISCILA GONCALVES GERARDI, nascimento: 21/05/1992, posicao: 228, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RACHEL SALUSTIANO ADJUTO BOTELHO, nascimento: 08/12/1995, posicao: 43, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RAFAEL BARBOSA DE SOUSA, nascimento: 02/11/1999, posicao: 165, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RAFAEL BISPO ANDRADE, nascimento: 17/09/1990, posicao: 288, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RAFAEL CORTEZ SANCHEZ, nascimento: 11/09/1987, posicao: 319, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RAFAEL FELIPE REIS ALTINO, nascimento: 06/02/1997, posicao: 137, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RAFAEL GAMA PALONE, nascimento: 25/05/1997, posicao: 42, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RAFAEL HIDEO KASHIWARA, nascimento: 10/03/1988, posicao: 376, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RAFAEL JOSE VAZ DE LIRA, nascimento: 25/08/2000, posicao: 293, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RAFAEL LAUX TABBAL, nascimento: 20/11/1979, posicao: 407, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RAFAEL MARTINS ALVES, nascimento: 12/04/1991, posicao: 384, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RAFAEL NASCIMENTO DOS SANTOS, nascimento: 31/05/1991, posicao: 439, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RAFAEL RODRIGUES MENDES, nascimento: 08/03/1995, posicao: 283, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RAFAEL VIANA VALLE LINS DE ALBUQUERQUE, nascimento: 12/01/1996, posicao: 211, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RAILSON DA CONCEICAO VASCONCELOS, nascimento: 27/05/1993, posicao: 409, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RAPHAEL CAMELO SANTANA, nascimento: 19/09/1994, posicao: 115, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RAPHAEL JULIO BARCELOS, nascimento: 01/02/1993, posicao: 449, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RENAN ANGELO VICTAL, nascimento: 17/09/1999, posicao: 272, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RENAN DELGADO CAVALCANTE ALVES MENDES, nascimento: 10/03/2002, posicao: 255, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RENNER TETZNER RAMOS, nascimento: 10/05/1994, posicao: 168, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RICARDO DE MOURA MENESES, nascimento: 12/08/1975, posicao: 286, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RICARDO IGOR FIUSA DE OLIVEIRA, nascimento: 19/05/1984, posicao: 236, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RICHARD DA SILVA BARROSO, nascimento: 03/06/1994, posicao: 101, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ROBERT MOTA OLIVEIRA, nascimento: 07/04/1973, posicao: 390, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: ROBERTO TAVARES DE OLIVEIRA JUNIOR, nascimento: 11/01/1980, posicao: 423, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RODOLFO DE LIMA E ROSA, nascimento: 05/11/1975, posicao: 259, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RODOLFO FELIPE MEDEIROS ALVES, nascimento: 17/12/1993, posicao: 135, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RODOLFO MOACIR SEABRA JUNIOR, nascimento: 06/12/1977, posicao: 159, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RODRIGO BRAGATO PIVA, nascimento: 18/04/2000, posicao: 121, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RODRIGO DE LIMA CARVALHO, nascimento: 31/05/1991, posicao: 54, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RODRIGO DE SOUSA SERAFIM DA SILVA, nascimento: 07/10/1991, posicao: 75, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RODRIGO DEMETRIO PALMA, nascimento: 21/10/1997, posicao: 73, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RODRIGO DOMINGUES PEREIRA SABINO, nascimento: 13/03/1993, posicao: 1, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RODRIGO FERREIRA GUIMARAES, nascimento: 24/12/1994, posicao: 337, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RODRIGO RAIDER DE OLIVEIRA, nascimento: 06/08/1991, posicao: 279, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: RODRIGO SENA SAUNDERS, nascimento: 11/03/1999, posicao: 68, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: ROGERIO GHIRALDELI BOTELHO DE PAULA, nascimento: 29/06/1997, posicao: 93, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: RUAN ROUSSENQ ALVES, nascimento: 25/04/1990, posicao: 461, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: SALVIO MEDEIROS COSTA NETO, nascimento: 17/03/1994, posicao: 55, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: SAMUEL DE JESUS MEIRELES MARTINS FILHO, nascimento: 14/09/1991, posicao: 321, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: SAUL MILU DA SILVA VARAO, nascimento: 25/08/1991, posicao: 150, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: SERGIO WILLIAMS BEZERRA LOPES, nascimento: 10/11/1976, posicao: 257, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: TALES PINHEIRO DE ALMEIDA, nascimento: 08/10/1998, posicao: 350, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: THAIS MALDONADO KONISHI, nascimento: 21/11/1987, posicao: 80, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THALLES HUMBERTO COGO CARAMAO, nascimento: 27/09/1989, posicao: 436, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: THALLYSSON ALVES DA SILVA, nascimento: 09/06/1997, posicao: 329, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: THIAGO CHAVES MONTEIRO DE MELO, nascimento: 21/12/1999, posicao: 86, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THIAGO DE OLIVEIRA ALMEIDA, nascimento: 19/12/1999, posicao: 154, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THIAGO FELIPE DOS SANTOS, nascimento: 01/07/1996, posicao: 267, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THIAGO FELIPE NOGUEIRA DE JESUS, nascimento: 30/10/1998, posicao: 377, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THIAGO GUIMARAES BARROS, nascimento: 31/10/1995, posicao: 433, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: THIAGO HACK RUTHES, nascimento: 17/01/1998, posicao: 160, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THIAGO HENRIQUE ASSI, nascimento: 11/08/2000, posicao: 23, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THIAGO MAMORU TAMASHIRO, nascimento: 01/02/1984, posicao: 104, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THIAGO MARTINS NEVES, nascimento: 14/02/1986, posicao: 237, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: THIAGO MENDONCA FERREIRA RAMOS, nascimento: 27/10/1990, posicao: 297, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: THIAGO PEREIRA RIBEIRO DANTAS, nascimento: 22/07/1990, posicao: 156, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THIAGO PIZZIO MEDINA, nascimento: 21/08/1995, posicao: 30, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: THIAGO TEIXEIRA DE FARIA, nascimento: 27/08/1993, posicao: 142, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: TIAGO ALCOFORADO COUTINHO, nascimento: 28/11/1995, posicao: 204, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: TIAGO DE OLIVEIRA AOKI, nascimento: 20/06/1991, posicao: 132, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: TIAGO DEUSDARA RODRIGUES BEZERRA, nascimento: 08/02/1990, posicao: 258, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: TIAGO MENDONCA DE OLIVEIRA, nascimento: 27/01/1989, posicao: 214, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VALDECY LOURENCO DE ARAUJO JUNIOR, nascimento: 04/12/1984, posicao: 458, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VALDIR NESI JUNIOR, nascimento: 31/12/1984, posicao: 367, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VICTOR ARAUJO DANTAS, nascimento: 07/03/1997, posicao: 442, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VICTOR CAVALCANTI FERNANDES FERREIRA, nascimento: 28/09/1994, posicao: 435, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VICTOR DANIEL VIEIRA MACIEL, nascimento: 16/02/2000, posicao: 65, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VICTOR FABRO NERI, nascimento: 11/03/1996, posicao: 335, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VICTOR FLORES DE QUEIROZ, nascimento: 15/09/1998, posicao: 66, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VICTOR GONCALVES NETTO, nascimento: 29/03/1995, posicao: 38, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VICTOR HUGO DE JESUS FREITAS, nascimento: 19/03/1998, posicao: 123, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VICTOR LOUZADA MARRECO, nascimento: 19/04/1991, posicao: 231, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VICTOR PELLEGRINO MARCIANO DA SILVA, nascimento: 12/11/1995, posicao: 375, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VICTOR RODRIGUES BUCCI ROTTA, nascimento: 01/02/1989, posicao: 215, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VICTOR SANTOS PIMENTEL RODRIGUES DE ARAUJO, nascimento: 20/12/1997, posicao: 251, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VINICIUS BECKER DE SOUZA, nascimento: 11/11/1986, posicao: 318, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VINICIUS DE SANTANNA SALUSTIANO, nascimento: 25/02/1987, posicao: 29, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VINICIUS DE SOUSA SANTANA, nascimento: 25/07/1992, posicao: 98, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VINICIUS DO COUTO PINHEIRO, nascimento: 16/02/1987, posicao: 191, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VINICIUS GARCEZ SCHAURICH, nascimento: 16/12/1991, posicao: 352, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: VINICIUS JAEGGER PIMENTEL, nascimento: 02/08/1991, posicao: 62, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VINICIUS LOPES SIMOES, nascimento: 18/08/1997, posicao: 7, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VITOR CESAR COTA BONELLI, nascimento: 19/05/1995, posicao: 108, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VITOR DE ARAUJO VIEIRA, nascimento: 04/10/1993, posicao: 182, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: VITOR KEIDI FIGUEIREDO KOMENO, nascimento: 01/06/1999, posicao: 4, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: WAGNER CUNHA DA SILVA, nascimento: 25/12/1987, posicao: 452, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: WALLAS FERREIRA DE MORAIS, nascimento: 09/08/1983, posicao: 183, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: WALTER PRESTES CORREIA JUNIOR, nascimento: 16/03/1967, posicao: 380, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: WALTER SHIZUO KODA, nascimento: 12/11/1959, posicao: 467, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: WARLEY ANDRE DE MIRANDA, nascimento: 03/03/1982, posicao: 17, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: WEILLER FERNANDES PEREIRA, nascimento: 14/08/1995, posicao: 311, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: WELLINGTON CARLOS SOARES PORTO, nascimento: 25/01/1991, posicao: 343, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: WESLEY DOS SANTOS KAWAFUNE, nascimento: 13/06/1992, posicao: 36, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: WILLIAM BRITO DE OLIVEIRA, nascimento: 11/09/1991, posicao: 99, tipo: CLASSIFICADO|
macro: 10, micro: 16, nome: YAGO DO NASCIMENTO, nascimento: 08/02/1994, posicao: 451, tipo: CADASTRO-RESERVA|
macro: 10, micro: 16, nome: YAGO TELLES CANDEIAS, nascimento: 09/12/1999, posicao: 206, tipo: CLASSIFICADO`