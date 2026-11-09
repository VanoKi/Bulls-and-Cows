import { countPossibleSecrets } from './logic/countPossibleSecrets';
import { createDigitValidator } from './logic/digits';
import { evaluateGuess } from './logic/evaluateGuess';
import { isValidGuess } from './logic/isValidGuess';
import { generateSecret } from './logic/secrets';

type BaseOption = {
  label: string;
  value: number;
};

type RoundSettings = {
  base: number;
  length: number;
};

type GuessRecord = {
  guess: string;
  bulls: number;
  cows: number;
};

type ScoreRecord = {
  base: number;
  length: number;
  attempts: number;
  elapsedMs: number;
};

type GameState = {
  settings: RoundSettings;
  secret: string;
  startedAt: number;
  guesses: GuessRecord[];
  status: 'playing' | 'won';
};

const BASE_OPTIONS: BaseOption[] = [
  { label: 'Двоичная (bin)', value: 2 },
  { label: 'Восьмеричная (oct)', value: 8 },
  { label: 'Десятичная (dec)', value: 10 },
  { label: 'Шестнадцатеричная (hex)', value: 16 },
];

const SCORE_STORAGE_KEY = 'bulls-and-cows:records';
const MAX_SCORES_PER_SETTINGS = 5;

let selectedSettings: RoundSettings = { base: 10, length: 4 };
let game: GameState | undefined;
let timerId: number | undefined;

const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
};

const createOption = (label: string, value: string): HTMLOptionElement => {
  const option = createElement('option');
  option.value = value;
  option.textContent = label;

  return option;
};

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
};

const formatCount = (
  value: number,
  forms: [singular: string, few: string, many: string],
): string => {
  const lastTwoDigits = value % 100;
  const lastDigit = value % 10;
  const formIndex =
    lastTwoDigits >= 11 && lastTwoDigits <= 14
      ? 2
      : lastDigit === 1
        ? 0
        : lastDigit >= 2 && lastDigit <= 4
          ? 1
          : 2;

  return `${value} ${forms[formIndex]}`;
};

const isScoreRecord = (value: unknown): value is ScoreRecord => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Partial<ScoreRecord>;

  return (
    Number.isInteger(record.base) &&
    Number.isInteger(record.length) &&
    Number.isInteger(record.attempts) &&
    typeof record.elapsedMs === 'number' &&
    Number.isFinite(record.elapsedMs) &&
    (record.base ?? 0) >= 2 &&
    (record.base ?? 0) <= 16 &&
    (record.length ?? 0) >= 2 &&
    (record.length ?? 0) <= 6 &&
    (record.length ?? 0) <= (record.base ?? 0) &&
    (record.attempts ?? 0) > 0 &&
    record.elapsedMs >= 0
  );
};

