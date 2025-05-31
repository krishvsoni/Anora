import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Parses resume content from a given file buffer.
 * Supports .pdf and .docx files.
 * 
 * @param filename - Name of the file (to determine type)
 * @param buffer - File content as Buffer
 * @returns Resume text as string
 */
export async function parseResume(filename: string, buffer: Buffer): Promise<string> {
  try {
    if (filename.toLowerCase().endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (filename.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    throw new Error('Unsupported file format. Only PDF and DOCX are allowed.');
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume. Please ensure the file is valid.');
  }
}