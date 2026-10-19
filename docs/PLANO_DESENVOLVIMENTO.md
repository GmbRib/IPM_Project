# Pack&Sun: Plano de Desenvolvimento

Plano para passar dos sketches (digital + papel) para uma app React Native funcional e dinâmica: todos os ecrãs leem e escrevem dados reais na store, nada é estático.

---

## Estado (19 out 2026)

As 8 fases estão implementadas em `app/`. Tudo foi testado no browser (web); falta testar em telemóveis reais.

| Fase | Estado | Notas |
|---|---|---|
| 0 Fundação | ✅ | Expo SDK 58, NativeWind, tokens, 20 componentes base |
| 1 Dados e sessão | ✅ | Repositórios com backend local (AsyncStorage), seed da Ana, rotas protegidas |
| 2 Auth + Onboarding | ✅ | Validação com zod; documentos com foto (foto não testada em automação) |
| 3 Calendário + Eventos | ✅ | Grelha com barras, vista do dia, sugestões, criar/editar/eliminar com "Anular" |
| 4 Viagens | ✅ | Assistente, Open-Meteo (tempo + pesquisa de cidades), motor da mala, painel |
| 5 Mala | ✅ | Categorias, filtros, lista de compras, adicionar/editar/eliminar |
| 6 Histórico + Perfil | ✅ | "Como correu?", insights, "Usar como base", documentos, preferências, definições |
| 7 Polimento | ✅ parcial | Testes unitários (Jest, 20), estados vazios/erro/offline, revisão de acessibilidade de base. Por fazer: testes com utilizadores, VoiceOver/TalkBack em dispositivo, build de demonstração |

**Desvios ao plano:** folha inferior própria em vez de `@gorhom/bottom-sheet` (não abria no SDK 58); resolver zod próprio em vez de `@hookform/resolvers` (dependências em conflito); a validade do passaporte só conta para países fora de Schengen; o lembrete de mala é só guardado (sem notificações no protótipo).

---

## 1. Decisões de produto (fechadas com o grupo)

| Tema | Decisão |
|---|---|
| Ecrã inicial (após login) | **Calendário** do papel 1 ("Olá, Ana — Vamos ver a tua agenda!") com as viagens como barras sobre os dias. |
| Login | Página própria com os campos necessários (email + palavra-passe), mais o ecrã de boas-vindas com logótipo, slogan, "Criar conta" e "Já tenho conta". |
| Onboarding | **2 passos**. Passo 1: nome + condições (cadeira de rodas, alergias, medicação). Passo 2: documentos, com possibilidade de **tirar foto** do documento. Saem "Com quem costumas viajar" e "País de residência". |
| Mala | Mantém-se como no sketch digital (fluxo 2). |
| Calendário | **Clicar para abrir** (não arrastar): clicar num dia abre a vista do dia (faixa da semana + timeline). Clicar na barra de uma viagem abre a viagem. |
| Timeline (fluxo 4) | O 2º ecrã passa a ser **Criar / Editar evento**. |
| Perfil | Proposta livre (secção 6.8), a validar. |
| Eventos | **Junta os dois**: os eventos sugeridos da viagem aparecem na timeline como sugestões, que se aceitam ou ignoram. Aceites, passam a eventos normais. |
| Mala personalizada | A geração usa destino, datas, pessoas/crianças, motivo, atividades, meteorologia, condições do utilizador e histórico. |

---

## 2. Stack técnica

