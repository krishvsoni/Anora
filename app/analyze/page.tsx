/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Target,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Download,
  RotateCcw,
  Lightbulb,
  Award,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function ATSAnalyzePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
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
  formData.append("llm", "claude");

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
    const errorMessage = typeof error === "object" && error !== null && "message" in error
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
              <button className="border border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Sample Resume
              </button>
              <button onClick={resetAnalysis} className="text-gray-600 hover:text-blue-600 flex items-center">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Analysis
              </button>
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
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full min-h-[300px] p-4 border border-gray-200 rounded-md resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                    Analyzing Resume...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 mr-2" />
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
            </div>

            {atsResults && (
              <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                <div className="p-8 text-center">
                  <div className="mb-6">
                    <pre className="text-gray-700 whitespace-pre-wrap">{atsResults}</pre>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </button>
                    <button
                      onClick={resetAnalysis}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-md transition-colors flex items-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New Analysis
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
