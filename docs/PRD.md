# Phronix AI · PRD do fluxo do produto

Versão 2026-10-09. Substitui o fluxo "currículo + vaga antes da conta" e o onboarding de currículo obrigatório.

## 1. O pedido, reescrito

> Reestruture o Phronix em torno de um painel. O fluxo é: landing → criar conta ou entrar → painel. Criar conta pede só nome, e-mail e senha; o currículo é lido apenas dentro do app, com a conta já criada. O painel mostra as métricas da pessoa: quantas entrevistas ela elaborou e já fez, as datas das próximas, quantas vezes praticou e como foi a prática (acertos, quase, erros e o resultado de cada rodada). Do painel saem três portas:
>
> 1. **Elaborar entrevista**: currículo (só na primeira vez) → vaga → diagnóstico → escolher a entrevista (RH, Técnica, Liderança) → conversa dos casos → mapa de respostas. Depois de criada, a entrevista aparece no painel.
> 2. **Praticar**: escolher a entrevista e praticar as respostas.
> 3. **Hora do Show**: escolher qual entrevista é agora e consultar as respostas ao vivo.
>
> Tudo com acesso fácil: o que a pessoa precisa fica a um toque do painel.

## 2. Problema e objetivo

O fluxo anterior pedia currículo e vaga antes da conta e, depois, um onboarding obrigatório de currículo. Era "muito onboarding": a pessoa trabalhava antes de ver o produto e não tinha uma casa para voltar.

Objetivo: a conta vem primeiro e é leve, e o painel vira a casa da pessoa, de onde tudo é alcançável em um toque.

## 3. Público

Quem tem entrevista marcada (ou em vista), costuma ter de 3 a 6 processos em andamento e usa o app tanto no celular quanto no computador. Produto em português do Brasil.

## 4. Fluxo

```
Landing (/)
  └─ Criar conta (/criar-conta) ou Entrar (/entrar)
        └─ Painel (/painel)  ← tour guiado no primeiro acesso
              ├─ Elaborar entrevista (/elaborar)
              │     Currículo (só sem currículo salvo) → Vaga → Diagnóstico → Entrevista
              │     └─ Conversa dos casos (/kits/[id]/conversa) → Mapa (/kits/[id]/mapa)
              ├─ Praticar (/pratica) → escolher a entrevista → /kits/[id]/pratica
              ├─ Hora do Show (/hora-do-show) → escolher a entrevista → /hora-do-show/[id]
              ├─ Currículo (/curriculo): enviar ou trocar
              └─ Conta (/conta)
```

Rotas antigas redirecionam: `/comecar` → `/curriculo`, `/painel/nova-vaga` e `/preparacoes/nova` → `/elaborar`, `/preparacoes` → `/painel`.

## 5. Telas

### 5.1 Criar conta e entrar
- Criar conta: nome, e-mail e senha (mínimo de 8 caracteres). Nada de currículo aqui.
- Com a sessão aberta, vai direto ao painel. Com confirmação de e-mail ligada, o link leva ao painel.
- Quem já está logado e abre `/entrar` ou `/criar-conta` vai para o painel.

### 5.2 Painel
Ordem na tela:
1. **Abertura**: "Olá, {nome}." e uma frase que responde "o que vem agora?" (ex.: "Faltam 4 dias para a entrevista técnica na Loja X."), com uma linha de apoio (quanto já está no Palco).
2. **Três portas**: Elaborar entrevista, Praticar, Hora do Show. Cada uma diz o próprio estado (ex.: "5 respostas esperando revisão"). A recomendada no momento fica em Fênix:
   - sem entrevista → Elaborar;
   - entrevista com mapa hoje ou amanhã → Hora do Show;
   - com mapa → Praticar;
   - senão → Elaborar.
3. **Linha do ensaio**: duas semanas de prática à esquerda do "hoje" (uma barra por dia, empilhada em acertos, quase e erros) e as entrevistas com data à direita (entrevistas do mesmo dia num marco só).
4. **Próximas entrevistas**: data, tipo, vaga, % no Palco e atalhos (Continuar a conversa, ou Praticar, Mapa e Hora do Show).
5. **Como foi a prática**: vezes que praticou, acertos, quase, erros, taxa de acerto e as últimas 5 rodadas com o resultado de cada uma.
6. **Entrevistas que você já fez**: as que têm data no passado.
7. **Seu currículo**: dados principais e "Trocar currículo", ou "Enviar currículo" quando ainda não há.

