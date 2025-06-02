/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { parseResume } from '../../../lib/parseResume';
import axios from 'axios';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get('resume') as File;
    const jobDescription = formData.get('jobDescription') as string;
    const llm = formData.get('llm') as string;

    if (!file || !jobDescription || !llm) {
      console.error('⚠️ Missing required fields:', { file, jobDescription, llm });
      return NextResponse.json({ error: 'Missing resume, job description, or LLM' }, { status: 400 });
    }

    console.log('[Match Debug] Resume file:', file.name, file.size);
    console.log('[Match Debug] LLM:', llm);

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('[Match Debug] Buffer size:', buffer.length);

    const resumeText = await parseResume(file.name, buffer); 

    const prompt = `
You are an ATS system. Analyze the resume against the job description on that give a score out of 100.
 Mention:
- Matching skills from the job description and if not found in the resume add in recommendations
- Missing skills should be mentioned in recommendations properly
- Recommendations should be actionable and specific from the job description
- Mention the score out of 100 properly by looking the resume and job description dont rush and give a score use proper understanding and industry standards and staticts
- Provide a summary of the resume and how it aligns with the job description

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

    const model = {
      claude: 'anthropic/claude-3-haiku:beta',
      gemini: 'google/gemini-pro',
      gpt: 'openai/gpt-3.5-turbo',
    }[llm] || 'anthropic/claude-3-haiku:beta';

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = response.data.choices[0].message.content;
    return NextResponse.json({ result });

  } catch (err: any) {
    console.error('❌ Match error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
