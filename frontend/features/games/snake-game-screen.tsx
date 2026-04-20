import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MobileScreen } from '@/shared/ui/mobile-screen';
import { PageHeader } from '@/shared/ui/page-header';
import { SurfaceCard } from '@/shared/ui/surface-card';

type GameModeId = 'classic' | 'endless' | 'stage';
type GameStatus = 'ready' | 'running' | 'paused' | 'crashed' | 'cleared' | 'victory';
type CrashReason = 'wall' | 'self' | 'obstacle' | 'timer';
type Direction = 'up' | 'down' | 'left' | 'right';
type FoodKind = 'apple' | 'gold';
type SkinId = 'classic' | 'neon' | 'candy';
type Position = {
  x: number;
  y: number;
};
type SnakeFood = {
  kind: FoodKind;
  position: Position;
};
type SnakeGameState = {
  crashReason: CrashReason | null;
  direction: Direction;
  food: SnakeFood;
  foodsEaten: number;
  gridSize: number;
  obstacles: Position[];
  pendingGrowth: number;
  score: number;
  snake: Position[];
  status: GameStatus;
  survivalSeconds: number;
  boostActive: boolean;
  nextDirection: Direction | null;
  timeRemaining: number | null;
};
type SnakeSkin = {
  accent: string;
  board: string;
  boardGlow: string;
  grid: string;
  head: string;
  track: string;
  bodyPrimary: string;
  bodySecondary: string;
};
type StageLevel = {
  badge: string;
  goal: number;
  gridSize: number;
  id: string;
  name: string;
  speedMs: number;
  timeLimitSeconds: number;
  summary: string;
  createObstacles: (gridSize: number) => Position[];
};
type ModeDefinition = {
  id: GameModeId;
  label: string;
  summary: string;
  tagline: string;
};
type PadIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const DIRECTIONS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const KEYBOARD_DIRECTION_MAP: Record<string, Direction> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
};

const FOOD_LIBRARY: Record<FoodKind, { growth: number; label: string; score: number }> = {
  apple: {
    growth: 1,
    label: '苹果 +10 分',
    score: 10,
  },
  gold: {
    growth: 2,
    label: '金苹果 +30 分',
    score: 30,
  },
};

const MODE_DEFINITIONS: ModeDefinition[] = [
  {
    id: 'classic',
    label: '经典',
    tagline: '固定地图，节奏稳定',
    summary: '标准 18x18 地图，撞墙或撞自己就会结束，适合直接刷分。',
  },
  {
    id: 'endless',
    label: '无尽',
    tagline: '越吃越快，障碍递增',
    summary: '分数越高速度越快，每吃 4 个食物随机生成一块障碍。',
  },
  {
    id: 'stage',
    label: '闯关',
    tagline: '带目标和时间限制',
    summary: '完成每关目标才能推进，后面会加入障碍布局和更紧的时间窗。',
  },
];

const SNAKE_SKINS: Record<SkinId, SnakeSkin> = {
  classic: {
    accent: '#43d17d',
    board: '#0d1914',
    boardGlow: 'rgba(67,209,125,0.18)',
    grid: '#193126',
    head: '#eafff2',
    track: '#101f18',
    bodyPrimary: '#43d17d',
    bodySecondary: '#2d9f5d',
  },
  neon: {
    accent: '#55d8ff',
    board: '#081221',
    boardGlow: 'rgba(85,216,255,0.18)',
    grid: '#16304f',
    head: '#f4fbff',
    track: '#0d1a30',
    bodyPrimary: '#55d8ff',
    bodySecondary: '#28c1a7',
  },
  candy: {
    accent: '#ff6f91',
    board: '#241126',
    boardGlow: 'rgba(255,111,145,0.18)',
    grid: '#4b2748',
    head: '#fff2f7',
    track: '#2d1730',
    bodyPrimary: '#ff6f91',
    bodySecondary: '#ffbd59',
  },
};

const TERMINAL_STATUSES = new Set<GameStatus>(['crashed', 'cleared', 'victory']);
const sessionBestScores: Record<GameModeId, number> = {
  classic: 0,
  endless: 0,
  stage: 0,
};