const loadScoreRecords = (): ScoreRecord[] => {
  try {
    const storedValue = window.localStorage.getItem(SCORE_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? parsedValue.filter(isScoreRecord) : [];
  } catch {
    return [];
  }
};

const compareScores = (first: ScoreRecord, second: ScoreRecord): number =>
  first.attempts - second.attempts || first.elapsedMs - second.elapsedMs;

const saveScoreRecord = (newRecord: ScoreRecord): boolean => {
  try {
    const currentRecords = loadScoreRecords();
    const matchingSettings = currentRecords
      .filter(
        (record) =>
          record.base === newRecord.base && record.length === newRecord.length,
      )
      .concat(newRecord)
      .sort(compareScores)
      .slice(0, MAX_SCORES_PER_SETTINGS);
    const otherSettings = currentRecords.filter(
      (record) =>
        record.base !== newRecord.base || record.length !== newRecord.length,
    );

    window.localStorage.setItem(
      SCORE_STORAGE_KEY,
      JSON.stringify([...otherSettings, ...matchingSettings]),
    );

    return true;
  } catch {
    return false;
  }
};

const getBaseLabel = (base: number): string =>
  BASE_OPTIONS.find((option) => option.value === base)?.label ?? String(base);

const renderLeaderboard = (
  container: HTMLElement,
  settings: RoundSettings,
): void => {
  const heading = createElement('h2', 'history-heading');
  heading.textContent = 'Лучшие результаты';
  const caption = createElement('p', 'leaderboard-caption');
  caption.textContent = `${settings.length} цифры · ${getBaseLabel(settings.base)} · топ ${MAX_SCORES_PER_SETTINGS}`;
  const list = createElement('ol', 'leaderboard-list');
  const scores = loadScoreRecords()
    .filter(
      (record) =>
        record.base === settings.base && record.length === settings.length,
    )
    .sort(compareScores)
    .slice(0, MAX_SCORES_PER_SETTINGS);

  if (scores.length === 0) {
    const emptyMessage = createElement('li', 'empty-history');
    emptyMessage.textContent = 'Пока нет результатов для этих настроек';
    list.append(emptyMessage);
  } else {
    scores.forEach((score, index) => {
      const item = createElement('li', 'leaderboard-entry');
      const place = createElement('span', 'leaderboard-place');
      place.textContent = `${index + 1}.`;
      const attempts = createElement('span', 'leaderboard-attempts');
      attempts.textContent = formatCount(score.attempts, [
        'попытка',
        'попытки',
        'попыток',
      ]);
      const time = createElement('time', 'leaderboard-time');
      time.textContent = formatDuration(score.elapsedMs);
      item.append(place, attempts, time);
      list.append(item);
    });
  }

  container.replaceChildren(heading, caption, list);
};

const stopTimer = (): void => {
  if (timerId !== undefined) {
    window.clearInterval(timerId);
    timerId = undefined;
  }
};

const renderSettings = (): void => {
  stopTimer();
  game = undefined;

  const card = createElement('section', 'settings-card');
  const eyebrow = createElement('p', 'eyebrow');
  eyebrow.textContent = 'ЛОГИЧЕСКАЯ ИГРА';

  const title = createElement('h1');
  title.textContent = 'Быки и коровы';

  const description = createElement('p', 'intro');
  description.textContent =
    'Угадай секретное число. Быки — цифры на своих местах, коровы — угаданные цифры в других позициях.';

  const form = createElement('form', 'settings-form');
  const baseLabel = createElement('label', 'field');
  baseLabel.htmlFor = 'base-select';
  const baseCaption = createElement('span');
  baseCaption.textContent = 'Система счисления';

  const baseSelect = createElement('select');
  baseSelect.id = 'base-select';
  baseSelect.name = 'base';
  BASE_OPTIONS.forEach(({ label, value }) => {
    baseSelect.append(createOption(label, String(value)));
  });
  baseSelect.value = String(selectedSettings.base);

  const lengthLabel = createElement('label', 'field');
  lengthLabel.htmlFor = 'length-select';
  const lengthCaption = createElement('span');
  lengthCaption.textContent = 'Длина секрета';

  const lengthSelect = createElement('select');
  lengthSelect.id = 'length-select';
  lengthSelect.name = 'length';
  Array.from({ length: 5 }, (_, index) => index + 2).forEach((length) => {
    lengthSelect.append(
      createOption(
        formatCount(length, ['цифра', 'цифры', 'цифр']),
        String(length),
      ),
    );
  });
  lengthSelect.value = String(selectedSettings.length);

  const possibilityCount = createElement('p', 'possibility-count');
  possibilityCount.setAttribute('aria-live', 'polite');

  const leaderboard = createElement('section', 'leaderboard');

  const startButton = createElement('button', 'primary-button');
  startButton.type = 'submit';
  startButton.textContent = 'Начать игру';

  const updateSettings = (): void => {
    const base = Number(baseSelect.value);
    const availableLengths = Array.from(lengthSelect.options).filter(
      (option) => Number(option.value) <= base,
    );
    const selectedIsAvailable = Number(lengthSelect.value) <= base;

    Array.from(lengthSelect.options).forEach((option) => {
      option.disabled = Number(option.value) > base;
    });

    if (!selectedIsAvailable) {
      const firstAvailableLength = availableLengths.at(0);

      if (firstAvailableLength) {
        lengthSelect.value = firstAvailableLength.value;
      }
    }

    selectedSettings = {
      base,
      length: Number(lengthSelect.value),
    };

    const possibleSecrets = countPossibleSecrets(
      selectedSettings.length,
      selectedSettings.base,
    );
    possibilityCount.textContent = `Возможных секретов: ${possibleSecrets.toLocaleString('ru-RU')}`;
    renderLeaderboard(leaderboard, selectedSettings);
  };

  baseLabel.append(baseCaption, baseSelect);
  lengthLabel.append(lengthCaption, lengthSelect);
  form.append(baseLabel, lengthLabel, possibilityCount, startButton);
  card.append(eyebrow, title, description, form, leaderboard);
  app.replaceChildren(card);

  baseSelect.addEventListener('change', updateSettings);
  lengthSelect.addEventListener('change', updateSettings);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    updateSettings();
    startGame(selectedSettings);
  });
  updateSettings();
};