### 5.3 Elaborar entrevista
- Sem currículo salvo: o primeiro passo é ler e revisar o currículo (PDF com texto, DOCX ou texto colado; extração pela IA).
- Com currículo: começa na vaga e mostra "Usando o currículo de {nome}. Trocar currículo".
- Vaga: descrição (mínimo de 300 caracteres), empresa, cargo e data. É salva assim que a IA a lê.
- Diagnóstico: nível, faixa pedida, match de 0 a 100, pontos fortes, lacunas e estratégia. O nível pode ser ajustado.
- Entrevista: RH, Técnica ou Liderança. Cria a entrevista e abre a conversa dos casos.
- Com `?vaga=<id>`, cria outra entrevista para a mesma vaga, reaproveitando o diagnóstico e a data.

### 5.4 Praticar
- Lista as entrevistas com mapa, primeiro as que têm respostas vencidas, com % no Palco e o resultado da última rodada.
- Sem entrevista com mapa: explica o motivo e leva a Elaborar (ou ao painel), com o kit de demonstração como alternativa.

### 5.5 Hora do Show
- Seleção: "Qual entrevista é agora?". A lista vem primeiro do aparelho (IndexedDB) e abre sem internet. Com rede, baixa as entrevistas com mapa da conta para o aparelho.
- A entrevista marcada mais próxima fica no topo, com um filete Fênix.
- Ao escolher, abre o palco existente (`/hora-do-show/[id]`), com tela escura, leitura rápida e funcionamento offline.

### 5.6 Currículo
Enviar ou trocar, sempre logado. Trocar vale para as próximas entrevistas; as já elaboradas guardam o currículo da época. Volta para `?next=` ou para o painel.

### 5.7 Tour do primeiro acesso
Treze passos no painel logo depois de criar a conta: destaca as três portas, a linha do ensaio, a prática, as próximas entrevistas, o currículo e a Conta, e explica no centro as telas que a pessoa ainda não abriu (diagnóstico, conversa dos casos, mapa). Aparece uma vez por conta (`profiles.tour_concluido_em`).

## 6. Métricas: definições

| Métrica | Definição |
|---|---|
| Entrevistas elaboradas | Kits da pessoa (um kit = uma entrevista de um tipo para uma vaga). |
| Próximas entrevistas | Kits com data hoje ou depois, ou sem data. |
| Entrevistas que você já fez | Kits com data no passado. |
| Vezes que praticou | Sessões: revisões do mesmo kit com menos de 30 minutos entre si contam como uma. |
| Acertos, quase, erros | Soma das notas de todas as revisões (`reviews.nota`). |
| Taxa de acerto | Acertos ÷ (acertos + quase + erros). |
| % no Palco | Respostas do kit na caixa 5 do Leitner ÷ respostas praticáveis. |
| Respostas esperando revisão | Respostas sem revisão ou com a próxima revisão vencida. |

As métricas vêm das revisões já sincronizadas. O que foi praticado offline entra quando o aparelho sincroniza.

## 7. Regras que continuam valendo
- **Verdade antes de brilho**: a IA nunca inventa empresa, cargo, projeto, tecnologia ou número; o que falta vira `[confirmar: …]`.
- **IA só no servidor**: Gemini 3.8 Flash onde a pessoa lê o resultado, 3.5 Flash-Lite em extração e reescrita.
- **A extração de currículo e de vaga exige login.**
- **Hora do Show funciona offline.**
- **Paleta Brasa e direção Trilha**: o painel segue a direção "Agenda de ensaio".

## 8. Fora do escopo desta versão
- Pagamento (kit avulso e Pro): a tela de plano existe, mas a cobrança não está ligada.
- Registrar o resultado real da entrevista (passou, não passou).
- Termos de uso e política de privacidade.
- Ícones do PWA, que dependem do logo.

## 9. Critérios de aceite
- Criar conta leva ao painel sem pedir currículo.
- O painel abre sem currículo e sem entrevistas, com Elaborar em destaque.
- Elaborar pede o currículo só quando não há um salvo; com currículo, começa na vaga.
- A entrevista criada aparece no painel em "Próximas entrevistas" e na linha do ensaio (quando tem data).
- Praticar e Hora do Show mostram a escolha da entrevista antes de abrir.
- As métricas aparecem sempre, mesmo zeradas.
- As rotas antigas redirecionam para as novas.
