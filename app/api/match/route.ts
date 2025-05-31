import { NextRequest, NextResponse } from 'next/server';
import { parseResume } from '../../lib/parseResume';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('resume') as File;
  const jobDescription = formData.get('jobDescription') as string;
  const llm = formData.get('llm') as string;

  const buffer = Buffer.from(await file.arrayBuffer());
  const resumeText = await parseResume(file.name, buffer);

  const prompt = `You are an ATS evaluator. Compare resume and job description:
Resume:\n${resumeText}\n\nJob:\n${jobDescription}\n
Return:
- Match Score
- Missing Keywords
- Suggestions`;

  let modelId = '';
  switch (llm) {
    case 'claude':
      modelId = 'anthropic/claude-3-haiku:beta';
      break;
    case 'gemini':
      modelId = 'google/gemini-pro';
      break;
    case 'gpt':
      modelId = 'openai/gpt-3.5-turbo';
      break;
    default:
      modelId = 'anthropic/claude-3-haiku:beta';
  }

  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: modelId,
    messages: [{ role: 'user', content: prompt }],
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const result = response.data.choices[0].message.content;
  return NextResponse.json({ result });
}
