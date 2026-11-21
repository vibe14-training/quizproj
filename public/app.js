const form = document.querySelector('#quiz-form');
const errorBox = document.querySelector('#error');
const loading = document.querySelector('#loading');
const submit = document.querySelector('#submit');
const results = document.querySelector('#results');
const questions = document.querySelector('#questions');
let pending = false;

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderQuestions(items, input) {
  questions.replaceChildren();
  document.querySelector('#results-meta').textContent = `${input.subject} · ${input.unit} · ${input.type === 'multiple' ? '객관식' : '주관식'} ${items.length}문제`;
  items.forEach((item, index) => {
    const card = element('article', 'question-card');
    const heading = element('div', 'question-top');
    heading.append(element('span', 'question-number', `QUESTION ${String(index + 1).padStart(2, '0')}`));
    card.append(heading, element('h3', 'question-title', item.question));
    if (item.choices) {
      const list = element('ol', 'choices');
      item.choices.forEach(choice => list.append(element('li', '', choice)));
      card.append(list);
    }
    const details = element('details', 'answer');
    details.append(element('summary', '', '정답과 해설 확인하기'));
    const content = element('div', 'answer-content');
    content.append(element('strong', '', `정답  ${item.answer}`), element('p', '', item.explanation));
    details.append(content);
    card.append(details);
    questions.append(card);
  });
  results.hidden = false;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending) return;
  showError('');
  const subject = form.elements.subject.value.trim();
  const unit = form.elements.unit.value.trim();
  const count = Number(form.elements.count.value);
  const type = form.elements.type.value;
  if (!subject || !unit || subject.length > 100 || unit.length > 100) {
    showError('과목과 단원명을 각각 1~100자로 입력해 주세요.');
    return;
  }
  if (!form.elements.count.value || !Number.isInteger(count) || count < 1 || count > 10) {
    showError('문제 수는 1~10 사이의 정수여야 합니다.');
    return;
  }
  const input = { subject, unit, count, type };
  pending = true;
  submit.disabled = true;
  loading.hidden = false;
  results.hidden = true;
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('서버 응답을 확인할 수 없습니다. 다시 시도해 주세요.');
    }
    if (!response.ok) throw new Error(data.error || '문제를 생성하지 못했습니다. 다시 시도해 주세요.');
    if (!Array.isArray(data.questions)) throw new Error('서버 응답을 확인할 수 없습니다. 다시 시도해 주세요.');
    renderQuestions(data.questions, input);
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    showError(error instanceof TypeError ? '서버에 연결하지 못했습니다. 다시 시도해 주세요.' : error.message);
  } finally {
    pending = false;
    submit.disabled = false;
    loading.hidden = true;
  }
});