const startGame = (settings: RoundSettings): void => {
  const isHexadecimal = settings.base === 16;

  game = {
    settings: { ...settings },
    secret: generateSecret(settings.length, settings.base),
    startedAt: Date.now(),
    guesses: [],
    status: 'playing',
  };

  renderGame(isHexadecimal);
};

const renderGame = (isHexadecimal: boolean): void => {
  if (!game) {
    return;
  }

  const { settings } = game;
  const card = createElement('section', 'game-card');
  const header = createElement('header', 'game-header');
  const headingGroup = createElement('div');
  const eyebrow = createElement('p', 'eyebrow');
  eyebrow.textContent = 'ТЕКУЩИЙ РАУНД';
  const title = createElement('h1');
  title.textContent = 'Быки и коровы';
  headingGroup.append(eyebrow, title);

  const newGameButton = createElement('button', 'secondary-button');
  newGameButton.type = 'button';
  newGameButton.textContent = 'Новая игра';
  newGameButton.addEventListener('click', renderSettings);
  header.append(headingGroup, newGameButton);

  const roundInfo = createElement('div', 'round-info');
  const baseName = getBaseLabel(settings.base);
  const settingsBadge = createElement('span', 'settings-badge');
  settingsBadge.textContent = `${formatCount(settings.length, ['цифра', 'цифры', 'цифр'])} · ${baseName}`;
  const timerLabel = createElement('span', 'timer');
  timerLabel.textContent = 'Время: 00:00';
  roundInfo.append(settingsBadge, timerLabel);

  const instructions = createElement('p', 'game-instructions');
  instructions.textContent = `Введи ${settings.length} разные цифры. После каждой попытки увидишь количество быков и коров.`;

  const guessForm = createElement('form', 'guess-form');
  const guessLabel = createElement('label', 'field');
  guessLabel.htmlFor = 'guess-input';
  const guessCaption = createElement('span');
  guessCaption.textContent = 'Твоя попытка';

  const inputRow = createElement('div', 'input-row');
  const guessInput = createElement('input', 'guess-input');
  guessInput.id = 'guess-input';
  guessInput.name = 'guess';
  guessInput.type = 'text';
  guessInput.autocomplete = 'off';
  guessInput.autocapitalize = isHexadecimal ? 'characters' : 'off';
  guessInput.spellcheck = false;
  guessInput.inputMode = 'text';
  guessInput.maxLength = settings.length;
  guessInput.placeholder = '·'.repeat(settings.length);
  guessInput.setAttribute('aria-describedby', 'guess-feedback');

  const submitButton = createElement('button', 'primary-button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Проверить';
  inputRow.append(guessInput, submitButton);
  guessLabel.append(guessCaption);

  const feedback = createElement('p', 'feedback');
  feedback.id = 'guess-feedback';
  feedback.setAttribute('aria-live', 'polite');
  guessForm.append(guessLabel, inputRow, feedback);

  const resultMessage = createElement('p', 'result-message');
  resultMessage.setAttribute('aria-live', 'polite');

  const historyHeading = createElement('h2', 'history-heading');
  historyHeading.textContent = 'История попыток';
  const historyList = createElement('ol', 'history-list');
  const emptyHistory = createElement('li', 'empty-history');
  emptyHistory.textContent = 'Здесь появятся твои попытки';
  historyList.append(emptyHistory);

  card.append(
    header,
    roundInfo,
    instructions,
    guessForm,
    resultMessage,
    historyHeading,
    historyList,
  );
  app.replaceChildren(card);
  guessInput.focus();

  const isDigitValid = createDigitValidator(settings.base);
  guessInput.addEventListener('input', () => {
    const filteredGuess = [...guessInput.value]
      .filter(isDigitValid)
      .slice(0, settings.length)
      .join('');
    guessInput.value = isHexadecimal
      ? filteredGuess.toUpperCase()
      : filteredGuess;
    feedback.textContent = '';
    feedback.classList.remove('feedback-error');
  });

  guessForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!game || game.status === 'won') {
      return;
    }

    const guess = guessInput.value.toUpperCase();

    if (!isValidGuess(guess, settings.length, settings.base)) {
      feedback.textContent = `Нужно ввести ${settings.length} допустимых цифр без повторов.`;
      feedback.classList.add('feedback-error');
      guessInput.focus();
      return;
    }

    if (game.guesses.some((entry) => entry.guess === guess)) {
      feedback.textContent = 'Эта попытка уже есть в истории. Попробуй другую.';
      feedback.classList.add('feedback-error');
      guessInput.focus();
      return;
    }

    const evaluation = evaluateGuess(game.secret, guess);
    const record: GuessRecord = { guess, ...evaluation };
    game = { ...game, guesses: [...game.guesses, record] };
    emptyHistory.remove();

    const historyEntry = createElement('li', 'history-entry');
    const attemptNumber = createElement('span', 'attempt-number');
    attemptNumber.textContent = `#${game.guesses.length}`;
    const attemptGuess = createElement('code', 'attempt-guess');
    attemptGuess.textContent = record.guess;
    const attemptResult = createElement('span', 'attempt-result');
    attemptResult.textContent = `${record.bulls} быка · ${record.cows} коровы`;
    historyEntry.append(attemptNumber, attemptGuess, attemptResult);
    historyList.prepend(historyEntry);

    guessInput.value = '';
    feedback.textContent = '';
    feedback.classList.remove('feedback-error');

    if (evaluation.bulls === settings.length) {
      game = { ...game, status: 'won' };
      stopTimer();
      guessInput.disabled = true;
      submitButton.disabled = true;
      const elapsedTime = Date.now() - game.startedAt;
      const scoreWasSaved = saveScoreRecord({
        base: settings.base,
        length: settings.length,
        attempts: game.guesses.length,
        elapsedMs: elapsedTime,
      });
      timerLabel.textContent = `Время: ${formatDuration(elapsedTime)}`;
      resultMessage.textContent = `Ты угадал число ${game.secret} за ${game.guesses.length} попыток и ${formatDuration(elapsedTime)}!${scoreWasSaved ? ' Результат сохранён в таблице рекордов.' : ' Не удалось сохранить результат в этом браузере.'}`;
      resultMessage.classList.add('result-success');
      newGameButton.focus();
    } else {
      guessInput.focus();
    }
  });

  timerId = window.setInterval(() => {
    if (game?.status === 'playing') {
      timerLabel.textContent = `Время: ${formatDuration(Date.now() - game.startedAt)}`;
    }
  }, 1000);
};

const app = createElement('main', 'app-shell');
document.body.prepend(app);
renderSettings();