const STAGE_LEVELS: StageLevel[] = [
  {
    id: 'warmup',
    name: '热身赛',
    badge: '新手友好',
    goal: 8,
    gridSize: 16,
    speedMs: 240,
    timeLimitSeconds: 75,
    summary: '吃到 8 个食物即可通关，没有障碍，先熟悉节奏。',
    createObstacles: () => [],
  },
  {
    id: 'corridor',
    name: '岩石回廊',
    badge: '中等难度',
    goal: 12,
    gridSize: 18,
    speedMs: 215,
    timeLimitSeconds: 70,
    summary: '左右各有一条岩石墙，中间留出狭窄通道，需要连续转向。',
    createObstacles: (gridSize) => {
      const obstacles: Position[] = [];
      const gapTop = Math.floor(gridSize / 2) - 1;
      const gapBottom = Math.floor(gridSize / 2) + 1;

      for (let y = 2; y < gridSize - 2; y += 1) {
        if (y < gapTop || y > gapBottom) {
          obstacles.push({ x: 4, y });
          obstacles.push({ x: gridSize - 5, y });
        }
      }

      return obstacles;
    },
  },
  {
    id: 'maze',
    name: '霓虹迷宫',
    badge: '高压局',
    goal: 16,
    gridSize: 18,
    speedMs: 185,
    timeLimitSeconds: 62,
    summary: '上下横墙加中心立柱，路线被压缩，必须提前预判转向。',
    createObstacles: (gridSize) => {
      const obstacles: Position[] = [];
      const mid = Math.floor(gridSize / 2);

      for (let x = 2; x < gridSize - 2; x += 1) {
        if (x !== mid) {
          obstacles.push({ x, y: 3 });
          obstacles.push({ x, y: gridSize - 4 });
        }
      }

      for (let y = 5; y < gridSize - 5; y += 1) {
        if (y !== mid - 1 && y !== mid && y !== mid + 1) {
          obstacles.push({ x: mid, y });
        }
      }

      return obstacles;
    },
  },
];