| Camada | Escolha | Porquê |
|---|---|---|
| Framework | **Expo (SDK atual) + React Native + TypeScript** | Corre em iOS/Android/web sem configuração nativa. Expo Go para testar no telemóvel. |
| Navegação | **Expo Router** (rotas por ficheiros) | Tabs, stacks e modais declarados pela estrutura de pastas. |
| Estilos | **NativeWind** (Tailwind para RN) | Pedido do grupo. As cores do logótipo vão para `tailwind.config.js`. |
| Estado | **Zustand** + persistência (AsyncStorage) | Simples, sem boilerplate, persiste entre aberturas da app. |
| Dados | **Camada `repositories/` com interface** e implementação local | A BD fica **em aberto**: hoje local, amanhã Supabase/Firebase/SQLite trocando só o adaptador. |
| Datas | `date-fns` com locale `pt` | Formatação "20–22 Out", semanas a começar à segunda. |
| Meteorologia | **Open-Meteo** (grátis, sem API key) + geocoding Open-Meteo | Previsão até 16 dias. A regra "disponível 10 dias antes" é nossa. |
| Câmara / fotos | `expo-image-picker` (câmara + galeria) | Foto do documento. |
| Folhas inferiores | Componente próprio (`Modal` + Reanimated) | Adicionar/editar item, seletor de viagens, detalhe do histórico, tempo. O `@gorhom/bottom-sheet` não abria com o SDK 58. |
| Ícones | `lucide-react-native` | Consistente e leve. |
| Formulários | `react-hook-form` + `zod` | Validação (datas, campos obrigatórios) com mensagens em PT. |
| Qualidade | ESLint + Prettier + `tsc --noEmit` | Base comum para os 4 membros. |

### Onde fica o código
Este repositório é o **site da cadeira** (Vite, com deploy via GitHub Actions). A app fica numa pasta própria, sem tocar no site:

```
IPM_Project/
├── src/ …            ← site (não mexer)
├── docs/PLANO_DESENVOLVIMENTO.md
└── app/              ← app Expo (package.json próprio)
```

Confirmar que `.github/workflows/deploy.yml` e o `tsconfig.json` da raiz ignoram `app/`.

---

## 3. Identidade visual (do logótipo)

Cores extraídas do logótipo Pack&Sun, com contraste verificado (WCAG AA ≥ 4.5:1 para texto):

| Token | Hex | Uso |
|---|---|---|
| `sun` | `#FDD835` | Cor principal: fundos de destaque, barra de viagem no calendário, botão primário (texto `ink`, 12.5:1). |
| `gold` | `#E6A80C` | Progresso da mala, estados ativos, raios/realces. |
| `ember` | `#CC6000` | Laranja do logótipo: ícones, bordas, elementos grandes. **Não usar para texto pequeno sobre branco** (4.0:1). |
| `ember-text` | `#B35400` | Laranja escurecido para texto e links (5.0:1 em branco). |
| `ink` | `#1A1A1A` | Texto principal, avião/traço do logótipo. |
| `cream` | `#FFFBEA` | Fundo da app (16.8:1 com `ink`). |
| `surface` | `#FFFFFF` | Cartões. |
| `muted` | `#6B6355` | Texto secundário. |
| `danger` | `#C62828` | Documento a expirar, eliminar. |
| `success` | `#2E7D32` | Item arrumado, documento OK. |

- **Tipografia:** uma sans arredondada com personalidade para títulos (ex.: *Baloo 2* ou *Nunito*, via `expo-font`) e sistema para o corpo de texto.
- **Logótipo:** o PNG anexado tem fundo branco. Exportar uma versão **com fundo transparente** (`app/assets/logo.png`) e um ícone quadrado só com o sol (`icon.png`, `adaptive-icon.png`, `splash`).
- **Acessibilidade (é uma cadeira de IPM):** alvos de toque ≥ 44pt, `accessibilityLabel` em todos os botões só com ícone, estado de cor sempre acompanhado de texto ou ícone (ex.: "Arrumado ✓"), suporte ao tamanho de letra do sistema.

---

## 4. Modelo de dados

```ts
User          { id, email, name, conditions: { wheelchair: boolean; allergies: string[]; medication: string[] }, createdAt }
Document      { id, userId, type: 'cc'|'passport'|'driving'|'other', name, number, expiresAt, photoUri? }
Trip          { id, userId, destination: { name, country, lat, lon }, startDate, endDate,
                adults, children, purpose: 'leisure'|'work', activities: Activity[],
                basedOnTripId?, status: 'upcoming'|'ongoing'|'past' (derivado das datas) }
PackingItem   { id, tripId, name, category: Category, quantity, packed: boolean,
                buyLater: boolean, source: 'generated'|'manual'|'history' }
Event         { id, tripId?, date, startTime, endTime?, title, location?, notes?,
                kind: 'user'|'suggested', status: 'accepted'|'pending'|'dismissed' }
TripReview    { tripId, forgotten: string[], unused: { name, qty }[] }   // alimenta o Histórico
```

