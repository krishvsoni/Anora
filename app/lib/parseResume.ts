import mammoth from 'mammoth';

export async function parseResume(filename: string, buffer: Buffer): Promise<string> {
  try {
    if (filename.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    throw new Error('Unsupported file format. Only DOCX allowed.');
  } catch (error) {
    console.error('❌ Error parsing resume:', error);
    throw new Error('Failed to parse resume. Please upload a valid DOCX.');
  }
}
