# Pack&Sun: app

App móvel do projeto de IPM (Grupo 03). Expo + React Native + TypeScript, estilos com NativeWind (Tailwind).
Plano completo: [`../docs/PLANO_DESENVOLVIMENTO.md`](../docs/PLANO_DESENVOLVIMENTO.md).

## Correr

```bash
cd app
npm install
npx expo start        # QR code para abrir no Expo Go (telemóvel) · "w" abre no browser
```

Antes de fazer commit:

```bash
npm run typecheck
npm run lint
npm test             # testes unitários (motor da mala, sugestões, documentos, calendário)
```

## Onde está o quê

| Pasta | Conteúdo |
|---|---|
| `src/app/` | Ecrãs (Expo Router: cada ficheiro é uma rota). `(tabs)/` = Viagens · Calendário · Perfil |
| `src/app/dev/kit.tsx` | Catálogo dos componentes base (só em desenvolvimento, via Perfil) |
| `src/components/ui/` | Componentes base: `Button`, `Card`, `Chip`, `Toggle`, `Stepper`, `ProgressBar`, `SegmentedControl`, `TextField`, `DateField`, `BottomSheet`, `Header`, `Screen`, `EmptyState`, `Text`, `IconButton` |
| `src/data/types.ts` | Modelo de dados (User, Trip, PackingItem, TripEvent, …) |
| `src/data/repositories/` | Acesso a dados. `types.ts` = interfaces; `local/` = implementação atual (AsyncStorage/localStorage) |
| `src/data/seed.ts` | Dados de demonstração (Ana: Milão, Genebra, Sevilha, Londres), com datas relativas a hoje |
| `src/lib/calendar.ts` | Datas do calendário: semanas do mês, barras das viagens, colunas de eventos sobrepostos, etiquetas em PT |
| `src/components/calendar/` · `events/` | Grelha do mês, faixa da semana, timeline do dia e formulário de eventos |
| `src/domain/` | Regras do produto, sem UI: gerar a mala (`packing.ts`), sugestões de eventos, avisos de documentos, países |
| `src/services/` | APIs externas: meteorologia e pesquisa de cidades (Open-Meteo, sem chave), com cache e modo offline |
| `src/data/selectors.ts` | Cálculos reutilizáveis: viagem atual, estado da viagem, progresso da mala, … |
| `src/stores/` | Estado da app (Zustand): `useSession` (sessão) e `useData` (dados do utilizador) |
| `src/theme/colors.js` | Paleta (cores do logótipo). O `tailwind.config.js` lê daqui: usa `bg-sun`, `text-ember-text`, … |
| `assets/images/` | Logótipo (fundo transparente) e ícones da app |

## Dados e sessão

- **Conta demo:** `ana@packsun.pt` / `ana12345` (em desenvolvimento há um botão "Entrar com a conta demo" no login).
- **Repor tudo:** Perfil → "Repor dados de demonstração (dev)".
- **Os ecrãs nunca falam com o armazenamento:** leem de `useData` / `useSession` e chamam as ações destes stores.
- **Trocar de base de dados:** cria `src/data/repositories/<backend>/` que implemente `Repositories` e muda uma linha em `src/data/repositories/index.ts`.
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

## Regras rápidas

- Seletores do Zustand devolvem valores estáveis: `useData((s) => s.packing)` e filtra fora. Um seletor que cria um array novo (`s.packing.filter(...)`) entra em ciclo infinito.
- Para voltar atrás usa `goBack()` (`@/lib/navigation`): funciona mesmo sem histórico (link direto, refresh na web).
- Junta classes com `cn()` (`@/lib/cn`): resolve conflitos (`cn('text-ink', 'text-danger')` → vence a última).
- Usa sempre `Text` de `@/components/ui` (não o do React Native), para as fontes ficarem certas.
- Texto laranja → `text-ember-text` (`ember` só para ícones e formas grandes: o contraste não chega para texto).
- Botões só com ícone → `IconButton` com `accessibilityLabel`.
- As classes do NativeWind não chegam às views do Reanimated (`Animated.View`): põe o estilo numa `View` lá dentro.
