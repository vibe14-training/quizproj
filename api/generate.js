const { generateQuiz, QuizError } = require('../lib/quiz');

const MAX_BODY_BYTES = 4096;

async function readBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) throw new QuizError('BODY_TOO_LARGE', 413, '요청이 너무 큽니다.');
      return JSON.parse(req.body);
    }
    if (Buffer.byteLength(JSON.stringify(req.body) || '') > MAX_BODY_BYTES) throw new QuizError('BODY_TOO_LARGE', 413, '요청이 너무 큽니다.');
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new QuizError('BODY_TOO_LARGE', 413, '요청이 너무 큽니다.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'POST 요청만 지원합니다.' }));
  }
  try {
    const body = await readBody(req);
    const result = await generateQuiz(body);
    res.statusCode = 200;
    return res.end(JSON.stringify(result));
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: '올바른 JSON 요청을 보내 주세요.' }));
    }
    if (error instanceof QuizError) {
      console.error(`Quiz generation failed: ${error.code}`);
      res.statusCode = error.status;
      return res.end(JSON.stringify({ error: error.message }));
    }
    console.error('Quiz generation failed: UNEXPECTED_ERROR');
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: '서버 오류가 발생했습니다. 다시 시도해 주세요.' }));
  }
};