- `Activity`: `hiking | beach | dinner_out | meeting | museums_formal | sport | theme_park | nightlife`
- `Category`: `Roupa | Higiene | Saúde | Eletrónica | Documentos | Acessórios | Criança | Outros`

### Interface de repositório (BD em aberto)
```ts
interface TripRepository { list(): Promise<Trip[]>; get(id); create(t); update(id, patch); remove(id); }
// idem para Documents, PackingItems, Events, Reviews, Auth
```
1.ª implementação: `local/` (Zustand + AsyncStorage) com **dados semente**: a Ana, Milão 20–22 Out (Trabalho), Genebra 27 Out–2 Nov (Lazer), e Sevilha e Londres no histórico.
Para trocar de BD, cria-se `supabase/` ou `firebase/` com a mesma interface e muda-se uma linha em `repositories/index.ts`.

---

## 5. Estrutura de rotas (Expo Router)

```
app/app/
├── _layout.tsx                    # providers, fontes, redireciona conforme sessão/onboarding
├── (auth)/
│   ├── welcome.tsx                # logo + "A mala certa para cada viagem" + 2 botões
│   ├── login.tsx                  # email, palavra-passe, "Esqueci-me", entrar
│   └── register.tsx               # email, palavra-passe, confirmar
├── (onboarding)/
│   ├── step-1.tsx                 # nome + condições
│   ├── step-2.tsx                 # documentos
│   └── document.tsx               # adicionar/editar documento (+ foto)
├── (tabs)/
│   ├── _layout.tsx                # Viagens · Calendário · Perfil  (initialRoute = calendario)
│   ├── viagens.tsx                # painel da viagem selecionada
│   ├── calendario.tsx             # LANDING: grelha mensal
│   └── perfil.tsx
├── trip/
│   ├── new.tsx                    # assistente 3 passos (estado interno de passo)
│   └── [id]/
│       ├── mala.tsx               # lista por categorias
│       └── documentos.tsx         # documentos relevantes p/ a viagem
├── day/[date].tsx                 # faixa da semana + timeline do dia
├── event/
│   ├── new.tsx                    # criar evento (aceita ?date=&time=&tripId=)
│   └── [id].tsx                   # editar/eliminar evento
├── historico/index.tsx            # insights + viagens anteriores
└── perfil/
    ├── dados.tsx  preferencias.tsx  documentos.tsx  definicoes.tsx
```

---

## 6. Especificação por ecrã

### 6.1 Boas-vindas / Login / Registo
- **Boas-vindas:** logótipo, slogan, "Criar conta" (primário) e "Já tenho conta" (secundário).
- **Login:** email, palavra-passe (mostrar/ocultar), "Esqueci-me da palavra-passe" (no protótipo só mostra uma mensagem), botão Entrar (desativado até ser válido) e erros inline.
- **Registo:** email, palavra-passe (≥ 8 caracteres), confirmar palavra-passe. Depois → onboarding.
- **Sessão:** quem já entrou antes abre diretamente no Calendário (o "skip" do mapa de navegação).

### 6.2 Onboarding (2 passos, barra de progresso no topo e ✕ para sair)
- **Passo 1/2: "Sobre ti":** "Como te chamas?" (obrigatório), interruptores *Uso cadeira de rodas*, *Tenho alergias* (ao ligar, aparece um campo de chips: "amendoim", "pólen"…) e *Tomo medicação* (idem). Continuar.
- **Passo 2/2: "Os teus documentos":** documentos já adicionados no topo, depois os botões "+ Cartão de Cidadão", "+ Passaporte", "+ Carta de Condução" e "+ Outro". Botões "Concluir" e "Saltar por agora".
- **Adicionar documento:** **tirar foto / escolher da galeria** (pré-visualização), nome, número, validade (seletor de data), Guardar. Pode haver vários do mesmo tipo.

