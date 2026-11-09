import { countPossibleSecrets } from './logic/countPossibleSecrets';

type BaseOption = {
  label: string;
  value: number;
};

const BASE_OPTIONS: BaseOption[] = [
  { label: 'Двоичная (bin)', value: 2 },
  { label: 'Восьмеричная (oct)', value: 8 },
  { label: 'Десятичная (dec)', value: 10 },
  { label: 'Шестнадцатеричная (hex)', value: 16 },
];

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

const mountSettings = (): void => {
  const app = createElement('main', 'app-shell');
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

  const lengthLabel = createElement('label', 'field');
  lengthLabel.htmlFor = 'length-select';
  const lengthCaption = createElement('span');
  lengthCaption.textContent = 'Длина секрета';

  const lengthSelect = createElement('select');
  lengthSelect.id = 'length-select';
  lengthSelect.name = 'length';
  Array.from({ length: 5 }, (_, index) => index + 2).forEach((length) => {
    lengthSelect.append(createOption(`${length} цифры`, String(length)));
  });

  const possibilityCount = createElement('p', 'possibility-count');
  possibilityCount.setAttribute('aria-live', 'polite');

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

    const possibleSecrets = countPossibleSecrets(
      Number(lengthSelect.value),
      base,
    );
    possibilityCount.textContent = `Возможных секретов: ${possibleSecrets.toLocaleString('ru-RU')}`;
  };

  baseLabel.append(baseCaption, baseSelect);
  lengthLabel.append(lengthCaption, lengthSelect);
  form.append(baseLabel, lengthLabel, possibilityCount);
  card.append(eyebrow, title, description, form);
  app.append(card);
  document.body.append(app);

  baseSelect.addEventListener('change', updateSettings);
  lengthSelect.addEventListener('change', updateSettings);
  updateSettings();
};

mountSettings();
