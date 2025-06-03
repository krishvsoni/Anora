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
      console.error('Missing required fields:', { file, jobDescription, llm });
      return NextResponse.json({ error: 'Missing resume, job description, or LLM' }, { status: 400 });
    }

    console.log('[Match Debug] Resume file:', file.name, file.size);
    console.log('[Match Debug] LLM:', llm);

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('[Match Debug] Buffer size:', buffer.length);

    const resumeText = await parseResume(file.name, buffer);

    const prompt = `
You are an advanced Applicant Tracking System (ATS). Your task is to analyze the provided resume against the job description, give a comprehensive evaluation, and create an improved resume based on the analysis. Follow these steps to ensure a thorough and accurate process:

1. **Extract Information:**
   - **Resume:** Extract the following details from the resume:
     - Contact Information (Name, Email, Phone Number, Address)
     - Professional Summary
     - Work Experience (Job Titles, Companies, Dates, Responsibilities, Achievements)
     - Education (Degrees, Institutions, Dates)
     - Skills (Technical Skills, Soft Skills)
     - Certifications
     - Projects
     - Additional Sections (Volunteer Work, Languages, etc.)

   - **Job Description:** Extract the following details from the job description:
     - Job Title
     - Company Information
     - Key Responsibilities
     - Required Skills (Technical Skills, Soft Skills)
     - Preferred Qualifications
     - Education and Experience Requirements
     - Any Specific Certifications or Training

2. **Matching Analysis:**
   - **Skills Matching:** Compare the skills listed in the resume with those required in the job description. Identify:
     - Matching Skills: Skills that are present in both the resume and the job description.
     - Missing Skills: Skills required in the job description but not found in the resume.
   - **Experience Matching:** Compare the work experience in the resume with the job description. Identify:
     - Relevant Experience: Work experience that aligns with the key responsibilities and requirements of the job.
     - Missing Experience: Key responsibilities or requirements from the job description that are not addressed in the resume.
   - **Education Matching:** Compare the education details in the resume with the job description. Identify:
     - Matching Education: Degrees and institutions that meet the education requirements of the job.
     - Missing Education: Education requirements from the job description that are not met by the resume.

3. **Scoring:**
   - Assign a score out of 100 based on the matching analysis. Consider the following factors:
     - **Skills Matching (40 points):** Award points based on the number and relevance of matching skills.
     - **Experience Matching (30 points):** Award points based on the relevance and duration of matching work experience.
     - **Education Matching (20 points):** Award points based on the matching education requirements.
     - **Additional Qualifications (10 points):** Award points for any additional qualifications, certifications, or projects that align with the job description.
   - Be strict in your scoring. Deduct points for missing skills, experience, or education requirements. Use industry standards and statistics to guide your scoring.

4. **Recommendations:**
   - Provide actionable and specific recommendations to improve the resume based on the job description. Include:
     - **Skills to Add:** List the missing skills that should be added to the resume.
     - **Experience to Highlight:** Suggest ways to highlight relevant experience or add missing experience.
     - **Education to Include:** Recommend any additional education or certifications that should be included.
     - **Formatting and Presentation:** Provide tips on improving the overall formatting and presentation of the resume.

5. **Summary:**
   - Provide a summary of the resume and how it aligns with the job description. Include:
     - **Strengths:** Highlight the strongest aspects of the resume that match the job description.
     - **Weaknesses:** Identify the areas where the resume falls short of the job description.
     - **Overall Fit:** Provide an overall assessment of how well the resume fits the job description.

6. **Create an Improved Resume:**
   - Based on the analysis and recommendations, create an improved version of the resume. Ensure the improved resume only includes information from the candidate and does not add any fabricated details.

     - **Contact Information:** Updated and accurate contact details.
     - **Professional Summary:** A concise and compelling summary that highlights the candidate's key qualifications and aligns with the job description.
     - **Work Experience:** Detailed and relevant work experience that matches the key responsibilities and requirements of the job. Use bullet points to highlight achievements and responsibilities.
     - **Education:** Updated education details that meet the requirements of the job description.
     - **Skills:** A comprehensive list of skills that includes both matching and recommended skills from the job description.
     - **Certifications:** Any relevant certifications or training that align with the job description.
     - **Projects:** Detailed descriptions of projects that demonstrate the candidate's skills and experience.
     - **Additional Sections:** Any additional sections (e.g., Volunteer Work, Languages) that enhance the candidate's profile.

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

    const modelMap: Record<string, string> = {
      'deepseek-r1-0528-qwen3-8b': 'deepseek/deepseek-r1-0528-qwen3-8b:free',
      'deepseek-r1-0528': 'deepseek/deepseek-r1-0528:free',
      'sarvam-m': 'sarvamai/sarvam-m:free',
      'devstral-small': 'mistralai/devstral-small:free',
      'gemma-3n-4b': 'google/gemma-3n-e4b-it:free',
      'llama-3.3-8b-instruct': 'meta-llama/llama-3.3-8b-instruct:free',
      'deephermes-3-mistral-24b-preview': 'nousresearch/deephermes-3-mistral-24b-preview:free',
      'phi-4-reasoning-plus': 'microsoft/phi-4-reasoning-plus:free',
      'phi-4-reasoning': 'microsoft/phi-4-reasoning:free',
      'internvl3-14b': 'opengvlab/internvl3-14b:free',
      'internvl3-2b': 'opengvlab/internvl3-2b:free',
      'deepseek-prover-v2': 'deepseek/deepseek-prover-v2:free',
      'qwen3-30b-a3b': 'qwen/qwen3-30b-a3b:free',
      'qwen3-8b': 'qwen/qwen3-8b:free',
      'qwen3-14b': 'qwen/qwen3-14b:free',
      'qwen3-32b': 'qwen/qwen3-32b:free',
      'qwen3-235b-a22b': 'qwen/qwen3-235b-a22b:free',
      'deepseek-r1t-chimera': 'tngtech/deepseek-r1t-chimera:free',
      'mai-ds-r1': 'microsoft/mai-ds-r1:free',
      'glm-z1-32b': 'thudm/glm-z1-32b:free',
      'glm-4-32b': 'thudm/glm-4-32b:free',
      'shisa-v2-llama3.3-70b': 'shisa-ai/shisa-v2-llama3.3-70b:free',
      'qwq-32b-arliai-rpr-v1': 'arliai/qwq-32b-arliai-rpr-v1:free',
      'deepcoder-14b-preview': 'agentica-org/deepcoder-14b-preview:free',
      'kimi-vl-a3b-thinking': 'moonshotai/kimi-vl-a3b-thinking:free',
      'llama-3.3-nemotron-super-49b-v1': 'nvidia/llama-3.3-nemotron-super-49b-v1:free',
      'llama-3.1-nemotron-ultra-253b-v1': 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
      'llama-4-maverick': 'meta-llama/llama-4-maverick:free',
      'llama-4-scout': 'meta-llama/llama-4-scout:free',
      'deepseek-v3-base': 'deepseek/deepseek-v3-base:free',
      'qwen2.5-vl-3b-instruct': 'qwen/qwen2.5-vl-3b-instruct:free',
      'gemini-2.5-pro-exp': 'google/gemini-2.5-pro-exp-03-25',
      'qwen2.5-vl-32b-instruct': 'qwen/qwen2.5-vl-32b-instruct:free',
      'deepseek-chat-v3-0324': 'deepseek/deepseek-chat-v3-0324:free',
      'qwerky-72b': 'featherless/qwerky-72b:free',
      'mistral-small-3.1-24b': 'mistralai/mistral-small-3.1-24b-instruct:free',
      'olympiccoder-32b': 'open-r1/olympiccoder-32b:free',
      'gemma-3-1b': 'google/gemma-3-1b-it:free',
      'gemma-3-4b': 'google/gemma-3-4b-it:free',
      'gemma-3-12b': 'google/gemma-3-12b-it:free',
      'reka-flash-3': 'rekaai/reka-flash-3:free',
      'gemma-3-27b': 'google/gemma-3-27b-it:free',
      'deepseek-r1-zero': 'deepseek/deepseek-r1-zero:free',
      'qwq-32b': 'qwen/qwq-32b:free',
      'moonlight-16b-a3b-instruct': 'moonshotai/moonlight-16b-a3b-instruct:free',
      'deephermes-3-llama-3-8b-preview': 'nousresearch/deephermes-3-llama-3-8b-preview:free',
      'dolphin3.0-r1-mistral-24b': 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
      'dolphin3.0-mistral-24b': 'cognitivecomputations/dolphin3.0-mistral-24b:free',
      'qwen2.5-vl-72b-instruct': 'qwen/qwen2.5-vl-72b-instruct:free',
      'mistral-small-24b-instruct': 'mistralai/mistral-small-24b-instruct-2501:free',
      'deepseek-r1-distill-qwen-32b': 'deepseek/deepseek-r1-distill-qwen-32b:free',
      'deepseek-r1-distill-qwen-14b': 'deepseek/deepseek-r1-distill-qwen-14b:free',
      'deepseek-r1-distill-llama-70b': 'deepseek/deepseek-r1-distill-llama-70b:free',
      'deepseek-r1': 'deepseek/deepseek-r1:free',
      'deepseek-chat': 'deepseek/deepseek-chat:free',
      'gemini-2.0-flash-exp': 'google/gemini-2.0-flash-exp:free',
      'llama-3.3-70b-instruct': 'meta-llama/llama-3.3-70b-instruct:free',
      'qwen-2.5-coder-32b-instruct': 'qwen/qwen-2.5-coder-32b-instruct:free',
      'qwen-2.5-7b-instruct': 'qwen/qwen-2.5-7b-instruct:free',
      'llama-3.2-3b-instruct': 'meta-llama/llama-3.2-3b-instruct:free',
      'llama-3.2-11b-vision-instruct': 'meta-llama/llama-3.2-11b-vision-instruct:free',
      'llama-3.2-1b-instruct': 'meta-llama/llama-3.2-1b-instruct:free',
      'qwen-2.5-72b-instruct': 'qwen/qwen-2.5-72b-instruct:free',
      'qwen-2.5-vl-7b-instruct': 'qwen/qwen-2.5-vl-7b-instruct:free',
      'llama-3.1-405b': 'meta-llama/llama-3.1-405b:free',
      'llama-3.1-8b-instruct': 'meta-llama/llama-3.1-8b-instruct:free',
      'mistral-nemo': 'mistralai/mistral-nemo:free',
      'gemma-2-9b': 'google/gemma-2-9b-it:free',
      'mistral-7b-instruct': 'mistralai/mistral-7b-instruct:free',
      'claude': 'anthropic/claude-3-haiku:beta',
      'gemini': 'google/gemini-2.5-pro-preview',
      'gpt': 'openai/gpt-3.5-turbo',
    };

    const model = modelMap[llm] || modelMap['claude'];

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
    console.error('Match error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