### 6.3 Calendário (landing)
- Cabeçalho: "Olá, {nome}", "Vamos ver a tua agenda!", avatar (→ Perfil) e mês com setas ‹ ›.
- Grelha mensal (seg–dom). As **viagens são barras amarelas** (`sun`) que atravessam os dias, com o nome; os dias com eventos têm um ponto.
- **Clicar na barra** → Viagens com essa viagem selecionada.
- **Clicar num dia** → `day/[date]`.
- Botão flutuante "+" → criar evento nesse mês/dia.

### 6.4 Vista do dia + Timeline (fluxos 3 e 4)
- Cabeçalho: dia, dia da semana, local (destino da viagem ativa nesse dia, se houver) e tempo (ícone + temperatura).
- **Faixa da semana** clicável para mudar de dia.
- **Timeline** por horas (07h–24h), com os eventos como cartões (título, local, hora).
  - **Sugestões** da viagem aparecem em tracejado com "Aceitar" / "Ignorar".
  - Clicar num slot vazio → criar evento com a hora pré-preenchida.
  - Clicar num evento → editar.

### 6.5 Criar / Editar evento (2.º ecrã do fluxo 4)
- Título, data, hora início/fim, local, viagem associada (automática se a data estiver dentro de uma viagem), notas.
- Deteta sobreposição com outro evento e avisa (sem bloquear).
- Editar mostra também "Eliminar" (com confirmação e "Anular" num toast).

### 6.6 Viagens (painel)
- "A tua viagem **{destino} ⌄**", contagem ("Faltam 7 dias" / "Dia 2 de 3" / "Terminou"), "20–22 Out · 1 Pax · Trabalho" e botão (+) para nova viagem.
- **Seletor ⌄** → folha "As tuas viagens" (cartões com progresso da mala) + botão **Histórico**.
- Cartões clicáveis:
  1. **Previsão do tempo:** cartões por dia. Clicar abre uma folha com detalhe (min/máx, chuva, vento, UV). Se faltarem mais de 10 dias: "Só fica disponível 10 dias antes".
  2. **A tua mala:** "10/24 itens arrumados" + barra de progresso → `trip/[id]/mala`.
  3. **Eventos sugeridos:** lista (data · título · local · hora) com Aceitar/Ignorar → aparecem na timeline.
  4. **Documentos:** "1 doc precisa de atenção" quando um documento expira antes do fim da viagem (ou, no caso do passaporte, a menos de 6 meses) → lista com o problema e um atalho para editar.
- Sem viagens: estado vazio com "Criar a tua primeira viagem".

### 6.7 Nova viagem (assistente 3 passos)
- **1/3 "Para onde vais?":** destino com autocompletar (geocoding), datas de ida e regresso (regresso ≥ ida).
- **2/3 "Quantos vão e o motivo?":** contadores *Número de pessoas* (≥ 1) e *Quantas crianças* (≥ 0, ≤ pessoas), seletor *Lazer / Trabalho*.
- **3/3 "O que vais fazer?":** chips de atividades, de seleção múltipla. Se vier do Histórico, mostra "Com base em Sevilha".
- "Voltar ao passo anterior" mantém o que foi preenchido. ✕ pede confirmação se já houver dados.
- **"Criar viagem e gerar mala"** → gera a mala e os eventos sugeridos → painel da nova viagem.

### 6.8 Mala (fluxo 2)
- Cabeçalho "Mala – {destino}", "X/Y itens arrumados" e barra de progresso.
- Categorias recolhíveis, cada uma com o contador "x/y". **Toque no item = marcar como arrumado** (com feedback háptico).
- Filtros no topo: *Todos · Por arrumar · Comprar mais tarde*. O último serve como **lista de compras**.
- **Adicionar** (folha inferior): nome, categoria, quantidade, interruptor "Comprar mais tarde".
- **Editar** (folha ao tocar sem largar ou no ícone): informações, Eliminar, Comprar mais tarde.