export function SnakeGameScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const [modeId, setModeId] = useState<GameModeId>('classic');
  const [stageIndex, setStageIndex] = useState(0);
  const [skinId, setSkinId] = useState<SkinId>('neon');
  const [bestScores, setBestScores] = useState<Record<GameModeId, number>>({
    ...sessionBestScores,
  });
  const [game, setGame] = useState<SnakeGameState>(() => createInitialGameState('classic', 0));
  const previousFoodsEatenRef = useRef(game.foodsEaten);
  const previousStatusRef = useRef<GameStatus>(game.status);
  const modeIdRef = useRef(modeId);
  const stageIndexRef = useRef(stageIndex);

  const activeSkin = SNAKE_SKINS[skinId];
  const activeStage = STAGE_LEVELS[stageIndex];
  const boardOuterSize = Math.min(width - 32, 364);
  const cellSize = Math.max(12, Math.floor(boardOuterSize / game.gridSize));
  const boardSize = cellSize * game.gridSize;
  const tickMs = getTickMs(game, modeId, stageIndex);
  const objectiveText = getObjectiveText(modeId, stageIndex, game);
  const statusText = getStatusText(game.status, game.crashReason, stageIndex);
  const keyboardHint =
    Platform.OS === 'web'
      ? '方向键 / WASD 转向，空格开始或暂停，Shift 冲刺，Enter 重开。'
      : '点击下方方向键控制移动，按住冲刺可短暂提速。';
  const primaryActionLabel = getPrimaryActionLabel(game.status);
  const bestScore = bestScores[modeId];

  useEffect(() => {
    modeIdRef.current = modeId;
    stageIndexRef.current = stageIndex;
  }, [modeId, stageIndex]);

  function queueDirection(nextDirection: Direction) {
    setGame((previousState) => {
      if (TERMINAL_STATUSES.has(previousState.status)) {
        return previousState;
      }

      const lockedDirection = previousState.nextDirection ?? previousState.direction;

      if (isOppositeDirection(lockedDirection, nextDirection)) {
        return previousState;
      }

      if (lockedDirection === nextDirection) {
        if (previousState.status === 'ready') {
          return {
            ...previousState,
            status: 'running',
          };
        }

        return previousState;
      }

      return {
        ...previousState,
        nextDirection: nextDirection,
        status: previousState.status === 'ready' ? 'running' : previousState.status,
      };
    });
  }

  function setBoostActive(active: boolean) {
    setGame((previousState) => {
      if (previousState.boostActive === active) {
        return previousState;
      }

      return {
        ...previousState,
        boostActive: active,
      };
    });
  }

  function advanceClock() {
    setGame((previousState) => {
      if (previousState.status !== 'running') {
        return previousState;
      }

      const nextSurvivalSeconds = previousState.survivalSeconds + 1;

      if (previousState.timeRemaining === null) {
        return {
          ...previousState,
          survivalSeconds: nextSurvivalSeconds,
        };
      }

      if (previousState.timeRemaining <= 1) {
        return {
          ...previousState,
          boostActive: false,
          crashReason: 'timer',
          status: 'crashed',
          survivalSeconds: nextSurvivalSeconds,
          timeRemaining: 0,
        };
      }

      return {
        ...previousState,
        survivalSeconds: nextSurvivalSeconds,
        timeRemaining: previousState.timeRemaining - 1,
      };
    });
  }

  function advanceTick() {
    setGame((previousState) =>
      computeNextFrame(previousState, modeIdRef.current, stageIndexRef.current),
    );
  }

  function handleKeyDown(event: KeyboardEvent) {
    const nextDirection = KEYBOARD_DIRECTION_MAP[event.key];

    if (nextDirection) {
      event.preventDefault();
      queueDirection(nextDirection);
      return;
    }

    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      handlePrimaryAction();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      restartGame();
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      setBoostActive(true);
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'Shift') {
      event.preventDefault();
      setBoostActive(false);
    }
  }

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event);
    const onKeyUp = (event: KeyboardEvent) => handleKeyUp(event);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (game.status !== 'running') {
      return;
    }

    const timer = setInterval(() => {
      advanceTick();
    }, tickMs);

    return () => {
      clearInterval(timer);
    };
  }, [game.status, tickMs]);

  useEffect(() => {
    if (game.status !== 'running') {
      return;
    }

    const timer = setInterval(() => {
      advanceClock();
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [game.status]);

  useEffect(() => {
    if (game.foodsEaten <= previousFoodsEatenRef.current || Platform.OS === 'web') {
      previousFoodsEatenRef.current = game.foodsEaten;
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    previousFoodsEatenRef.current = game.foodsEaten;
  }, [game.foodsEaten]);

  useEffect(() => {
    if (game.status === previousStatusRef.current || Platform.OS === 'web') {
      previousStatusRef.current = game.status;
      return;
    }

    if (game.status === 'crashed') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    if (game.status === 'cleared' || game.status === 'victory') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    previousStatusRef.current = game.status;
  }, [game.status]);

  useEffect(() => {
    if (!TERMINAL_STATUSES.has(game.status)) {
      return;
    }

    setBestScores((previousScores) => {
      const nextBest = Math.max(previousScores[modeId], game.score);

      if (nextBest === previousScores[modeId]) {
        return previousScores;
      }

      sessionBestScores[modeId] = nextBest;

      return {
        ...previousScores,
        [modeId]: nextBest,
      };
    });
  }, [game.score, game.status, modeId]);

  function restartGame(nextModeId = modeIdRef.current, nextStageIndex = stageIndexRef.current) {
    setGame(createInitialGameState(nextModeId, nextStageIndex));
  }

  function handlePrimaryAction() {
    const currentModeId = modeIdRef.current;
    const currentStageIndex = stageIndexRef.current;

    setGame((previousState) => {
      if (previousState.status === 'running') {
        return {
          ...previousState,
          boostActive: false,
          status: 'paused',
        };
      }

      if (previousState.status === 'paused' || previousState.status === 'ready') {
        return {
          ...previousState,
          status: 'running',
        };
      }

      return createInitialGameState(currentModeId, currentStageIndex);
    });
  }

  function handleModeChange(nextModeId: GameModeId) {
    startTransition(() => {
      setModeId(nextModeId);
      setStageIndex(0);
      setGame(createInitialGameState(nextModeId, 0));
    });
  }

  function handleStageChange(nextStageIndex: number) {
    startTransition(() => {
      setModeId('stage');
      setStageIndex(nextStageIndex);
      setGame(createInitialGameState('stage', nextStageIndex));
    });
  }

  function handleSkinChange(nextSkinId: SkinId) {
    startTransition(() => {
      setSkinId(nextSkinId);
    });
  }

  function handleNextStage() {
    if (stageIndex >= STAGE_LEVELS.length - 1) {
      handleStageChange(0);
      return;
    }

    handleStageChange(stageIndex + 1);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MobileScreen contentContainerStyle={styles.pageContent}>
        <PageHeader
          eyebrow="Hot Game"
          title="贪吃蛇大作战"
          subtitle="热门游戏区首个可玩模块。现在可以直接刷分、冲无尽、打三关闯关模式。"
          rightSlot={
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
            </Pressable>
          }
        />

        <SurfaceCard
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.hero,
              borderColor: 'transparent',
            },
          ]}>
          <View pointerEvents="none" style={styles.heroGlowWrap}>
            <View
              style={[
                styles.heroGlowLarge,
                {
                  backgroundColor: activeSkin.boardGlow,
                },
              ]}
            />
            <View
              style={[
                styles.heroGlowSmall,
                {
                  backgroundColor: `${activeSkin.accent}22`,
                },
              ]}
            />
          </View>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroBadge, { backgroundColor: `${activeSkin.accent}22` }]}>
              <ThemedText style={[styles.heroBadgeText, { color: '#ffffff' }]}>
                热门街机
              </ThemedText>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <ThemedText style={styles.heroBadgeText}>三种模式</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.heroTitle}>《贪吃蛇大作战》</ThemedText>
          <ThemedText style={styles.heroBody}>
            自动移动、即时转向、金苹果加成长、无尽障碍递增，再加一个可以随时切换的蛇皮肤库。
          </ThemedText>
          <View style={styles.heroMetrics}>
            <MetricPill label="当前模式" value={getModeLabel(modeId)} />
            <MetricPill label="会话最高" value={`${bestScore}`} />
            <MetricPill label="当前皮肤" value={getSkinLabel(skinId)} />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.selectorCard}>
          <View style={styles.selectorSection}>
            <ThemedText style={styles.selectorTitle}>模式选择</ThemedText>
            <View style={styles.optionRow}>
              {MODE_DEFINITIONS.map((mode) => (
                <OptionChip
                  key={mode.id}
                  active={mode.id === modeId}
                  accentColor={activeSkin.accent}
                  label={mode.label}
                  meta={mode.tagline}
                  onPress={() => handleModeChange(mode.id)}
                />
              ))}
            </View>
            <ThemedText style={[styles.selectorDescription, { color: colors.mutedText }]}>
              {MODE_DEFINITIONS.find((mode) => mode.id === modeId)?.summary}
            </ThemedText>
          </View>

          {modeId === 'stage' ? (
            <View style={styles.selectorSection}>
              <View style={styles.inlineHeader}>
                <ThemedText style={styles.selectorTitle}>关卡选择</ThemedText>
                <ThemedText style={[styles.inlineMeta, { color: colors.mutedText }]}>
                  共 {STAGE_LEVELS.length} 关
                </ThemedText>
              </View>
              <View style={styles.optionRow}>
                {STAGE_LEVELS.map((stage, index) => (
                  <OptionChip
                    key={stage.id}
                    active={index === stageIndex}
                    accentColor={activeSkin.accent}
                    label={`第 ${index + 1} 关`}
                    meta={stage.name}
                    onPress={() => handleStageChange(index)}
                  />
                ))}
              </View>
              <ThemedText style={[styles.selectorDescription, { color: colors.mutedText }]}>
                {activeStage.summary}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.selectorSection}>
            <ThemedText style={styles.selectorTitle}>蛇皮肤</ThemedText>
            <View style={styles.optionRow}>
              {(Object.keys(SNAKE_SKINS) as SkinId[]).map((candidateSkinId) => (
                <OptionChip
                  key={candidateSkinId}
                  active={candidateSkinId === skinId}
                  accentColor={SNAKE_SKINS[candidateSkinId].accent}
                  label={getSkinLabel(candidateSkinId)}
                  meta="免费"
                  onPress={() => handleSkinChange(candidateSkinId)}
                />
              ))}
            </View>
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.arenaCard}>
          <View style={styles.hudTopRow}>
            <View>
              <ThemedText style={styles.hudTitle}>{getModeLabel(modeId)}模式</ThemedText>
              <ThemedText style={[styles.hudSubtitle, { color: colors.mutedText }]}>
                {objectiveText}
              </ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${activeSkin.accent}20` }]}>
              <ThemedText style={[styles.statusBadgeText, { color: activeSkin.accent }]}>
                {statusText}
              </ThemedText>
            </View>
          </View>

          <View style={styles.hudMetricsRow}>
            <StatCard label="分数" value={`${game.score}`} accentColor={activeSkin.accent} />
            <StatCard label="长度" value={`${game.snake.length}`} accentColor={activeSkin.accent} />
            <StatCard
              label="存活"
              value={`${game.survivalSeconds}s`}
              accentColor={activeSkin.accent}
            />
            <StatCard
              label={modeId === 'stage' ? '剩余时间' : '速度'}
              value={modeId === 'stage' ? `${game.timeRemaining ?? 0}s` : `${formatSpeed(tickMs)}`}
              accentColor={activeSkin.accent}
            />
          </View>

          <View
            style={[
              styles.boardShell,
              {
                backgroundColor: activeSkin.track,
                borderColor: `${activeSkin.accent}25`,
              },
            ]}>
            <SnakeBoard
              boardSize={boardSize}
              cellSize={cellSize}
              food={game.food}
              gridSize={game.gridSize}
              obstacles={game.obstacles}
              skin={activeSkin}
              snake={game.snake}
              status={game.status}
              statusText={statusText}
              subtitle={keyboardHint}
            />
          </View>

          <View style={styles.legendRow}>
            <LegendPill color="#ff6b6b" label={FOOD_LIBRARY.apple.label} />
            <LegendPill color="#ffcf5c" label={FOOD_LIBRARY.gold.label} />
            <LegendPill color="#65748b" label={`障碍 ${game.obstacles.length}`} />
          </View>

          <ControlPad
            activeColor={activeSkin.accent}
            boostActive={game.boostActive}
            onBoostPressIn={() => setBoostActive(true)}
            onBoostPressOut={() => setBoostActive(false)}
            onDirectionPress={queueDirection}
            onPrimaryActionPress={handlePrimaryAction}
            onRestartPress={() => restartGame(modeId, stageIndex)}
            primaryActionLabel={primaryActionLabel}
          />

          {game.status === 'cleared' ? (
            <Pressable
              onPress={handleNextStage}
              style={[styles.nextStageButton, { backgroundColor: activeSkin.accent }]}>
              <ThemedText style={styles.nextStageButtonText}>
                {stageIndex < STAGE_LEVELS.length - 1 ? '进入下一关' : '回到第一关'}
              </ThemedText>
            </Pressable>
          ) : null}
        </SurfaceCard>

        <View style={styles.infoGrid}>
          <SurfaceCard style={styles.infoCard}>
            <View style={styles.inlineHeader}>
              <ThemedText style={styles.infoTitle}>本局规则</ThemedText>
              <ThemedText style={[styles.inlineMeta, { color: colors.mutedText }]}>
                即开即玩
              </ThemedText>
            </View>
            <InfoLine text="蛇会自动移动，只能改变前进方向，不能直接 180 度掉头。" />
            <InfoLine text="经典模式固定节奏；无尽模式会提速并生成障碍；闯关模式带目标和时间限制。" />
            <InfoLine text="撞墙、撞自己、撞障碍都会结束。金苹果会额外加分并多长 2 节。" />
          </SurfaceCard>

          <SurfaceCard style={styles.infoCard}>
            <View style={styles.inlineHeader}>
              <ThemedText style={styles.infoTitle}>操作说明</ThemedText>
              <ThemedText style={[styles.inlineMeta, { color: colors.mutedText }]}>
                手感优先
              </ThemedText>
            </View>
            <InfoLine text="PC：WASD / 方向键转向，空格开始或暂停，Shift 冲刺。" />
            <InfoLine text="移动端：使用方向键区域控制，长按“冲刺”临时加速。" />
            <InfoLine text="想继续扩展时，可以在这里继续接护盾、磁铁、皮肤解锁和成就系统。" />
          </SurfaceCard>
        </View>
      </MobileScreen>
    </>
  );
}

function createInitialGameState(modeId: GameModeId, stageIndex: number): SnakeGameState {
  const { gridSize, obstacles, timeRemaining } = getBoardSetup(modeId, stageIndex);
  const snake = createInitialSnake(gridSize);
  const food = createFood(gridSize, snake, obstacles);

  if (!food) {
    throw new Error('Unable to place initial food on the board.');
  }

  return {
    crashReason: null,
    direction: 'right',
    food,
    foodsEaten: 0,
    gridSize,
    obstacles,
    pendingGrowth: 0,
    score: 0,
    snake,
    status: 'ready',
    survivalSeconds: 0,
    boostActive: false,
    nextDirection: null,
    timeRemaining,
  };
}

function computeNextFrame(
  previousState: SnakeGameState,
  modeId: GameModeId,
  stageIndex: number,
): SnakeGameState {
  if (previousState.status !== 'running') {
    return previousState;
  }

  const nextDirection = previousState.nextDirection ?? previousState.direction;
  const movement = DIRECTIONS[nextDirection];
  const nextHead = {
    x: previousState.snake[0].x + movement.x,
    y: previousState.snake[0].y + movement.y,
  };

  if (!isInsideBoard(nextHead, previousState.gridSize)) {
    return {
      ...previousState,
      boostActive: false,
      crashReason: 'wall',
      nextDirection: null,
      status: 'crashed',
    };
  }

  const ateFood = isSamePosition(nextHead, previousState.food.position);
  const growthGain = ateFood ? FOOD_LIBRARY[previousState.food.kind].growth : 0;
  const willTrimTail = previousState.pendingGrowth === 0 && growthGain === 0;
  const selfCollisionTarget = willTrimTail
    ? previousState.snake.slice(0, -1)
    : previousState.snake;

  if (containsPosition(selfCollisionTarget, nextHead)) {
    return {
      ...previousState,
      boostActive: false,
      crashReason: 'self',
      nextDirection: null,
      status: 'crashed',
    };
  }

  if (containsPosition(previousState.obstacles, nextHead)) {
    return {
      ...previousState,
      boostActive: false,
      crashReason: 'obstacle',
      nextDirection: null,
      status: 'crashed',
    };
  }

  const nextSnake = [nextHead, ...previousState.snake];
  let pendingGrowth = previousState.pendingGrowth;

  if (growthGain > 0) {
    pendingGrowth += growthGain;
  }

  if (pendingGrowth > 0) {
    pendingGrowth -= 1;
  } else {
    nextSnake.pop();
  }

  let score = previousState.score;
  let foodsEaten = previousState.foodsEaten;
  let obstacles = previousState.obstacles;
  let food = previousState.food;

  if (ateFood) {
    score += FOOD_LIBRARY[previousState.food.kind].score;
    foodsEaten += 1;

    if (modeId === 'endless' && foodsEaten % 4 === 0 && previousState.obstacles.length < 18) {
      const occupied = buildOccupiedSet(nextSnake, previousState.obstacles);
      const obstacle = pickRandomOpenCell(previousState.gridSize, occupied, [nextHead]);

      if (obstacle) {
        obstacles = [...previousState.obstacles, obstacle];
      }
    }

    food = createFood(previousState.gridSize, nextSnake, obstacles) ?? previousState.food;
  }

  const nextState: SnakeGameState = {
    ...previousState,
    crashReason: null,
    direction: nextDirection,
    food,
    foodsEaten,
    obstacles,
    pendingGrowth,
    score,
    snake: nextSnake,
    boostActive: previousState.boostActive,
    nextDirection: null,
  };

  if (modeId === 'stage' && foodsEaten >= STAGE_LEVELS[stageIndex].goal) {
    return {
      ...nextState,
      boostActive: false,
      status: stageIndex >= STAGE_LEVELS.length - 1 ? 'victory' : 'cleared',
    };
  }

  return nextState;
}

function getBoardSetup(modeId: GameModeId, stageIndex: number) {
  if (modeId === 'classic') {
    return {
      gridSize: 18,
      obstacles: [] as Position[],
      timeRemaining: null,
    };
  }

  if (modeId === 'endless') {
    return {
      gridSize: 20,
      obstacles: [] as Position[],
      timeRemaining: null,
    };
  }

  const stage = STAGE_LEVELS[stageIndex];

  return {
    gridSize: stage.gridSize,
    obstacles: stage.createObstacles(stage.gridSize),
    timeRemaining: stage.timeLimitSeconds,
  };
}

function createInitialSnake(gridSize: number): Position[] {
  const startX = Math.floor(gridSize / 2) - 1;
  const startY = Math.floor(gridSize / 2);

  return [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
}

function createFood(gridSize: number, snake: Position[], obstacles: Position[]) {
  const occupied = buildOccupiedSet(snake, obstacles);
  const position = pickRandomOpenCell(gridSize, occupied);

  if (!position) {
    return null;
  }

  return {
    kind: Math.random() < 0.22 ? 'gold' : 'apple',
    position,
  } satisfies SnakeFood;
}

function buildOccupiedSet(...groups: Position[][]) {
  const occupied = new Set<string>();

  groups.forEach((group) => {
    group.forEach((position) => {
      occupied.add(toPositionKey(position));
    });
  });

  return occupied;
}

function pickRandomOpenCell(
  gridSize: number,
  occupied: Set<string>,
  avoidPositions: Position[] = [],
) {
  const candidates: Position[] = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const position = { x, y };

      if (occupied.has(toPositionKey(position))) {
        continue;
      }

      if (
        avoidPositions.some((avoidPosition) => getManhattanDistance(position, avoidPosition) <= 2)
      ) {
        continue;
      }

      candidates.push(position);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function containsPosition(positions: Position[], target: Position) {
  return positions.some((position) => isSamePosition(position, target));
}

function isSamePosition(left: Position, right: Position) {
  return left.x === right.x && left.y === right.y;
}

function isInsideBoard(position: Position, gridSize: number) {
  return position.x >= 0 && position.x < gridSize && position.y >= 0 && position.y < gridSize;
}

function toPositionKey(position: Position) {
  return `${position.x}:${position.y}`;
}

function getManhattanDistance(left: Position, right: Position) {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function isOppositeDirection(currentDirection: Direction, nextDirection: Direction) {
  return (
    (currentDirection === 'up' && nextDirection === 'down') ||
    (currentDirection === 'down' && nextDirection === 'up') ||
    (currentDirection === 'left' && nextDirection === 'right') ||
    (currentDirection === 'right' && nextDirection === 'left')
  );
}

function getTickMs(game: SnakeGameState, modeId: GameModeId, stageIndex: number) {
  let baseMs = 220;

  if (modeId === 'endless') {
    if (game.score >= 600) {
      baseMs = 145;
    } else if (game.score >= 300) {
      baseMs = 175;
    } else if (game.score >= 100) {
      baseMs = 205;
    } else {
      baseMs = 240;
    }
  }

  if (modeId === 'stage') {
    baseMs = STAGE_LEVELS[stageIndex].speedMs;
  }

  if (game.boostActive) {
    return Math.max(90, Math.round(baseMs * 0.72));
  }

  return baseMs;
}

function getObjectiveText(modeId: GameModeId, stageIndex: number, game: SnakeGameState) {
  if (modeId === 'classic') {
    return '固定节奏地图，目标是刷更高分和更长长度。';
  }

  if (modeId === 'endless') {
    return '分数越高速度越快，每吃 4 个食物会新增一个障碍。';
  }

  const stage = STAGE_LEVELS[stageIndex];

  return `第 ${stageIndex + 1} 关 ${stage.name}：已吃 ${game.foodsEaten}/${stage.goal}，剩余 ${
    game.timeRemaining ?? 0
  } 秒。`;
}

function getStatusText(
  status: GameStatus,
  crashReason: CrashReason | null,
  stageIndex: number,
) {
  if (status === 'ready') {
    return '待开始';
  }

  if (status === 'running') {
    return '进行中';
  }

  if (status === 'paused') {
    return '已暂停';
  }

  if (status === 'cleared') {
    return `第 ${stageIndex + 1} 关完成`;
  }

  if (status === 'victory') {
    return '全部通关';
  }

  if (crashReason === 'wall') {
    return '撞墙失败';
  }

  if (crashReason === 'self') {
    return '撞到自己';
  }

  if (crashReason === 'obstacle') {
    return '撞到障碍';
  }

  if (crashReason === 'timer') {
    return '时间耗尽';
  }

  return '本局结束';
}

function getPrimaryActionLabel(status: GameStatus) {
  if (status === 'running') {
    return '暂停';
  }

  if (status === 'paused') {
    return '继续';
  }

  if (status === 'ready') {
    return '开始';
  }

  return '再来一局';
}

function getModeLabel(modeId: GameModeId) {
  return MODE_DEFINITIONS.find((mode) => mode.id === modeId)?.label ?? '经典';
}

function getSkinLabel(skinId: SkinId) {
  if (skinId === 'classic') {
    return '经典绿';
  }

  if (skinId === 'neon') {
    return '赛博霓虹';
  }

  return '糖果蛇';
}

function formatSpeed(tickMs: number) {
  return `${(1000 / tickMs).toFixed(1)}格/秒`;
}

function SnakeBoard({
  boardSize,
  cellSize,
  food,
  gridSize,
  obstacles,
  skin,
  snake,
  status,
  statusText,
  subtitle,
}: {
  boardSize: number;
  cellSize: number;
  food: SnakeFood;
  gridSize: number;
  obstacles: Position[];
  skin: SnakeSkin;
  snake: Position[];
  status: GameStatus;
  statusText: string;
  subtitle: string;
}) {
  const snakeIndices = new Map<string, number>();
  const obstacleKeys = new Set<string>(obstacles.map((position) => toPositionKey(position)));
  const foodKey = toPositionKey(food.position);

  snake.forEach((segment, index) => {
    snakeIndices.set(toPositionKey(segment), index);
  });

  return (
    <View
      style={[
        styles.board,
        {
          backgroundColor: skin.board,
          height: boardSize,
          width: boardSize,
        },
      ]}>
      {Array.from({ length: gridSize }, (_, rowIndex) => (
        <View key={rowIndex} style={styles.boardRow}>
          {Array.from({ length: gridSize }, (_, columnIndex) => {
            const positionKey = `${columnIndex}:${rowIndex}`;
            const snakeIndex = snakeIndices.get(positionKey);
            const isFood = positionKey === foodKey;
            const isObstacle = obstacleKeys.has(positionKey);
            const isHead = snakeIndex === 0;
            let backgroundColor = 'transparent';

            if (isObstacle) {
              backgroundColor = '#56657a';
            }

            if (isFood) {
              backgroundColor = food.kind === 'gold' ? '#ffcf5c' : '#ff6b6b';
            }

            if (snakeIndex !== undefined) {
              backgroundColor =
                snakeIndex === 0
                  ? skin.head
                  : snakeIndex % 2 === 0
                    ? skin.bodyPrimary
                    : skin.bodySecondary;
            }

            return (
              <View
                key={positionKey}
                style={[
                  styles.boardCell,
                  {
                    backgroundColor,
                    borderColor: skin.grid,
                    borderRadius: isHead ? Math.max(5, cellSize / 2.8) : Math.max(4, cellSize / 4),
                    height: cellSize,
                    width: cellSize,
                  },
                ]}
              />
            );
          })}
        </View>
      ))}

      {status !== 'running' ? (
        <View style={styles.boardOverlay}>
          <ThemedText style={styles.boardOverlayTitle}>{statusText}</ThemedText>
          <ThemedText style={styles.boardOverlayBody}>{subtitle}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
      <ThemedText style={styles.metricPillLabel}>{label}</ThemedText>
      <ThemedText style={styles.metricPillValue}>{value}</ThemedText>
    </View>
  );
}

function OptionChip({
  active,
  accentColor,
  label,
  meta,
  onPress,
}: {
  active: boolean;
  accentColor: string;
  label: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionChip,
        {
          backgroundColor: active ? `${accentColor}16` : 'transparent',
          borderColor: active ? accentColor : 'rgba(120,134,163,0.2)',
        },
      ]}>
      <ThemedText style={styles.optionChipLabel}>{label}</ThemedText>
      <ThemedText style={styles.optionChipMeta}>{meta}</ThemedText>
    </Pressable>
  );
}

function StatCard({
  accentColor,
  label,
  value,
}: {
  accentColor: string;
  label: string;
  value: string;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          borderColor: `${accentColor}20`,
        },
      ]}>
      <ThemedText style={styles.statCardLabel}>{label}</ThemedText>
      <ThemedText style={styles.statCardValue}>{value}</ThemedText>
    </View>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendPill}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText style={styles.legendLabel}>{label}</ThemedText>
    </View>
  );
}

function InfoLine({ text }: { text: string }) {
  return (
    <View style={styles.infoLine}>
      <View style={styles.infoLineDot} />
      <ThemedText style={styles.infoLineText}>{text}</ThemedText>
    </View>
  );
}

function ControlPad({
  activeColor,
  boostActive,
  onBoostPressIn,
  onBoostPressOut,
  onDirectionPress,
  onPrimaryActionPress,
  onRestartPress,
  primaryActionLabel,
}: {
  activeColor: string;
  boostActive: boolean;
  onBoostPressIn: () => void;
  onBoostPressOut: () => void;
  onDirectionPress: (direction: Direction) => void;
  onPrimaryActionPress: () => void;
  onRestartPress: () => void;
  primaryActionLabel: string;
}) {
  return (
    <View style={styles.controlsWrap}>
      <View style={styles.padGrid}>
        <View style={styles.padRow}>
          <PadButton
            activeColor={activeColor}
            icon="chevron-up"
            onPress={() => onDirectionPress('up')}
          />
        </View>
        <View style={styles.padRow}>
          <PadButton
            activeColor={activeColor}
            icon="chevron-left"
            onPress={() => onDirectionPress('left')}
          />
          <PadButton
            activeColor={activeColor}
            icon="chevron-right"
            onPress={() => onDirectionPress('right')}
          />
        </View>
        <View style={styles.padRow}>
          <PadButton
            activeColor={activeColor}
            icon="chevron-down"
            onPress={() => onDirectionPress('down')}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <ActionButton activeColor={activeColor} label={primaryActionLabel} onPress={onPrimaryActionPress} />
        <ActionButton activeColor={activeColor} label="重开" onPress={onRestartPress} variant="secondary" />
        <Pressable
          onPressIn={onBoostPressIn}
          onPressOut={onBoostPressOut}
          style={[
            styles.actionButton,
            {
              backgroundColor: boostActive ? activeColor : 'transparent',
              borderColor: `${activeColor}33`,
            },
          ]}>
          <ThemedText
            style={[
              styles.actionButtonText,
              {
                color: boostActive ? '#ffffff' : activeColor,
              },
            ]}>
            冲刺
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function ActionButton({
  activeColor,
  label,
  onPress,
  variant = 'primary',
}: {
  activeColor: string;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        {
          backgroundColor: isPrimary ? activeColor : 'transparent',
          borderColor: `${activeColor}33`,
        },
      ]}>
      <ThemedText
        style={[
          styles.actionButtonText,
          {
            color: isPrimary ? '#ffffff' : activeColor,
          },
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function PadButton({
  activeColor,
  icon,
  onPress,
}: {
  activeColor: string;
  icon: PadIconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.padButton,
        {
          backgroundColor: `${activeColor}12`,
          borderColor: `${activeColor}2c`,
        },
      ]}>
      <MaterialCommunityIcons color={activeColor} name={icon} size={28} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingTop: 14,
  },
  closeButton: {
    borderRadius: 999,
    padding: 8,
  },
  heroCard: {
    gap: 14,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  heroGlowWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGlowLarge: {
    borderRadius: 999,
    height: 190,
    position: 'absolute',
    right: -24,
    top: -40,
    width: 190,
  },
  heroGlowSmall: {
    borderRadius: 999,
    bottom: -44,
    height: 150,
    left: -20,
    position: 'absolute',
    width: 150,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 22,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    gap: 4,
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricPillLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '700',
  },
  metricPillValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  selectorCard: {
    gap: 18,
    padding: 18,
  },
  selectorSection: {
    gap: 10,
  },
  selectorTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  selectorDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  inlineHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inlineMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    minWidth: 104,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionChipLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionChipMeta: {
    fontSize: 11,
    opacity: 0.72,
  },
  arenaCard: {
    gap: 16,
    padding: 18,
  },
  hudTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  hudTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  hudSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    maxWidth: 250,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  hudMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statCardLabel: {
    fontSize: 11,
    opacity: 0.72,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  boardShell: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    padding: 12,
  },
  board: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  boardRow: {
    flexDirection: 'row',
  },
  boardCell: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  boardOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(6, 10, 18, 0.62)',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  boardOverlayTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  boardOverlayBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  legendDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  controlsWrap: {
    gap: 14,
  },
  padGrid: {
    alignItems: 'center',
    gap: 10,
  },
  padRow: {
    flexDirection: 'row',
    gap: 10,
  },
  padButton: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  nextStageButton: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nextStageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  infoGrid: {
    gap: 12,
  },
  infoCard: {
    gap: 12,
    padding: 18,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  infoLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  infoLineDot: {
    backgroundColor: '#4b6bff',
    borderRadius: 999,
    height: 8,
    marginTop: 8,
    width: 8,
  },
  infoLineText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
});
