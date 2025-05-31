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

    const [atsResults] = useState({
        overallScore: 78,
        keywordMatch: 65,
        formatting: 85,
        experience: 80,
        skills: 70,
        education: 90,
        matchedKeywords: ["JavaScript", "React", "Node.js", "TypeScript", "AWS", "Git", "Agile"],
        missingKeywords: ["Docker", "Kubernetes", "GraphQL", "MongoDB", "CI/CD", "Jest", "Redux"],
        suggestions: [
            {
                category: "Keywords",
                priority: "High",
                suggestion:
                    "Add 'Docker' and 'Kubernetes' to your skills section as they appear 5 times in the job description.",
                impact: "+8 points",
            },
            {
                category: "Experience",
                priority: "Medium",
                suggestion:
                    "Include specific metrics and achievements in your work experience (e.g., 'Improved performance by 40%').",
                impact: "+5 points",
            },
            {
                category: "Skills",
                priority: "High",
                suggestion: "Add 'GraphQL' and 'MongoDB' to match the required technical stack.",
                impact: "+6 points",
            },
            {
                category: "Formatting",
                priority: "Low",
                suggestion: "Use bullet points consistently throughout your resume for better ATS parsing.",
                impact: "+2 points",
            },
        ],
    });

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
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setIsAnalyzing(false);
        setAnalysisComplete(true);
    };

    const resetAnalysis = () => {
        setUploadedFile(null);
        setJobDescription("");
        setAnalysisComplete(false);
        setIsAnalyzing(false);
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
                                        placeholder="Paste the job description here... Example: We are looking for a Senior Frontend Developer with 5+ years of experience in React, TypeScript, and Node.js. The ideal candidate should have experience with AWS, Docker, and modern development practices..."
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

                        <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                            <div className="p-8 text-center">
                                <div
                                    className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBg(
                                        atsResults.overallScore
                                    )} mb-6`}
                                >
                                    <span className={`text-4xl font-bold ${getScoreColor(atsResults.overallScore)}`}>
                                        {atsResults.overallScore}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall ATS Score</h2>
                                <p className="text-gray-600 mb-6">
                                    {atsResults.overallScore >= 80
                                        ? "Excellent! Your resume is highly ATS-compatible."
                                        : atsResults.overallScore >= 60
                                        ? "Good score with room for improvement."
                                        : "Needs improvement to pass ATS screening."}
                                </p>
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

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: "Keyword Match", score: atsResults.keywordMatch, icon: Target },
                                { label: "Formatting", score: atsResults.formatting, icon: FileText },
                                { label: "Experience", score: atsResults.experience, icon: Award },
                                { label: "Skills", score: atsResults.skills, icon: TrendingUp },
                                { label: "Education", score: atsResults.education, icon: CheckCircle },
                            ].map((item, index) => (
                                <div key={index} className="rounded-lg shadow-lg border border-gray-200 bg-white">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center">
                                                <item.icon className="w-5 h-5 mr-2 text-blue-600" />
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            <span className={`font-bold ${getScoreColor(item.score)}`}>{item.score}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full ${getScoreColor(item.score).replace("text", "bg")}`}
                                                style={{ width: `${item.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <div className="flex border-b border-gray-200">
                                <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">Keywords</button>
                                <button className="px-4 py-2 text-gray-500 hover:text-blue-600">Suggestions</button>
                                <button className="px-4 py-2 text-gray-500 hover:text-blue-600">Insights</button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                                        <div className="p-6">
                                            <div className="flex items-center mb-4">
                                                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                                                <h3 className="text-lg font-semibold text-green-700">
                                                    Matched Keywords ({atsResults.matchedKeywords.length})
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {atsResults.matchedKeywords.map((keyword, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                                        <div className="p-6">
                                            <div className="flex items-center mb-4">
                                                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                                                <h3 className="text-lg font-semibold text-red-700">
                                                    Missing Keywords ({atsResults.missingKeywords.length})
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {atsResults.missingKeywords.map((keyword, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {atsResults.suggestions.map((suggestion, index) => (
                                    <div key={index} className="rounded-lg shadow-lg border border-gray-200 bg-white">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
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

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                                    <div className="p-6">
                                        <div className="flex items-center mb-4">
                                            <Eye className="w-5 h-5 mr-2 text-blue-600" />
                                            <h3 className="text-lg font-semibold">Resume Insights</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span>Total Words:</span>
                                                <span className="font-medium">847</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Sections Found:</span>
                                                <span className="font-medium">6</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Contact Info:</span>
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Work Experience:</span>
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Skills Section:</span>
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                                    <div className="p-6">
                                        <div className="flex items-center mb-4">
                                            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                                            <h3 className="text-lg font-semibold">Job Match Analysis</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span>Required Skills Match:</span>
                                                <span className="font-medium">7/12</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Experience Level:</span>
                                                <span className="font-medium text-green-600">Match</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Education Requirements:</span>
                                                <span className="font-medium text-green-600">Exceeds</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Industry Keywords:</span>
                                                <span className="font-medium text-yellow-600">Partial</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