### 6.9 Histórico
- **Insights** calculados a partir dos `TripReview`: itens esquecidos em ≥ 1 viagem e itens levados a mais.
- **Viagens anteriores:** "Sevilha · 5–8 Jul · Lazer · 2 Pax · 29 itens · 1 esquecido".
- Clicar → folha: "Esqueceste: carregador", "Levaste a mais: calções (×2)" e o botão **"Usar como base para a próxima viagem"** (abre o assistente pré-preenchido com motivo, pessoas e atividades) / Fechar.
- **Fecho da viagem:** quando a viagem termina, o painel pergunta "Esqueceste-te de alguma coisa?" (escolher itens ou escrever) e "O que não usaste?". É isto que cria o `TripReview`.

### 6.10 Perfil (proposta)
- Cabeçalho: avatar (iniciais), nome, email, "X viagens feitas".
- **Os meus documentos:** lista com estado (✓ válido / ⚠ expira em breve / ✕ expirado) → mesmo ecrã de adicionar/editar do onboarding.
- **Preferências de viagem:** editar as condições do onboarding (afeta as próximas malas geradas).
- **Histórico** → 6.9.
- **Definições:** unidade de temperatura (°C/°F), lembretes (ex.: "fazer a mala 2 dias antes"), tamanho de texto, sobre/ajuda (ver o tutorial outra vez).
- **Terminar sessão.**

---

## 7. Motor de geração da mala

Função pura, fácil de testar: `generatePackingList(trip, user, forecast?, baseReview?) → PackingItem[]`

1. **Base** para todas as viagens: escova de dentes, pasta, carregador, roupa interior, meias, pijama, documentos.
2. **Duração:** quantidades por dia (roupa interior = dias + 1, t-shirts ≈ dias, …), com um teto (ex.: 7) para viagens longas.
3. **Pessoas:** os itens pessoais multiplicam por pessoa. **Crianças** ativam a categoria *Criança* (fraldas/toalhitas/brinquedo, conforme o caso).
4. **Motivo:** *Trabalho* → portátil, roupa formal, cartões de visita; *Lazer* → (nada extra por defeito).
5. **Atividades:** tabela `activity → items` (praia → fato de banho, protetor solar, toalha; caminhadas → ténis, garrafa; vida noturna → roupa de saída; …).
6. **Meteorologia** (se disponível): chuva → guarda-chuva/impermeável; máx > 25 °C → calções, óculos de sol; mín < 10 °C → casaco, gorro.
7. **Condições do utilizador:** medicação → itens "Medicação: {nome}"; alergias → anti-histamínico / cartão de alergias; cadeira de rodas → kit de reparação e carregador da cadeira, se aplicável.
8. **Histórico:** os itens esquecidos são **adicionados sempre** (`source: 'history'`, com etiqueta "Esqueceste da última vez"); os itens levados a mais **descem de quantidade**.
9. Deduplicar por nome e categoria, somando quantidades.

**Eventos sugeridos:** no protótipo, um ficheiro `suggestions.ts` por cidade e atividade (ex.: Milão + jantar → "Jantar · Casa Cusi · 20h"), com fallback genérico. Mais tarde pode passar a uma API.

---

## 8. Fases de desenvolvimento

Cada fase acaba com a app a correr e um critério de "feito".

### Fase 0: Fundação (≈ 2 dias)
- `npx create-expo-app app -t default` (TypeScript + Expo Router), NativeWind, ESLint/Prettier.
- `tailwind.config.js` com os tokens da secção 3, fontes e logótipo transparente.
- Componentes base em `components/ui/`: `Button`, `Card`, `Chip`, `Toggle`, `Stepper`, `ProgressBar`, `TextField`, `DateField`, `BottomSheet`, `Header`, `EmptyState`.
- Tab bar (Viagens · Calendário · Perfil).
- **Feito quando:** a app abre no Expo Go nos telemóveis dos 4 e mostra as tabs com as cores certas.

