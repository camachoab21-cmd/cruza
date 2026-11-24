'use strict';
const entries = [
  {word: 'CURSO', row: 0, column: 1, across: false},
  {word: 'CRUZA', row: 2, column: 0, across: true},
  {word: 'AULA', row: 2, column: 4, across: false},
];
const format = new Map();
const fields = new Map();
const key = (row, column) => row * 5 + column;
const grid = document.getElementById('grid');
const result = document.getElementById('result');
const form = document.getElementById('crossword');

entries.forEach(({word, row, column, across}, index) => {
  Array.from(word).forEach((letter, step) => {
    const position = key(row + (across ? 0 : step), column + (across ? step : 0));
    const cell = format.get(position) || {letter};
    if (step === 0) cell.number = index + 1;
    cell.next ??= step < word.length - 1 ? position + (across ? 1 : 5) : null;
    format.set(position, cell);
  });
});

for (let position = 0; position < 30; position++) {
  const data = format.get(position);
  const box = document.createElement('div');
  grid.append(box);
  if (!data) {
    box.className = 'blank';
    box.setAttribute('aria-hidden', 'true');
    continue;
  }
  const input = document.createElement('input');
  input.maxLength = 1;
  input.autocapitalize = 'characters';
  input.spellcheck = false;
  input.id = 'cell-' + position;
  input.setAttribute('aria-label', 'Fila ' + (Math.floor(position / 5) + 1) +
    ', columna ' + ((position % 5) + 1) + (data.number ? ', pista ' + data.number : ''));
  if (data.number) {
    const label = document.createElement('span');
    label.textContent = data.number;
    label.setAttribute('aria-hidden', 'true');
    box.append(label);
  }
  box.append(input);
  fields.set(position, input);
  input.addEventListener('focus', () => input.select());
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-ZÑ]/g, '').slice(0, 1);
    input.removeAttribute('aria-invalid');
    result.textContent = '';
    if (input.value) fields.get(data.next)?.focus();
  });
  input.addEventListener('keydown', event => {
    const offsets = {ArrowUp: -5, ArrowDown: 5, ArrowLeft: -1, ArrowRight: 1};
    if (!Object.hasOwn(offsets, event.key)) return;
    event.preventDefault();
    if ((event.key === 'ArrowLeft' && position % 5 === 0) ||
        (event.key === 'ArrowRight' && position % 5 === 4)) return;
    fields.get(position + offsets[event.key])?.focus();
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  let remaining = 0;
  for (const [position, field] of fields) {
    const correct = field.value === format.get(position).letter;
    if (!correct) remaining++;
    field.toggleAttribute('aria-invalid', false);
    if (field.value && !correct) field.setAttribute('aria-invalid', 'true');
  }
  result.textContent = remaining ? 'Casillas por resolver: ' + remaining + '.' : '¡Crucigrama resuelto!';
});

form.addEventListener('reset', () => {
  for (const field of fields.values()) field.removeAttribute('aria-invalid');
  result.textContent = '';
  fields.values().next().value.focus();
});
