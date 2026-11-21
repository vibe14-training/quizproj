const test = require('node:test');
const assert = require('node:assert/strict');
const { generateQuiz, validateInput, validateQuestions } = require('../lib/quiz');
const handler = require('../api/generate');

const input = { subject: '과학', unit: '태양계', type: 'multiple', count: 1 };
const question = { question: '태양계의 중심은?', choices: ['태양', '지구', '달', '화성'], answer: '태양', explanation: '태양이 중심입니다.' };
const env = { AI_ENDPOINT: 'https://example.test/openai/v1/', AI_API_KEY: 'test-key', AI_DEPLOYMENT: 'test-model' };

test('입력 공백을 제거하고 필수 항목과 문제 수를 검증한다', () => {
  assert.equal(validateInput({ ...input, subject: ' 과학 ' }).subject, '과학');
  for (const invalid of [
    { ...input, subject: ' ' }, { ...input, unit: '' }, { ...input, count: 0 },
    { ...input, count: 11 }, { ...input, count: 1.5 }, { ...input, type: 'other' }
  ]) {
    assert.throws(() => validateInput(invalid), { code: 'INVALID_INPUT' });
  }
});

test('결과 수와 객관식 선택지 및 정답을 검증한다', () => {
  assert.equal(validateQuestions({ questions: [question] }, input)[0].answer, '태양');
  for (const invalid of [
    { questions: [] },
    { questions: [{ ...question, choices: ['태양', '지구'] }] },
    { questions: [{ ...question, choices: ['태양', '태양', '달', '화성'] }] },
    { questions: [{ ...question, answer: '금성' }] },
    { questions: [{ ...question, explanation: ' ' }] }
  ]) {
    assert.throws(() => validateQuestions(invalid, input), { code: 'INVALID_RESPONSE' });
  }
  const short = { question: '중심은?', answer: '태양', explanation: '태양이 중심입니다.' };
  assert.deepEqual(validateQuestions({ questions: [short] }, { ...input, type: 'short' }), [short]);
});

test('Azure 호환 요청을 보내고 결과를 반환한다', async () => {
  const fetcher = async (url, options) => {
    assert.equal(url.href, 'https://example.test/openai/v1/chat/completions');
    assert.equal(options.headers['api-key'], 'test-key');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'test-model');
    assert.equal(body.response_format.type, 'json_object');
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ questions: [question] }) } }] }) };
  };
  assert.deepEqual(await generateQuiz(input, { env, fetcher }), { questions: [question] });
});

test('설정 누락, 연결 실패, 시간 초과 및 잘못된 응답을 명시적으로 처리한다', async () => {
  await assert.rejects(generateQuiz(input, { env: {} }), { code: 'CONFIGURATION' });
  await assert.rejects(generateQuiz(input, { env, fetcher: async () => { throw new Error('network'); } }), { code: 'UPSTREAM_NETWORK' });
  await assert.rejects(generateQuiz(input, { env, fetcher: async () => { throw Object.assign(new Error(), { name: 'TimeoutError' }); } }), { code: 'TIMEOUT' });
  await assert.rejects(generateQuiz(input, { env, fetcher: async () => ({ ok: true, json: async () => { throw Object.assign(new Error(), { name: 'AbortError' }); } }) }), { code: 'TIMEOUT' });
  await assert.rejects(generateQuiz(input, { env, fetcher: async () => ({ ok: false, status: 429 }) }), { code: 'UPSTREAM_ERROR' });
  await assert.rejects(generateQuiz(input, { env, fetcher: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'not json' } }] }) }) }), { code: 'INVALID_RESPONSE' });
});

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); }
  };
}

test('HTTP API는 잘못된 입력 및 메서드를 거부한다', async () => {
  const invalid = response();
  await handler({ method: 'POST', body: { ...input, unit: ' ' } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.ok(invalid.body.error);
  const method = response();
  await handler({ method: 'GET' }, method);
  assert.equal(method.statusCode, 405);
  assert.equal(method.headers.Allow, 'POST');
  const malformed = response();
  await handler({ method: 'POST', body: '{' }, malformed);
  assert.equal(malformed.statusCode, 400);
  const tooLarge = response();
  await handler({ method: 'POST', body: 'x'.repeat(4097) }, tooLarge);
  assert.equal(tooLarge.statusCode, 413);
});