### Fase 1: Dados e sessão (≈ 2 dias)
- Tipos, interfaces de repositório, implementação local com persistência e seed.
- Auth local (registo/login guardam o utilizador; a palavra-passe só existe no protótipo local, com hash simples).
- `_layout` redireciona: sem sessão → welcome; sem onboarding → step-1; senão → calendário.
- **Feito quando:** fechar e reabrir a app mantém a sessão e os dados.

### Fase 2: Auth + Onboarding (≈ 3 dias)
- Ecrãs 6.1 e 6.2, câmara/galeria para documentos.
- **Feito quando:** um utilizador novo regista-se, preenche as condições, fotografa um documento e chega ao calendário.

### Fase 3: Calendário + Dia + Eventos (≈ 4 dias)
- Grelha mensal própria (com barras de viagem a atravessar dias), vista do dia, timeline e criar/editar evento.
- **Feito quando:** criar um evento numa hora, vê-lo na timeline e no ponto do mês, editá-lo e eliminá-lo.

### Fase 4: Viagens: criação + painel (≈ 4 dias)
- Assistente de 3 passos, geocoding, Open-Meteo, painel com os 4 cartões, seletor de viagens.
- Motor da mala (secção 7) + testes unitários (Jest) às regras.
- **Feito quando:** criar "Genebra, 27/10–02/11, 1 pessoa, Lazer, caminhadas" gera uma mala coerente e o cartão do tempo respeita a regra dos 10 dias.

### Fase 5: Mala (≈ 3 dias)
- Ecrã 6.8 completo, com filtros, adicionar/editar/eliminar e progresso sincronizado com o painel.
- **Feito quando:** marcar itens atualiza "x/y" no painel e no seletor de viagens.

### Fase 6: Histórico + Perfil + Sugestões (≈ 3 dias)
- Fecho de viagem (review), Histórico, "Usar como base", Perfil completo, aceitar/ignorar sugestões em ambos os sítios.
- **Feito quando:** fechar Sevilha com "carregador esquecido" faz o carregador aparecer marcado na próxima mala gerada a partir dela.

### Fase 7: Polimento e avaliação (≈ 3 dias)
- Estados vazios, de carregamento e de erro (sem internet → tempo indisponível, a app continua a funcionar).
- Revisão de acessibilidade (VoiceOver/TalkBack, contraste, tamanho de letra).
- Microanimações (marcar item, progresso), haptics.
- Preparar os **cenários de teste com utilizadores** com o seed (tarefas: criar viagem, arrumar mala, ver tempo, adicionar documento, usar o histórico).
- Build de demonstração (Expo Go por QR ou `eas build` para um APK).

**Total estimado:** ~4 semanas a 4 pessoas, ou menos se as fases 3, 4/5 e 6 andarem em paralelo depois da Fase 1.

---

## 9. Divisão sugerida pelos 4 membros (após Fase 0–1 em conjunto)

| Membro | Área |
|---|---|
| A | Auth + Onboarding + Perfil + Documentos |
| B | Calendário + Vista do dia + Eventos |
| C | Nova viagem + Painel + Meteorologia + Sugestões |
| D | Motor da mala + ecrã Mala + Histórico |

Regras: um branch por funcionalidade (`feat/mala`, …), PR revisto por outro membro, e os componentes `ui/` partilhados só se alteram com aviso no grupo.

---

## 10. Riscos e notas

- **Grelha com barras multi-dia:** é a peça de UI mais difícil. Fazer à mão (o `react-native-calendars` não suporta bem barras a atravessar dias com texto).
- **NativeWind + Reanimated:** as classes não se aplicam a `Animated.View`; estilizar uma `View` interior (já resolvido no `BottomSheet`).
- **Open-Meteo** não precisa de chave, mas fazer cache por viagem (1 h) para não depender da rede durante os testes com utilizadores.
- **Fotos de documentos** guardam-se localmente (URI). Ao escolher uma BD remota, decidir se as fotos sobem (dados sensíveis → só local por defeito).
- **BD em aberto:** só a pasta `repositories/` sabe de onde vêm os dados. Os ecrãs nunca chamam AsyncStorage/fetch diretamente.
