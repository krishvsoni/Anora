/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    const res = await fetch('/api/match', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setResult(data.result);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-xl mx-auto">
      <input type="file" accept=".pdf,.docx" onChange={e => setFile(e.target.files?.[0] || null)} required />
      <textarea placeholder="Paste job description here..." className="w-full p-2 border" value={jobDescription} onChange={e => setJobDescription(e.target.value)} required />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
      {result && <div className="mt-4 whitespace-pre-wrap bg-gray-100 p-3 rounded">{result}</div>}
    </form>
  );
}
