import { NextRequest, NextResponse } from 'next/server';
import { parseResume } from '../../lib/parseResume';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;
    const jobDescription = formData.get('jobDescription') as string;
    const llm = formData.get('llm') as string;

    if (!file || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing file or job description' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await parseResume(file.name, buffer);

    const prompt = `You are an ATS evaluator. Compare resume and job description:
Resume:\n${resumeText}\n\nJob:\n${jobDescription}\n
Return:
- Match Score (0-100%)
- Missing Keywords (list)
- Suggestions for improvement`;

    let modelId = 'anthropic/claude-3-haiku:beta';
    if (llm === 'gemini') modelId = 'google/gemini-pro';
    if (llm === 'gpt') modelId = 'openai/gpt-3.5-turbo';

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({ result: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}