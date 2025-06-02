'use client';

import { useState, ChangeEvent } from 'react';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [llm, setLlm] = useState('claude');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      setError('Please upload a file and provide a job description.');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);
    formData.append('llm', llm);

    try {
      const res = await fetch('/api/v1/match', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Failed to analyze the resume: ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-xl mx-auto">
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        required
      />
      <textarea
        placeholder="Paste job description here..."
        className="w-full p-2 border"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        required
      />
      <select
        value={llm}
        onChange={(e) => setLlm(e.target.value)}
        className="border p-2"
      >
        <option value="claude">Claude</option>
        <option value="gpt">GPT</option>
        <option value="gemini">Gemini</option>
      </select>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" disabled={isLoading}>
        {isLoading ? 'Analyzing...' : 'Submit'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {result && <div className="mt-4 whitespace-pre-wrap bg-gray-100 p-3 rounded">{result}</div>}
    </form>
  );
}
