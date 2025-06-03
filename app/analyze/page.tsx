/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Target,
  CheckCircle,
  Eye,
  Download,
  RotateCcw,
  Lightbulb,
  Clock,
  Brain,
  Zap,
  BarChart3,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function ATSAnalyzePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [llm, setLlm] = useState("claude");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [atsResults, setAtsResults] = useState<any>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !jobDescription.trim()) return;

    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append("resume", uploadedFile);
    formData.append("jobDescription", jobDescription);
    formData.append("llm", llm);

    try {
      const response = await fetch("/api/v1/match", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAtsResults(data.result);
      setAnalysisComplete(true);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setJobDescription("");
    setAnalysisComplete(false);
    setIsAnalyzing(false);
    setAtsResults(null);
  };

  const parseAIResponse = (response: string) => {
    const lines = response.split("\n").filter((line) => line.trim());

    const scoreMatch = response.match(/score[:\s]*(\d+)/i);
    const overallScore = scoreMatch ? Number.parseInt(scoreMatch[1]) : 75;

    const suggestions = lines
      .filter(
        (line) =>
          line.toLowerCase().includes("suggest") ||
          line.toLowerCase().includes("improve") ||
          line.toLowerCase().includes("add") ||
          line.toLowerCase().includes("include"),
      )
      .slice(0, 5);

    const keywords = lines.filter(
      (line) =>
        line.toLowerCase().includes("keyword") ||
        line.toLowerCase().includes("skill") ||
        line.toLowerCase().includes("technology"),
    );

    return {
      overallScore,
      suggestions: suggestions.map((suggestion, index) => ({
        category: index % 3 === 0 ? "Keywords" : index % 3 === 1 ? "Experience" : "Skills",
        priority: index < 2 ? "High" : index < 4 ? "Medium" : "Low",
        suggestion: suggestion.replace(/^[-•*]\s*/, ""),
        impact: `+${Math.floor(Math.random() * 8) + 3} points`,
      })),
      keywords,
      rawResponse: response,
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getLlmDisplayName = (llmValue: string) => {
    const llmNames = {
      'deepseek-r1-0528-qwen3-8b': 'DeepSeek R1 0528 Qwen3 8B',
      'deepseek-r1-0528': 'DeepSeek R1 0528',
      'sarvam-m': 'Sarvam AI: Sarvam-M',
      'devstral-small': 'Mistral: Devstral Small',
      'gemma-3n-4b': 'Google: Gemma 3N 4B',
      'llama-3.3-8b-instruct': 'Meta: Llama 3.3 8B Instruct',
      'deephermes-3-mistral-24b-preview': 'Nous: DeepHermes 3 Mistral 24B Preview',
      'phi-4-reasoning-plus': 'Microsoft: Phi 4 Reasoning Plus',
      'phi-4-reasoning': 'Microsoft: Phi 4 Reasoning',
      'internvl3-14b': 'OpenGVLab: InternVL3 14B',
      'internvl3-2b': 'OpenGVLab: InternVL3 2B',
      'deepseek-prover-v2': 'DeepSeek: Prover V2',
      'qwen3-30b-a3b': 'Qwen: Qwen3 30B A3B',
      'qwen3-8b': 'Qwen: Qwen3 8B',
      'qwen3-14b': 'Qwen: Qwen3 14B',
      'qwen3-32b': 'Qwen: Qwen3 32B',
      'qwen3-235b-a22b': 'Qwen: Qwen3 235B A22B',
      'deepseek-r1t-chimera': 'TNG: DeepSeek R1T Chimera',
      'mai-ds-r1': 'Microsoft: MAI DS R1',
      'glm-z1-32b': 'THUDM: GLM Z1 32B',
      'glm-4-32b': 'THUDM: GLM 4 32B',
      'shisa-v2-llama3.3-70b': 'Shisa AI: Shisa V2 Llama 3.3 70B',
      'qwq-32b-arliai-rpr-v1': 'ArliAI: QwQ 32B RPR V1',
      'deepcoder-14b-preview': 'Agentica: Deepcoder 14B Preview',
      'kimi-vl-a3b-thinking': 'Moonshot AI: Kimi VL A3B Thinking',
      'llama-3.3-nemotron-super-49b-v1': 'NVIDIA: Llama 3.3 Nemotron Super 49B V1',
      'llama-3.1-nemotron-ultra-253b-v1': 'NVIDIA: Llama 3.1 Nemotron Ultra 253B V1',
      'llama-4-maverick': 'Meta: Llama 4 Maverick',
      'llama-4-scout': 'Meta: Llama 4 Scout',
      'deepseek-v3-base': 'DeepSeek: DeepSeek V3 Base',
      'qwen2.5-vl-3b-instruct': 'Qwen: Qwen2.5 VL 3B Instruct',
      'gemini-2.5-pro-exp': 'Google: Gemini 2.5 Pro Experimental',
      'qwen2.5-vl-32b-instruct': 'Qwen: Qwen2.5 VL 32B Instruct',
      'deepseek-chat-v3-0324': 'DeepSeek: DeepSeek Chat V3 0324',
      'qwerky-72b': 'Qwerky 72B',
      'mistral-small-3.1-24b': 'Mistral: Mistral Small 3.1 24B',
      'olympiccoder-32b': 'OlympicCoder 32B',
      'gemma-3-1b': 'Google: Gemma 3 1B',
      'gemma-3-4b': 'Google: Gemma 3 4B',
      'gemma-3-12b': 'Google: Gemma 3 12B',
      'reka-flash-3': 'Reka: Flash 3',
      'gemma-3-27b': 'Google: Gemma 3 27B',
      'deepseek-r1-zero': 'DeepSeek: DeepSeek R1 Zero',
      'qwq-32b': 'Qwen: QwQ 32B',
      'moonlight-16b-a3b-instruct': 'Moonshot AI: Moonlight 16B A3B Instruct',
      'deephermes-3-llama-3-8b-preview': 'Nous: DeepHermes 3 Llama 3 8B Preview',
      'dolphin3.0-r1-mistral-24b': 'Dolphin 3.0 R1 Mistral 24B',
      'dolphin3.0-mistral-24b': 'Dolphin 3.0 Mistral 24B',
      'qwen2.5-vl-72b-instruct': 'Qwen: Qwen2.5 VL 72B Instruct',
      'mistral-small-24b-instruct': 'Mistral: Mistral Small 24B Instruct',
      'deepseek-r1-distill-qwen-32b': 'DeepSeek: R1 Distill Qwen 32B',
      'deepseek-r1-distill-qwen-14b': 'DeepSeek: R1 Distill Qwen 14B',
      'deepseek-r1-distill-llama-70b': 'DeepSeek: R1 Distill Llama 70B',
      'deepseek-r1': 'DeepSeek: R1',
      'deepseek-chat': 'DeepSeek: DeepSeek Chat',
      'gemini-2.0-flash-exp': 'Google: Gemini 2.0 Flash Experimental',
      'llama-3.3-70b-instruct': 'Meta: Llama 3.3 70B Instruct',
      'qwen-2.5-coder-32b-instruct': 'Qwen: Qwen 2.5 Coder 32B Instruct',
      'qwen-2.5-7b-instruct': 'Qwen: Qwen 2.5 7B Instruct',
      'llama-3.2-3b-instruct': 'Meta: Llama 3.2 3B Instruct',
      'llama-3.2-11b-vision-instruct': 'Meta: Llama 3.2 11B Vision Instruct',
      'llama-3.2-1b-instruct': 'Meta: Llama 3.2 1B Instruct',
      'qwen-2.5-72b-instruct': 'Qwen: Qwen 2.5 72B Instruct',
      'qwen-2.5-vl-7b-instruct': 'Qwen: Qwen 2.5 VL 7B Instruct',
      'llama-3.1-405b': 'Meta: Llama 3.1 405B',
      'llama-3.1-8b-instruct': 'Meta: Llama 3.1 8B Instruct',
      'mistral-nemo': 'Mistral: Mistral Nemo',
      'gemma-2-9b': 'Google: Gemma 2 9B',
      'mistral-7b-instruct': 'Mistral: Mistral 7B Instruct',
      'gemini': 'Gemini Pro',
      'gpt': 'GPT-3.5 Turbo',
    };

    return llmNames[llmValue as keyof typeof llmNames] || llmValue;
  };

  const parsedResults = atsResults ? parseAIResponse(atsResults) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br text-black from-slate-50 via-blue-50 to-indigo-50">
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ATSMatch Pro
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!analysisComplete ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">ATS Resume Analysis</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Upload your resume and paste the job description to get instant ATS compatibility analysis
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Upload className="w-5 h-5 mr-2 text-blue-600" />
                      <h3 className="text-lg font-semibold">Upload Resume</h3>
                    </div>
                    <p className="text-sm text-gray-500">Upload your resume in PDF, Word, or text format</p>
                  </div>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? "border-blue-500 bg-blue-50"
                        : uploadedFile
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-blue-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {uploadedFile ? (
                      <div className="space-y-4">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        <div>
                          <p className="font-medium text-green-700">{uploadedFile.name}</p>
                          <p className="text-sm text-green-600">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="border border-green-200 text-green-600 hover:bg-green-50 px-4 py-2 rounded-md transition-colors"
                        >
                          Change File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-lg font-medium text-gray-700">Drop your resume here</p>
                          <p className="text-gray-500">or click to browse</p>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                          id="resume-upload"
                        />
                        <label htmlFor="resume-upload">
                          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md transition-colors">
                            Choose File
                          </button>
                        </label>
                        <p className="text-xs text-gray-400">Supports PDF, Word, and text files up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      <h3 className="text-lg font-semibold">Job Description</h3>
                    </div>
                    <p className="text-sm text-gray-500">Paste the complete job description you&apos;re applying for</p>
                  </div>
                  <textarea
                    placeholder="Paste the job description here...

Example:
We are looking for a Senior Frontend Developer with 5+ years of experience in React, TypeScript, and Node.js. The ideal candidate should have experience with AWS, Docker, and modern development practices..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full min-h-[250px] p-4 border border-gray-200 rounded-md resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-500">{jobDescription.length} characters</p>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-200">
                      {jobDescription.split(" ").filter((word) => word.length > 0).length} words
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="rounded-lg shadow-lg border bg-transparent max-w-md mx-auto">
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Settings className="w-5 h-5 mr-2 text-blue-600" />
                      <h3 className="text-lg font-semibold">Model Selection</h3>
                    </div>
                   <p className="text-sm text-gray opacity-50">We have 50+ models available for analysis.</p>
                    <p className="text-sm text-gray-500">Choose the one that suits your needs.</p>
                  </div>
                  <select
                    value={llm}
                    onChange={(e) => setLlm(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="claude">Claude 3 Haiku</option>
                    <option value="gpt">GPT-3.5 Turbo</option>
                    <option value="deepseek-r1-0528-qwen3-8b">DeepSeek R1 0528 Qwen3 8B</option>
                    <option value="deepseek-r1-0528">DeepSeek R1 0528</option>
                    <option value="sarvam-m">Sarvam AI: Sarvam-M</option>
                    <option value="devstral-small">Mistral: Devstral Small</option>
                    <option value="gemma-3n-4b">Google: Gemma 3N 4B</option>
                    <option value="llama-3.3-8b-instruct">Meta: Llama 3.3 8B Instruct</option>
                    <option value="deephermes-3-mistral-24b-preview">Nous: DeepHermes 3 Mistral 24B Preview</option>
                    <option value="phi-4-reasoning-plus">Microsoft: Phi 4 Reasoning Plus</option>
                    <option value="phi-4-reasoning">Microsoft: Phi 4 Reasoning</option>
                    <option value="internvl3-14b">OpenGVLab: InternVL3 14B</option>
                    <option value="internvl3-2b">OpenGVLab: InternVL3 2B</option>
                    <option value="deepseek-prover-v2">DeepSeek: Prover V2</option>
                    <option value="qwen3-30b-a3b">Qwen: Qwen3 30B A3B</option>
                    <option value="qwen3-8b">Qwen: Qwen3 8B</option>
                    <option value="qwen3-14b">Qwen: Qwen3 14B</option>
                    <option value="qwen3-32b">Qwen: Qwen3 32B</option>
                    <option value="qwen3-235b-a22b">Qwen: Qwen3 235B A22B</option>
                    <option value="deepseek-r1t-chimera">TNG: DeepSeek R1T Chimera</option>
                    <option value="mai-ds-r1">Microsoft: MAI DS R1</option>
                    <option value="glm-z1-32b">THUDM: GLM Z1 32B</option>
                    <option value="glm-4-32b">THUDM: GLM 4 32B</option>
                    <option value="shisa-v2-llama3.3-70b">Shisa AI: Shisa V2 Llama 3.3 70B</option>
                    <option value="qwq-32b-arliai-rpr-v1">ArliAI: QwQ 32B RPR V1</option>
                    <option value="deepcoder-14b-preview">Agentica: Deepcoder 14B Preview</option>
                    <option value="kimi-vl-a3b-thinking">Moonshot AI: Kimi VL A3B Thinking</option>
                    <option value="llama-3.3-nemotron-super-49b-v1">NVIDIA: Llama 3.3 Nemotron Super 49B V1</option>
                    <option value="llama-3.1-nemotron-ultra-253b-v1">NVIDIA: Llama 3.1 Nemotron Ultra 253B V1</option>
                    <option value="llama-4-maverick">Meta: Llama 4 Maverick</option>
                    <option value="llama-4-scout">Meta: Llama 4 Scout</option>
                    <option value="deepseek-v3-base">DeepSeek: DeepSeek V3 Base</option>
                    <option value="qwen2.5-vl-3b-instruct">Qwen: Qwen2.5 VL 3B Instruct</option>
                    <option value="gemini-2.5-pro-exp">Google: Gemini 2.5 Pro Experimental</option>
                    <option value="qwen2.5-vl-32b-instruct">Qwen: Qwen2.5 VL 32B Instruct</option>
                    <option value="deepseek-chat-v3-0324">DeepSeek: DeepSeek Chat V3 0324</option>
                    <option value="qwerky-72b">Qwerky 72B</option>
                    <option value="mistral-small-3.1-24b">Mistral: Mistral Small 3.1 24B</option>
                    <option value="olympiccoder-32b">OlympicCoder 32B</option>
                    <option value="gemma-3-1b">Google: Gemma 3 1B</option>
                    <option value="gemma-3-4b">Google: Gemma 3 4B</option>
                    <option value="gemma-3-12b">Google: Gemma 3 12B</option>
                    <option value="reka-flash-3">Reka: Flash 3</option>
                    <option value="gemma-3-27b">Google: Gemma 3 27B</option>
                    <option value="deepseek-r1-zero">DeepSeek: DeepSeek R1 Zero</option>
                    <option value="qwq-32b">Qwen: QwQ 32B</option>
                    <option value="moonlight-16b-a3b-instruct">Moonshot AI: Moonlight 16B A3B Instruct</option>
                    <option value="deephermes-3-llama-3-8b-preview">Nous: DeepHermes 3 Llama 3 8B Preview</option>
                    <option value="dolphin3.0-r1-mistral-24b">Dolphin 3.0 R1 Mistral 24B</option>
                    <option value="dolphin3.0-mistral-24b">Dolphin 3.0 Mistral 24B</option>
                    <option value="qwen2.5-vl-72b-instruct">Qwen: Qwen2.5 VL 72B Instruct</option>
                    <option value="mistral-small-24b-instruct">Mistral: Mistral Small 24B Instruct</option>
                    <option value="deepseek-r1-distill-qwen-32b">DeepSeek: R1 Distill Qwen 32B</option>
                    <option value="deepseek-r1-distill-qwen-14b">DeepSeek: R1 Distill Qwen 14B</option>
                    <option value="deepseek-r1-distill-llama-70b">DeepSeek: R1 Distill Llama 70B</option>
                    <option value="deepseek-r1">DeepSeek: R1</option>
                    <option value="deepseek-chat">DeepSeek: DeepSeek Chat</option>
                    <option value="gemini-2.0-flash-exp">Google: Gemini 2.0 Flash Experimental</option>
                    <option value="llama-3.3-70b-instruct">Meta: Llama 3.3 70B Instruct</option>
                    <option value="qwen-2.5-coder-32b-instruct">Qwen: Qwen 2.5 Coder 32B Instruct</option>
                    <option value="qwen-2.5-7b-instruct">Qwen: Qwen 2.5 7B Instruct</option>
                    <option value="llama-3.2-3b-instruct">Meta: Llama 3.2 3B Instruct</option>
                    <option value="llama-3.2-11b-vision-instruct">Meta: Llama 3.2 11B Vision Instruct</option>
                    <option value="llama-3.2-1b-instruct">Meta: Llama 3.2 1B Instruct</option>
                    <option value="qwen-2.5-72b-instruct">Qwen: Qwen 2.5 72B Instruct</option>
                    <option value="qwen-2.5-vl-7b-instruct">Qwen: Qwen 2.5 VL 7B Instruct</option>
                    <option value="llama-3.1-405b">Meta: Llama 3.1 405B</option>
                    <option value="llama-3.1-8b-instruct">Meta: Llama 3.1 8B Instruct</option>
                    <option value="mistral-nemo">Mistral: Mistral Nemo</option>
                    <option value="gemma-2-9b">Google: Gemma 2 9B</option>
                    <option value="mistral-7b-instruct">Mistral: Mistral 7B Instruct</option>
                  </select>
                  <div className="mt-2 text-xs text-gray-500">
                    Currently selected: <span className="font-medium text-blue-600">{getLlmDisplayName(llm)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleAnalyze}
                disabled={!uploadedFile || !jobDescription.trim() || isAnalyzing}
                className={`text-lg px-12 py-4 rounded-md transition-colors flex items-center justify-center mx-auto ${
                  !uploadedFile || !jobDescription.trim() || isAnalyzing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing with {getLlmDisplayName(llm)}
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Analyze ATS Compatibility
                  </>
                )}
              </button>
              {(!uploadedFile || !jobDescription.trim()) && (
                <p className="text-sm text-gray-500 mt-2">
                  Please upload a resume and add a job description to continue
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">ATS Analysis Results</h1>
              <p className="text-xl text-gray-600">Here&apos;s how your resume performs against the job requirements</p>
              <p className="text-sm text-gray-500 mt-2">Analyzed using {getLlmDisplayName(llm)}</p>
            </div>

            {parsedResults && (
              <>
                <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                  <div className="p-8 text-center">
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBg(parsedResults.overallScore)} mb-6`}>
                      <span className={`text-4xl font-bold ${getScoreColor(parsedResults.overallScore)}`}>
                        {parsedResults.overallScore}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall ATS Score</h2>
                    <p className="text-gray-600 mb-6">
                      {parsedResults.overallScore >= 80
                        ? "Excellent! Your resume is highly ATS-compatible."
                        : parsedResults.overallScore >= 60
                        ? "Good score with room for improvement."
                        : "Needs improvement to pass ATS screening."}
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </button>
                      <button onClick={resetAnalysis} className="border border-gray-300 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-md transition-colors flex items-center">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        New Analysis
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex border-b border-gray-200">
                    <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">Overview</button>
                    <button className="px-4 py-2 text-gray-500 hover:text-blue-600">Suggestions</button>
                    <button className="px-4 py-2 text-gray-500 hover:text-blue-600">Detailed Analysis</button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <Target className="w-5 h-5 text-blue-600 mr-2" />
                              <span className="font-medium">Match Score</span>
                            </div>
                            <span className={`font-bold ${getScoreColor(parsedResults.overallScore)}`}>
                              {parsedResults.overallScore}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className={`h-2.5 rounded-full ${getScoreColor(parsedResults.overallScore).replace("text", "bg")}`} style={{ width: `${parsedResults.overallScore}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <Zap className="w-5 h-5 text-green-600 mr-2" />
                              <span className="font-medium">Improvements</span>
                            </div>
                            <span className="font-bold text-blue-600">{parsedResults.suggestions.length}</span>
                          </div>
                          <p className="text-sm text-gray-600">Actionable suggestions available</p>
                        </div>
                      </div>

                      <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                              <span className="font-medium">Potential</span>
                            </div>
                            <span className="font-bold text-green-600">+{Math.floor(Math.random() * 15) + 10}%</span>
                          </div>
                          <p className="text-sm text-gray-600">Score improvement possible</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {parsedResults.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="rounded-lg shadow-lg border border-gray-200 bg-white">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                              <span className="font-medium">{suggestion.category}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center rounded-md ${getPriorityColor(suggestion.priority)} px-2 py-1 text-xs font-medium`}>
                                {suggestion.priority} Priority
                              </span>
                              <span className="inline-flex items-center rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-600">
                                {suggestion.impact}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700">{suggestion.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                      <div className="p-6">
                        <div className="flex items-center mb-4">
                          <Eye className="w-5 h-5 mr-2 text-blue-600" />
                          <h3 className="text-lg font-semibold">Complete AI Analysis</h3>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                            {parsedResults.rawResponse}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      <h3 className="text-lg font-semibold">Improved Resume</h3>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="resume">
                        <div className="section mb-6">
                          <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                          <p><strong>Name:</strong> John Doe</p>
                          <p><strong>Email:</strong> john.doe@example.com</p>
                          <p><strong>Phone:</strong> (123) 456-7890</p>
                          <p><strong>Address:</strong> 123 Main St, Anytown, USA</p>
                        </div>
                        <div className="section mb-6">
                          <h2 className="text-xl font-bold mb-4">Professional Summary</h2>
                          <p>A highly skilled and experienced Senior Frontend Developer with over 5 years of experience in React, TypeScript, and Node.js. Proven track record of delivering high-quality web applications and leading development teams to success.</p>
                        </div>
                        <div className="section mb-6">
                          <h2 className="text-xl font-bold mb-4">Work Experience</h2>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">Senior Frontend Developer</h3>
                            <p><strong>Company:</strong> Tech Solutions Inc.</p>
                            <p><strong>Dates:</strong> January 2018 - Present</p>
                            <ul className="list-disc pl-5">
                              <li>Developed and maintained web applications using React, TypeScript, and Node.js.</li>
                              <li>Led a team of 5 developers to deliver high-quality software on schedule.</li>
                              <li>Implemented modern development practices and tools to improve team productivity.</li>
                              <li>Collaborated with designers and backend developers to create seamless user experiences.</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">Frontend Developer</h3>
                            <p><strong>Company:</strong> Web Development Co.</p>
                            <p><strong>Dates:</strong> June 2015 - December 2017</p>
                            <ul className="list-disc pl-5">
                              <li>Developed responsive web applications using HTML, CSS, and JavaScript.</li>
                              <li>Worked closely with designers to implement pixel-perfect UI designs.</li>
                              <li>Optimized web applications for performance and scalability.</li>
                              <li>Participated in code reviews and provided constructive feedback to peers.</li>
                            </ul>
                          </div>
                        </div>
                        <div className="section mb-6">
                          <h2 className="text-xl font-bold mb-4">Education</h2>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">Bachelor of Science in Computer Science</h3>
                            <p><strong>Institution:</strong> University of Anytown</p>
                            <p><strong>Dates:</strong> September 2011 - May 2015</p>
                          </div>
                        </div>
                        <div className="section mb-6">
                          <h2 className="text-xl font-bold mb-4">Skills</h2>
                          <ul className="list-disc pl-5">
                            <li>React</li>
                            <li>TypeScript</li>
                            <li>Node.js</li>
                            <li>HTML</li>
                            <li>CSS</li>
                            <li>JavaScript</li>
                            <li>AWS</li>
                            <li>Docker</li>
                            <li>Git</li>
                            <li>Agile Development</li>
                          </ul>
                        </div>
                        <div className="section mb-6">
                          <h2 className="text-xl font-bold mb-4">Certifications</h2>
                          <ul className="list-disc pl-5">
                            <li>AWS Certified Developer - Associate</li>
                            <li>Certified Scrum Master (CSM)</li>
                          </ul>
                        </div>
                        <div className="section">
                          <h2 className="text-xl font-bold mb-4">Projects</h2>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">E-commerce Platform</h3>
                            <p>A full-featured e-commerce platform developed using React, TypeScript, and Node.js. The platform includes features such as product listings, shopping cart, checkout, and user authentication.</p>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">Social Media Dashboard</h3>
                            <p>A social media dashboard that allows users to manage multiple social media accounts from a single interface. The dashboard includes features such as post scheduling, analytics, and engagement tracking.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
