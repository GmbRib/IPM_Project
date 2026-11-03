# Pack&Sun: app

App móvel do projeto de IPM (Grupo 03). Expo + React Native + TypeScript, estilos com NativeWind (Tailwind).
Plano completo: [`../docs/PLANO_DESENVOLVIMENTO.md`](../docs/PLANO_DESENVOLVIMENTO.md).

## Correr

```bash
cd app
npm install
npx expo start        # QR code para abrir no Expo Go (telemóvel) · "w" abre no browser
```

O `npx expo start` também é o servidor dos dados (ver [Dados, servidor e partilha](#dados-servidor-e-partilha)):
os telemóveis têm de estar na mesma rede Wi-Fi que o computador (ou usa `npx expo start --tunnel`).

Antes de fazer commit:

```bash
npm run typecheck
npm run lint
npm test             # testes unitários (motor da mala, permissões, servidor, sugestões, calendário)
```

## Onde está o quê

| Pasta | Conteúdo |
|---|---|
| `src/app/` | Ecrãs (Expo Router: cada ficheiro é uma rota). `(tabs)/` = Viagens · Calendário · Perfil |
| `src/app/dev/kit.tsx` | Catálogo dos componentes base (só em desenvolvimento, via Perfil) |
| `src/components/ui/` | Componentes base: `Button`, `Card`, `Chip`, `Toggle`, `Stepper`, `ProgressBar`, `SegmentedControl`, `TextField`, `DateField`, `BottomSheet`, `Header`, `Screen`, `EmptyState`, `Text`, `IconButton` |
| `src/data/types.ts` | Modelo de dados (User, Trip, PackingItem, TripEvent, …) |
| `src/app/api/` | API routes (correm dentro do `npx expo start`): `rpc+api.ts` (tudo o que a app pede) e `export+api.ts` (CSV) |
| `src/server/` | O "servidor": `db.ts` (ficheiro JSON), `actions.ts` (cada ação, com as permissões), `seed.ts` (família demo), `schemas.ts` (validação) |
| `src/data/api.ts` | Cliente do servidor: `rpc()`, token da sessão e cópia offline |
| `src/data/demo.ts` | Contas de demonstração (uma por papel) |
| `src/lib/calendar.ts` | Datas do calendário: semanas do mês, barras das viagens, colunas de eventos sobrepostos, etiquetas em PT |
| `src/components/calendar/` · `events/` | Grelha do mês, faixa da semana, timeline do dia e formulário de eventos |
| `src/domain/` | Regras do produto, sem UI: gerar a mala (`packing.ts`), quem pode o quê (`permissions.ts`), sugestões de eventos, avisos de documentos, países |
| `src/services/` | APIs externas: meteorologia e pesquisa de cidades (Open-Meteo, sem chave), com cache e modo offline |
| `src/data/selectors.ts` | Cálculos reutilizáveis: viagem atual, estado da viagem, progresso da mala, … |
| `src/stores/` | Estado da app (Zustand): `useSession` (sessão) e `useData` (o que o utilizador pode ver, sincronizado com o servidor) |
| `src/theme/colors.js` | Paleta (cores do logótipo). O `tailwind.config.js` lê daqui: usa `bg-sun`, `text-ember-text`, … |
| `assets/images/` | Logótipo (fundo transparente) e ícones da app |

## Dados, servidor e partilha

Não há base de dados: os dados de todos ficam num ficheiro JSON no computador que corre o
`npx expo start`, servido pelas API routes do Expo Router (`app.json` → `web.output: "server"`).

- **Onde:** `app/server-data/db.json` (fora do git). Criado com a família demo da primeira vez; apaga-o para recomeçar.
  Cada pedido lê o ficheiro, trabalha e grava-o de uma vez (um pedido de cada vez).
- **Como a app lá chega:** `src/data/api.ts` usa o endereço de onde o Expo Go carregou a app
  (`Constants.expoConfig.hostUri`); na web, o próprio site. `EXPO_PUBLIC_API_URL` muda isto (servidor alojado noutro sítio).
  Um APK sozinho não tem servidor: precisa dessa variável a apontar para um.
- **"Sem ligação ao servidor"** num telemóvel: a mensagem mostra o endereço que a app usa. Esse endereço fica
  fixo quando a app abre; se o computador mudou de IP (outra rede, ou o router deu-lhe outro), abre a app
  outra vez. Para não depender do IP, abre no Expo Go pelo nome do computador:
  `exp://<nome>.local:8081`, com o nome de `scutil --get LocalHostName` (ex.: `exp://Rodrigos-MacBook-Pro.local:8081`).
- **Sincronização:** a cada 5 s e ao voltar à app (`src/hooks/useLiveSync.ts`). O servidor diz se nada mudou
  (`rev`), por isso é barato. Sem ligação, mostra a última cópia guardada no telemóvel.
- **Contas demo** (`src/data/demo.ts`; em desenvolvimento há um botão para cada uma no login, e a palavra-passe está nesse ficheiro):
  `teresa.romao@email.pt` organiza todas as viagens; em Genebra, `rui@email.pt` é co-organizador e
  `pedro@email.pt` participante (cada um com a sua mala). Código de convite de Genebra: `GENEVA`.
- **Ver os dados:** `http://localhost:8081/api/export` (só no próprio computador) → uma ligação CSV por tabela,
  sem palavras-passe nem sessões.
- **Repor tudo:** Perfil → "Repor dados de demonstração (dev)". Repõe o servidor para todos e termina todas as sessões.
- **Os ecrãs nunca falam com o servidor:** leem de `useData` / `useSession` e chamam as ações destes stores.

### Papéis numa viagem (RBAC)

Cada viagem tem um organizador (quem a criou, ou a quem ele a passou), co-organizadores e participantes.
As regras estão num só sítio, `src/domain/permissions.ts`: a app usa-as para mostrar ou esconder botões e
o servidor (`src/server/actions.ts`) volta a verificá-las em cada pedido.

| | Organizador | Co-organizador | Participante |
|---|:-:|:-:|:-:|
| A sua mala | ✓ | ✓ | ✓ |
| Ver as malas dos outros | ✓ | ✓ | |
| Sugerir itens às malas dos outros ("Sugerido por …") | ✓ | ✓ | |
| Editar a viagem, gerir a agenda, aceitar sugestões de eventos | ✓ | ✓ | |
| Convidar (código de 6 caracteres, válido 7 dias) | ✓ | ✓ | |
| Mudar papéis, remover pessoas, passar a organização | ✓ | | |
| Eliminar a viagem (para todos) | ✓ | | |
| Sair da viagem | | ✓ | ✓ |

- Só o dono de uma mala a arruma; quem sugeriu um item pode corrigi-lo ou apagá-lo.
- Quem entra com um código recebe uma mala só para si, feita com as suas necessidades.
- Os documentos são sempre pessoais; o Histórico também (cada um avalia a sua mala).

### Sessão

- **Rotas protegidas** (`src/app/_layout.tsx`): sem sessão → `(auth)`; sessão sem onboarding → `(onboarding)`; senão → `(tabs)`.

## Formulários

- `react-hook-form` + `zod`. Os esquemas (com as mensagens em PT) estão em `src/lib/validation.ts`; liga-os com `zodResolver` de `@/lib/zodResolver`.
- Campos de texto: `FormTextField` / `FormPasswordField` (`src/components/form/FormFields.tsx`). Outros campos: `Controller` do react-hook-form.
- Valida ao sair do campo (`mode: 'onTouched'`) e mostra o erro por baixo do campo; erros do "servidor" num `Banner`.
- Confirmações (eliminar, sair…): `ConfirmDialog`. Para "Anular" depois de uma ação: `useUi().showToast({ message, actionLabel: 'Anular', onAction })`. O `Alert` do React Native não funciona na web.

## Fotos de documentos

`src/lib/photos.ts` reduz a foto e copia-a para a pasta permanente da app (iOS/Android). Na web (`photos.web.ts`) fica guardada como data URI dentro do próprio documento.

## Animações

- **Avião:** `PlaneScene` (`src/components/animations/`) com `mode="takeoff"` (ao criar uma viagem) ou `mode="landing"` (ecrã de boas-vindas e depois de "Como correu?"). Vê as duas em Perfil → Ver componentes (dev).
- **Transições:** ecrãs deslizam da direita; criar (viagem, evento, documento) sobe de baixo; mudar de separador desliza; passos do assistente e meses do calendário entram do lado para onde vais.
- **Micro-animações:** `PressableScale` (botões, cartões, chips encolhem ao tocar), `ProgressBar`/`StepProgress` enchem suavemente, `FadeInView` faz os cartões entrarem em cascata, as linhas da mala deslizam quando mudam de lugar.
- Tudo respeita "Reduzir movimento" do sistema (o Reanimated faz isso por defeito; o avião salta para o fim).
- Com o React Compiler, usa `.get()`/`.set()` nos shared values do Reanimated (não `.value`).

## iPhone nativo (Liquid Glass)

- No iOS 26 a barra de separadores é a nativa (`NativeTabs`, em `(tabs)/_layout.tsx`); a web usa `(tabs)/_layout.web.tsx`.
- `useGlass()` (`@/lib/glass`) decide se um componente se desenha em vidro: iOS 26 **e** "Reduzir transparência" desligado. `Button`, `IconButton` (variante `glass`), `Fab` e `BottomSheet` já tratam disto; no resto (web, Android, iOS antigo) usam o estilo sólido "chunky".
- Não uses `isInteractive` no `GlassView` dentro de botões: o vidro fica com o toque e o botão nunca recebe o `onPress`.
- Confirmações e menus: `confirm()` / `showActions()` (`@/lib/dialogs`). No telemóvel são o alerta e o menu nativos; na web desenha-os o `DialogHost`.
- No Expo Go, abre o projeto com `?__expo_disable_fab=1` no link para esconder o botão de ferramentas do Expo Go. Se a atualização a quente não aplicar uma alteração, fecha e reabre a app.

## Regras rápidas

- Seletores do Zustand devolvem valores estáveis: `useData((s) => s.packing)` e filtra fora. Um seletor que cria um array novo (`s.packing.filter(...)`) entra em ciclo infinito.
- Para voltar atrás usa `goBack()` (`@/lib/navigation`): funciona mesmo sem histórico (link direto, refresh na web).
- Texto opcional dentro de JSX: `{!!texto && …}` (não `{texto && …}`): um texto vazio dentro de uma `View` dá erro no telemóvel.
- Junta classes com `cn()` (`@/lib/cn`): resolve conflitos (`cn('text-ink', 'text-danger')` → vence a última).
- Usa sempre `Text` de `@/components/ui` (não o do React Native), para as fontes ficarem certas.
- Texto laranja → `text-ember-text` (`ember` só para ícones e formas grandes: o contraste não chega para texto).
- Botões só com ícone → `IconButton` com `accessibilityLabel`.
- As classes do NativeWind não chegam às views do Reanimated (`Animated.View`): põe o estilo numa `View` lá dentro.
- Uma ação nova no servidor: acrescenta-a em `src/server/actions.ts` (com o esquema em `schemas.ts` e a verificação de permissões), um teste em `src/server/__tests__/` e o método no store. O tipo do `rpc()` vem daí automaticamente.
- Na web, um botão não pode ter outro botão lá dentro (dá erro): um `Card` com `onPress` não leva `Button`s.
