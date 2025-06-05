"use client"
import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  Upload,
  FileText,
  Target,
  CheckCircle,
  Eye,
  RotateCcw,
  Lightbulb,
  Clock,
  Brain,
  Zap,
  Settings,
  TrendingUp,
  Award,
  AlertCircle,
  Star,
  Users,
  BookOpen,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

interface AnalysisResults {
  aiAnalysis: string
  improvedResume: string
}

interface ParsedAnalysis {
  score: number
  skillsMatching: {
    matching: string[]
    missing: string[]
    score: number
  }
  experienceMatching: {
    relevant: string[]
    missing: string[]
    score: number
  }
  educationMatching: {
    matching: string[]
    missing: string[]
    score: number
  }
  recommendations: {
    skillsToAdd: string[]
    experienceToHighlight: string[]
    educationToInclude: string[]
    formatting: string[]
  }
  strengths: string[]
  weaknesses: string[]
  overallFit: string
}

export default function ATSAnalyzePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [llm, setLlm] = useState("claude")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [atsResults, setAtsResults] = useState<AnalysisResults | null>(null)
  const [parsedAnalysis, setParsedAnalysis] = useState<ParsedAnalysis | null>(null)
  const improvedResumeRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (analysisComplete && improvedResumeRef.current) {
      improvedResumeRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [analysisComplete])

  const parseAnalysisText = (analysisText: string): ParsedAnalysis => {
    const scoreMatch =
      analysisText.match(/Total Score:\s*(\d+)\/100/i) ||
      analysisText.match(/Score:\s*(\d+)\/100/i) ||
      analysisText.match(/(\d+)\/100/)
    const score = scoreMatch ? Number.parseInt(scoreMatch[1]) : 0

    const extractBulletPoints = (text: string, startPattern: RegExp, endPattern?: RegExp): string[] => {
      const startMatch = text.match(startPattern)
      if (!startMatch) return []

      let content = text.substring(startMatch.index! + startMatch[0].length)

      if (endPattern) {
        const endMatch = content.match(endPattern)
        if (endMatch) {
          content = content.substring(0, endMatch.index)
        }
      }

      const lines = content.split("\n")
      const items: string[] = []

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
          items.push(
            trimmed
              .replace(/^[-•*]\s+/, "")
              .replace(/^\d+\.\s+/, "")
              .trim(),
          )
        } else if (trimmed && !trimmed.match(/^[A-Z][^:]*:/) && items.length > 0) {
          items[items.length - 1] += " " + trimmed
        }
      }

      return items.filter((item) => item.length > 0)
    }

    const skillsMatchingSection =
      analysisText.match(/Skills Matching[\s\S]*?(?=Experience Matching|Education Matching|Scoring|$)/i)?.[0] || ""
    const matchingSkills = extractBulletPoints(skillsMatchingSection, /Matching Skills?:/i, /Missing Skills?:/i)
    const missingSkills = extractBulletPoints(
      skillsMatchingSection,
      /Missing Skills?:/i,
      /Experience Matching|Education Matching|Scoring/i,
    )
    const skillsScore = skillsMatchingSection.match(/(\d+)\/40/)?.[1]
      ? Number.parseInt(skillsMatchingSection.match(/(\d+)\/40/)![1])
      : Math.round(score * 0.4)

    const experienceSection =
      analysisText.match(/Experience Matching[\s\S]*?(?=Education Matching|Scoring|Recommendations|$)/i)?.[0] || ""
    const relevantExperience = extractBulletPoints(experienceSection, /Relevant Experience:/i, /Missing Experience:/i)
    const missingExperience = extractBulletPoints(
      experienceSection,
      /Missing Experience:/i,
      /Education Matching|Scoring|Recommendations/i,
    )
    const experienceScore = experienceSection.match(/(\d+)\/30/)?.[1]
      ? Number.parseInt(experienceSection.match(/(\d+)\/30/)![1])
      : Math.round(score * 0.3)

    const educationSection =
      analysisText.match(/Education Matching[\s\S]*?(?=Scoring|Recommendations|Summary|$)/i)?.[0] || ""
    const matchingEducation = extractBulletPoints(educationSection, /Matching Education:/i, /Missing Education:/i)
    const missingEducation = extractBulletPoints(
      educationSection,
      /Missing Education:/i,
      /Scoring|Recommendations|Summary/i,
    )
    const educationScore = educationSection.match(/(\d+)\/20/)?.[1]
      ? Number.parseInt(educationSection.match(/(\d+)\/20/)![1])
      : Math.round(score * 0.2)

    const recommendationsSection = analysisText.match(/Recommendations:[\s\S]*?(?=Summary|Create an|$)/i)?.[0] || ""
    const skillsToAdd = extractBulletPoints(
      recommendationsSection,
      /Skills to Add:/i,
      /Experience to Highlight:|Education to Include:|Formatting|Summary/i,
    )
    const experienceToHighlight = extractBulletPoints(
      recommendationsSection,
      /Experience to Highlight:/i,
      /Education to Include:|Formatting|Summary/i,
    )
    const educationToInclude = extractBulletPoints(
      recommendationsSection,
      /Education to Include:/i,
      /Formatting|Summary/i,
    )
    const formatting = extractBulletPoints(recommendationsSection, /Formatting and Presentation:/i, /Summary/i)

    const summarySection = analysisText.match(/Summary:[\s\S]*?(?=Create an|$)/i)?.[0] || ""
    const strengths = extractBulletPoints(summarySection, /Strengths:/i, /Weaknesses:|Overall Fit:/i)
    const weaknesses = extractBulletPoints(summarySection, /Weaknesses:/i, /Overall Fit:/i)
    const overallFitMatch = summarySection.match(/Overall Fit:[\s\S]*?(?=Create an|\n\n|$)/i)
    const overallFit = overallFitMatch ? overallFitMatch[0].replace(/Overall Fit:\s*/i, "").trim() : ""

    return {
      score,
      skillsMatching: {
        matching: matchingSkills,
        missing: missingSkills,
        score: skillsScore,
      },
      experienceMatching: {
        relevant: relevantExperience,
        missing: missingExperience,
        score: experienceScore,
      },
      educationMatching: {
        matching: matchingEducation,
        missing: missingEducation,
        score: educationScore,
      },
      recommendations: {
        skillsToAdd,
        experienceToHighlight,
        educationToInclude,
        formatting,
      },
      strengths,
      weaknesses,
      overallFit,
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="w-6 h-6 text-green-600" />
    if (score >= 60) return <TrendingUp className="w-6 h-6 text-yellow-600" />
    return <AlertCircle className="w-6 h-6 text-red-600" />
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  const handleChooseFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleAnalyze = async () => {
    if (!uploadedFile || !jobDescription.trim()) return

    setIsAnalyzing(true)

    const formData = new FormData()
    formData.append("resume", uploadedFile)
    formData.append("jobDescription", jobDescription)
    formData.append("llm", llm)

    try {
      const response = await fetch("/api/v1/match", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setAtsResults(data)
      setParsedAnalysis(parseAnalysisText(data.aiAnalysis))
      setAnalysisComplete(true)
    } catch (error) {
      console.error("Error analyzing resume:", error)
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setUploadedFile(null)
    setJobDescription("")
    setAnalysisComplete(false)
    setIsAnalyzing(false)
    setAtsResults(null)
    setParsedAnalysis(null)
  }

  const getLlmDisplayName = (llmValue: string) => {
    const llmNames = {
      claude: "Claude 3 Haiku",
      gpt: "GPT-3.5 Turbo",
      "deepseek-r1-0528-qwen3-8b": "DeepSeek R1 0528 Qwen3 8B",
      "deepseek-r1-0528": "DeepSeek R1 0528",
      "sarvam-m": "Sarvam AI: Sarvam-M",
      "devstral-small": "Mistral: Devstral Small",
      "gemma-3n-4b": "Google: Gemma 3N 4B",
      "llama-3.3-8b-instruct": "Meta: Llama 3.3 8B Instruct",
      "deephermes-3-mistral-24b-preview": "Nous: DeepHermes 3 Mistral 24B Preview",
      "phi-4-reasoning-plus": "Microsoft: Phi 4 Reasoning Plus",
      "phi-4-reasoning": "Microsoft: Phi 4 Reasoning",
      "internvl3-14b": "OpenGVLab: InternVL3 14B",
      "internvl3-2b": "OpenGVLab: InternVL3 2B",
      "deepseek-prover-v2": "DeepSeek: Prover V2",
      "qwen3-30b-a3b": "Qwen: Qwen3 30B A3B",
      "qwen3-8b": "Qwen: Qwen3 8B",
      "qwen3-14b": "Qwen: Qwen3 14B",
      "qwen3-32b": "Qwen: Qwen3 32B",
      "qwen3-235b-a22b": "Qwen: Qwen3 235B A22B",
      "deepseek-r1t-chimera": "TNG: DeepSeek R1T Chimera",
      "mai-ds-r1": "Microsoft: MAI DS R1",
      "glm-z1-32b": "THUDM: GLM Z1 32B",
      "glm-4-32b": "THUDM: GLM 4 32B",
      "shisa-v2-llama3.3-70b": "Shisa AI: Shisa V2 Llama 3.3 70B",
      "qwq-32b-arliai-rpr-v1": "ArliAI: QwQ 32B RPR V1",
      "deepcoder-14b-preview": "Agentica: Deepcoder 14B Preview",
      "kimi-vl-a3b-thinking": "Moonshot AI: Kimi VL A3B Thinking",
      "llama-3.3-nemotron-super-49b-v1": "NVIDIA: Llama 3.3 Nemotron Super 49B V1",
      "llama-3.1-nemotron-ultra-253b-v1": "NVIDIA: Llama 3.1 Nemotron Ultra 253b V1",
      "llama-4-maverick": "Meta: Llama 4 Maverick",
      "llama-4-scout": "Meta: Llama 4 Scout",
      "deepseek-v3-base": "DeepSeek: DeepSeek V3 Base",
      "qwen2.5-vl-3b-instruct": "Qwen: Qwen2.5 VL 3B Instruct",
      "gemini-2.5-pro-exp": "Google: Gemini 2.5 Pro Experimental",
      "qwen2.5-vl-32b-instruct": "Qwen: Qwen2.5 VL 32B Instruct",
      "deepseek-chat-v3-0324": "DeepSeek: DeepSeek Chat V3 0324",
      "qwerky-72b": "Qwerky 72B",
      "mistral-small-3.1-24b": "Mistral: Mistral Small 3.1 24B",
      "olympiccoder-32b": "OlympicCoder 32B",
      "gemma-3-1b": "Google: Gemma 3 1B",
      "gemma-3-4b": "Google: Gemma 3 4B",
      "gemma-3-12b": "Google: Gemma 3 12B",
      "reka-flash-3": "Reka: Flash 3",
      "gemma-3-27b": "Google: Gemma 3 27B",
      "deepseek-r1-zero": "DeepSeek: DeepSeek R1 Zero",
      "qwq-32b": "Qwen: QwQ 32B",
      "moonlight-16b-a3b-instruct": "Moonshot AI: Moonlight 16B A3B Instruct",
      "deephermes-3-llama-3-8b-preview": "Nous: DeepHermes 3 Llama 3 8B Preview",
      "dolphin3.0-r1-mistral-24b": "Dolphin 3.0 R1 Mistral 24B",
      "dolphin3.0-mistral-24b": "Dolphin 3.0 Mistral 24B",
      "qwen2.5-vl-72b-instruct": "Qwen: Qwen2.5 VL 72B Instruct",
      "mistral-small-24b-instruct": "Mistral: Mistral Small 24B Instruct",
      "deepseek-r1-distill-qwen-32b": "DeepSeek: R1 Distill Qwen 32B",
      "deepseek-r1-distill-qwen-14b": "DeepSeek: R1 Distill Qwen 14B",
      "deepseek-r1-distill-llama-70b": "DeepSeek: R1 Distill Llama 70B",
      "deepseek-r1": "DeepSeek: R1",
      "deepseek-chat": "DeepSeek: DeepSeek Chat",
      "gemini-2.0-flash-exp": "Google: Gemini 2.0 Flash Experimental",
      "llama-3.3-70b-instruct": "Meta: Llama 3.3 70B Instruct",
      "qwen-2.5-coder-32b-instruct": "Qwen: Qwen 2.5 Coder 32B Instruct",
      "qwen-2.5-7b-instruct": "Qwen: Qwen 2.5 7B Instruct",
      "llama-3.2-3b-instruct": "Meta: Llama 3.2 3B Instruct",
      "llama-3.2-11b-vision-instruct": "Meta: Llama 3.2 11B Vision Instruct",
      "llama-3.2-1b-instruct": "Meta: Llama 3.2 1B Instruct",
      "qwen-2.5-72b-instruct": "Qwen: Qwen 2.5 72B Instruct",
      "qwen-2.5-vl-7b-instruct": "Qwen: Qwen 2.5 VL 7B Instruct",
      "llama-3.1-405b": "Meta: Llama 3.1 405B",
      "llama-3.1-8b-instruct": "Meta: Llama 3.1 8B Instruct",
      "mistral-nemo": "Mistral: Mistral Nemo",
      "gemma-2-9b": "Google: Gemma 2 9B",
      "mistral-7b-instruct": "Mistral: Mistral 7B Instruct",
    }
    return llmNames[llmValue as keyof typeof llmNames] || llmValue
  }

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
                ANORA
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
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
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
                    onClick={handleChooseFileClick}
                  >
                    {uploadedFile ? (
                      <div className="space-y-4">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        <div>
                          <p className="font-medium text-green-700">{uploadedFile.name}</p>
                          <p className="text-sm text-green-600">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadedFile(null)
                          }}
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
                        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md transition-colors">
                          Choose File
                        </button>
                        <p className="text-xs text-gray-400">Supports PDF, Word, and text files up to 10MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
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
                    <option value="llama-3.1-nemotron-ultra-253b-v1">NVIDIA: Llama 3.1 Nemotron Ultra 253b V1</option>
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

            {parsedAnalysis && (
              <>
                <div className={`rounded-lg border-2 p-8 text-center ${getScoreColor(parsedAnalysis.score)}`}>
                  <div className="flex items-center justify-center mb-4">
                    {getScoreIcon(parsedAnalysis.score)}
                    <h2 className="text-3xl font-bold ml-3">Overall ATS Score</h2>
                  </div>
                  <div className="text-6xl font-bold mb-2">{parsedAnalysis.score}/100</div>
                  <p className="text-lg">
                    {parsedAnalysis.score >= 80
                      ? "Excellent Match!"
                      : parsedAnalysis.score >= 60
                        ? "Good Match with Room for Improvement"
                        : "Needs Significant Improvement"}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <Zap className="w-6 h-6 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold">Skills Matching</h3>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {parsedAnalysis.skillsMatching.score}/40
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">
                          Matching Skills ({parsedAnalysis.skillsMatching.matching.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {parsedAnalysis.skillsMatching.matching.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {parsedAnalysis.skillsMatching.matching.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{parsedAnalysis.skillsMatching.matching.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">
                          Missing Skills ({parsedAnalysis.skillsMatching.missing.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {parsedAnalysis.skillsMatching.missing.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {parsedAnalysis.skillsMatching.missing.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{parsedAnalysis.skillsMatching.missing.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <Briefcase className="w-6 h-6 text-purple-600 mr-2" />
                      <h3 className="text-lg font-semibold">Experience Matching</h3>
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {parsedAnalysis.experienceMatching.score}/30
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">
                          Relevant Experience ({parsedAnalysis.experienceMatching.relevant.length})
                        </p>
                        <div className="text-xs text-gray-600">
                          {parsedAnalysis.experienceMatching.relevant.slice(0, 2).map((exp, index) => (
                            <div key={index} className="mb-1 p-2 bg-green-50 rounded">
                              {exp.substring(0, 80)}...
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">
                          Missing Experience ({parsedAnalysis.experienceMatching.missing.length})
                        </p>
                        <div className="text-xs text-gray-600">
                          {parsedAnalysis.experienceMatching.missing.slice(0, 2).map((exp, index) => (
                            <div key={index} className="mb-1 p-2 bg-red-50 rounded">
                              {exp.substring(0, 80)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <BookOpen className="w-6 h-6 text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold">Education Matching</h3>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {parsedAnalysis.educationMatching.score}/20
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">
                          Matching Education ({parsedAnalysis.educationMatching.matching.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {parsedAnalysis.educationMatching.matching.map((edu, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {edu}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">
                          Missing Education ({parsedAnalysis.educationMatching.missing.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {parsedAnalysis.educationMatching.missing.map((edu, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                            >
                              {edu}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {(parsedAnalysis.recommendations.skillsToAdd.length > 0 ||
                  parsedAnalysis.recommendations.experienceToHighlight.length > 0 ||
                  parsedAnalysis.strengths.length > 0 ||
                  parsedAnalysis.weaknesses.length > 0) && (
                  <>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center mb-6">
                        <Lightbulb className="w-6 h-6 text-yellow-600 mr-2" />
                        <h3 className="text-xl font-semibold">Recommendations for Improvement</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        {parsedAnalysis.recommendations.skillsToAdd.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-blue-600 mb-3 flex items-center">
                              <Zap className="w-4 h-4 mr-1" />
                              Skills to Add
                            </h4>
                            <ul className="space-y-2">
                              {parsedAnalysis.recommendations.skillsToAdd.map((skill, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-sm text-gray-700">{skill}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {parsedAnalysis.recommendations.experienceToHighlight.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-purple-600 mb-3 flex items-center">
                              <Briefcase className="w-4 h-4 mr-1" />
                              Experience to Highlight
                            </h4>
                            <ul className="space-y-2">
                              {parsedAnalysis.recommendations.experienceToHighlight.map((exp, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-sm text-gray-700">{exp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {(parsedAnalysis.strengths.length > 0 || parsedAnalysis.weaknesses.length > 0) && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {parsedAnalysis.strengths.length > 0 && (
                          <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                            <div className="flex items-center mb-4">
                              <Star className="w-6 h-6 text-green-600 mr-2" />
                              <h3 className="text-lg font-semibold text-green-800">Strengths</h3>
                            </div>
                            <ul className="space-y-2">
                              {parsedAnalysis.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                                  <span className="text-sm text-green-700">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {parsedAnalysis.weaknesses.length > 0 && (
                          <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                            <div className="flex items-center mb-4">
                              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
                              <h3 className="text-lg font-semibold text-red-800">Areas for Improvement</h3>
                            </div>
                            <ul className="space-y-2">
                              {parsedAnalysis.weaknesses.map((weakness, index) => (
                                <li key={index} className="flex items-start">
                                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                                  <span className="text-sm text-red-700">{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {parsedAnalysis.overallFit && (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                    <div className="flex items-center mb-4">
                      <Users className="w-6 h-6 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-blue-800">Overall Fit Assessment</h3>
                    </div>
                    <p className="text-blue-700">{parsedAnalysis.overallFit}</p>
                  </div>
                )}
              </>
            )}

            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="text-lg font-semibold">Complete AI Analysis</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {atsResults?.aiAnalysis}
                  </pre>
                </div>
              </div>
            </div>

            <div ref={improvedResumeRef} className="rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="text-lg font-semibold">Improved Part</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {atsResults?.improvedResume}
                  </pre>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={resetAnalysis}
                className="border border-gray-300 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-md transition-colors flex items-center mx-auto"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
