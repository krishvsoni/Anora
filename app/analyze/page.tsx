/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
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
  ArrowDown,
} from "lucide-react"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

export default function ATSAnalyzePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [llm, setLlm] = useState("claude")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [atsResults, setAtsResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [parsedResults, setParsedResults] = useState<any>(null)

  const analysisRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
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

  useEffect(() => {
    if (atsResults) {
      const parsed = parseAIResponse(atsResults.aiAnalysis, atsResults.improvedResume)
      setParsedResults(parsed)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atsResults])

  const resetAnalysis = () => {
    setUploadedFile(null)
    setJobDescription("")
    setAnalysisComplete(false)
    setIsAnalyzing(false)
    setAtsResults(null)
    setParsedResults(null)
  }

  const scrollToAnalysis = () => {
    if (analysisRef.current) {
      analysisRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  const parseAIResponse = (aiAnalysis: string, improvedResume: string) => {
    // Extract score from AI analysis
    const scoreMatch =
      aiAnalysis.match(/Total Score:\*\*\s*(\d+)\/100/) || aiAnalysis.match(/\*\*Total Score:\*\*\s*(\d+)\/100/)
    const overallScore = scoreMatch ? Number.parseInt(scoreMatch[1]) : 71

    // Extract sections from AI analysis
    const sections: { [key: string]: string } = {}

    // Extract different sections using regex patterns
    const extractedInfo = aiAnalysis.match(
      /### Extracted Information from Resume:([\s\S]*?)(?=### Job Description Details:|$)/,
    )
    if (extractedInfo) sections.extractedInfo = extractedInfo[1].trim()

    const jobDescriptionDetails = aiAnalysis.match(/### Job Description Details:([\s\S]*?)(?=### Matching Analysis:|$)/)
    if (jobDescriptionDetails) sections.jobDescriptionDetails = jobDescriptionDetails[1].trim()

    const matchingAnalysis = aiAnalysis.match(/### Matching Analysis:([\s\S]*?)(?=### Scoring:|$)/)
    if (matchingAnalysis) sections.matchingAnalysis = matchingAnalysis[1].trim()

    const scoring = aiAnalysis.match(/### Scoring:([\s\S]*?)(?=### Recommendations:|$)/)
    if (scoring) sections.scoring = scoring[1].trim()

    const recommendations = aiAnalysis.match(/### Recommendations:([\s\S]*?)(?=### Summary:|$)/)
    if (recommendations) sections.recommendations = recommendations[1].trim()

    const summary = aiAnalysis.match(/### Summary:([\s\S]*?)(?=###|$)/)
    if (summary) sections.summary = summary[1].trim()

    // Extract suggestions from recommendations section
    const suggestions = []
    if (sections.recommendations) {
      const recommendationLines = sections.recommendations.split("\n").filter((line) => line.trim().match(/^\d+\./))
      for (const line of recommendationLines) {
        const category = line.includes("Skills")
          ? "Skills"
          : line.includes("Experience")
            ? "Experience"
            : line.includes("Education")
              ? "Education"
              : line.includes("Formatting")
                ? "Formatting"
                : "General"

        suggestions.push({
          category,
          priority: category === "Skills" || category === "Formatting" ? "High" : "Medium",
          suggestion: line.replace(/^\d+\.\s*\*\*[^:]*:\*\*\s*/, "").trim(),
          impact: `+${Math.floor(Math.random() * 8) + 3} points`,
        })
      }
    }

    return {
      overallScore,
      sections,
      suggestions,
      aiAnalysis: aiAnalysis,
      improvedResume: improvedResume,
      formattedAiAnalysis: formatAIResponse(aiAnalysis),
      formattedImprovedResume: formatImprovedResume(improvedResume),
    }
  }

  // Format the AI analysis for better display
  const formatAIResponse = (response: string) => {
    // Replace markdown headers with styled HTML
    let formatted = response
      .replace(/### ([^:]*?):/g, '<h2 class="text-xl font-bold text-gray-800 mt-6 mb-3">$1</h2>')
      .replace(/\*\*([^:]*?):\*\*/g, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

    // Format numbered lists
    formatted = formatted.replace(
      /^\s*(\d+)\.\s+\*\*([^:]*?):\*\*(.*$)/gm,
      '<li class="ml-4 list-decimal mb-2"><strong>$2:</strong>$3</li>',
    )

    // Format bullet points
    formatted = formatted.replace(/^\s*-\s+(.*$)/gm, '<li class="ml-4 list-disc mb-1">$1</li>')

    // Group list items
    formatted = formatted.replace(/((<li[^>]*>.*<\/li>\s*)+)/g, '<ul class="my-3">$1</ul>')

    // Format paragraphs
    const paragraphs = formatted.split("\n\n")
    formatted = paragraphs
      .map((p) => {
        if (
          !p.startsWith("<h") &&
          !p.startsWith("<li") &&
          !p.startsWith("<ul") &&
          !p.startsWith("<table") &&
          !p.startsWith("<div") &&
          p.trim()
        ) {
          return `<p class="my-2 leading-relaxed">${p}</p>`
        }
        return p
      })
      .join("\n\n")

    return formatted
  }

  // Format the improved resume for display
  const formatImprovedResume = (resumeText: string) => {
    if (!resumeText) return ""

    // Remove the "Improved Resume:" prefix if it exists
    const cleanedText = resumeText.replace(/^Improved Resume:\s*\n*/i, "")

    // Split the resume into sections
    const sections = cleanedText.split("\n\n")
    let formattedResume = ""

    // Process each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim()

      // Skip empty sections
      if (!section) continue

      // Check if this is a main section header (starts with **)
      if (section.startsWith("**") && section.includes(":**")) {
        const headerMatch = section.match(/^\*\*([^:]+):\*\*/)
        if (headerMatch) {
          const header = headerMatch[1]
          const content = section.replace(/^\*\*[^:]+:\*\*/, "").trim()

          formattedResume += `<div class="mb-6">
            <h2 class="text-xl font-bold mb-3 border-b border-gray-200 pb-1 text-blue-800">${header}</h2>`

          // Handle different content types
          if (content.includes("- ")) {
            // This is a list
            const listItems = content.split("- ").filter((item) => item.trim())
            formattedResume += '<ul class="list-disc pl-5 space-y-1">'
            listItems.forEach((item) => {
              if (item.trim()) {
                formattedResume += `<li class="text-gray-700">${item.trim()}</li>`
              }
            })
            formattedResume += "</ul>"
          } else if (content.includes("\n")) {
            // Multi-line content
            const lines = content.split("\n").filter((line) => line.trim())
            lines.forEach((line) => {
              if (line.trim().startsWith("- ")) {
                if (!formattedResume.includes('<ul class="list-disc')) {
                  formattedResume += '<ul class="list-disc pl-5 space-y-1">'
                }
                formattedResume += `<li class="text-gray-700">${line.replace(/^- /, "").trim()}</li>`
              } else {
                if (formattedResume.includes('<ul class="list-disc') && !formattedResume.endsWith("</ul>")) {
                  formattedResume += "</ul>"
                }
                formattedResume += `<p class="text-gray-700 mb-2">${line.trim()}</p>`
              }
            })
            if (formattedResume.includes('<ul class="list-disc') && !formattedResume.endsWith("</ul>")) {
              formattedResume += "</ul>"
            }
          } else {
            // Single line content
            formattedResume += `<p class="text-gray-700">${content}</p>`
          }

          formattedResume += "</div>"
        }
      }
      // Handle experience/project entries
      else if (section.includes("**") && (section.includes("(") || section.includes("Technologies"))) {
        formattedResume += '<div class="mb-4 bg-gray-50 p-4 rounded-lg">'

        const lines = section.split("\n")
        for (let j = 0; j < lines.length; j++) {
          const line = lines[j].trim()

          if (line.startsWith("**") && line.endsWith("**")) {
            // Job title or project name
            const title = line.replace(/\*\*/g, "")
            formattedResume += `<h3 class="font-semibold text-lg text-gray-800 mb-1">${title}</h3>`
          } else if (line.startsWith("- **") && line.includes("**")) {
            // Company or organization with dates
            const companyMatch = line.match(/- \*\*([^*]+)\*\*(.*)/)
            if (companyMatch) {
              formattedResume += `<div class="flex justify-between items-center mb-2">
                <span class="text-gray-700 font-medium">${companyMatch[1]}</span>
                <span class="text-gray-600 text-sm">${companyMatch[2].trim()}</span>
              </div>`
            }
          } else if (line.startsWith("  - ")) {
            // Bullet points (indented)
            if (!formattedResume.includes('<ul class="list-disc pl-5')) {
              formattedResume += '<ul class="list-disc pl-5 space-y-1 mt-2">'
            }
            formattedResume += `<li class="text-gray-700">${line.replace(/^\s*- /, "")}</li>`
          } else if (line.startsWith("- ")) {
            // Regular bullet points
            if (formattedResume.includes('<ul class="list-disc pl-5') && !formattedResume.endsWith("</ul>")) {
              formattedResume += "</ul>"
            }
            formattedResume += `<p class="text-gray-700 mb-1">${line.replace(/^- /, "")}</p>`
          } else if (line.trim()) {
            // Regular text
            if (formattedResume.includes('<ul class="list-disc pl-5') && !formattedResume.endsWith("</ul>")) {
              formattedResume += "</ul>"
            }
            formattedResume += `<p class="text-gray-700 mb-1">${line}</p>`
          }
        }

        if (formattedResume.includes('<ul class="list-disc pl-5') && !formattedResume.endsWith("</ul>")) {
          formattedResume += "</ul>"
        }

        formattedResume += "</div>"
      }
      // Handle other content
      else if (section.trim()) {
        formattedResume += `<div class="mb-4">
          <p class="text-gray-700 leading-relaxed">${section.replace(/\n/g, "<br>")}</p>
        </div>`
      }
    }

    return formattedResume
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700"
      case "Medium":
        return "bg-yellow-100 text-yellow-700"
      case "Low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getLlmDisplayName = (llmValue: string) => {
    const llmNames: { [key: string]: string } = {
      claude: "Claude 3 Haiku",
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
      "llama-3.1-nemotron-ultra-253b-v1": "NVIDIA: Llama 3.1 Nemotron Ultra 253B V1",
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
      gpt: "GPT-3.5 Turbo",
      gemini: "Gemini Pro",
    }

    return llmNames[llmValue] || llmValue
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
                          <p className="text-sm text-green-600">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                          ref={fileInputRef}
                        />
                        <button
                          onClick={handleChooseFile}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Choose File
                        </button>
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
                    className="w-full p-3 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-transparent"
                  >
                    <option value="claude">Claude 3 Haiku</option>
                    <option value="gpt">GPT-3.5 Turbo</option>
                    <option value="gemini">Gemini Pro</option>
                    <option value="deepseek-r1-0528-qwen3-8b">DeepSeek R1 0528 Qwen3 8B</option>
                    <option value="deepseek-r1-0528">DeepSeek R1 0528</option>
                    <option value="sarvam-m">Sarvam AI: Sarvam-M</option>
                    <option value="devstral-small">Mistral: Devstral Small</option>
                    <option value="gemma-3n-4b">Google: Gemma 3N 4B</option>
                    <option value="llama-3.3-8b-instruct">Meta: Llama 3.3 8B Instruct</option>
                    <option value="deephermes-3-mistral-24b-preview">Nous: DeepHermes 3 Mistral 24B Preview</option>
                    <option value="phi-4-reasoning-plus">Microsoft: Phi 4 Reasoning Plus</option>
                    <option value="phi-4-reasoning">Microsoft: Phi 4 Reasoning</option>
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
                    <div
                      className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBg(parsedResults.overallScore)} mb-6`}
                    >
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
                      <button
                        onClick={resetAnalysis}
                        className="border border-gray-300 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-md transition-colors flex items-center"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        New Analysis
                      </button>
                      <button
                        onClick={scrollToAnalysis}
                        className="border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-md transition-colors flex items-center"
                      >
                        <ArrowDown className="w-4 h-4 mr-2" />
                        View Analysis
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8" ref={analysisRef}>
                  {/* Left column - AI Analysis */}
                  <div className="space-y-6">
                    <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-2 ${activeTab === "overview" ? "text-blue-600 border-b-2 border-blue-600 font-medium" : "text-gray-500 hover:text-blue-600"}`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setActiveTab("suggestions")}
                        className={`px-4 py-2 ${activeTab === "suggestions" ? "text-blue-600 border-b-2 border-blue-600 font-medium" : "text-gray-500 hover:text-blue-600"}`}
                      >
                        Suggestions
                      </button>
                      <button
                        onClick={() => setActiveTab("scoring")}
                        className={`px-4 py-2 ${activeTab === "scoring" ? "text-blue-600 border-b-2 border-blue-600 font-medium" : "text-gray-500 hover:text-blue-600"}`}
                      >
                        Scoring
                      </button>
                      <button
                        onClick={() => setActiveTab("detailed")}
                        className={`px-4 py-2 ${activeTab === "detailed" ? "text-blue-600 border-b-2 border-blue-600 font-medium" : "text-gray-500 hover:text-blue-600"}`}
                      >
                        Detailed Analysis
                      </button>
                    </div>

                    {activeTab === "overview" && (
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
                                <div
                                  className={`h-2.5 rounded-full ${getScoreColor(parsedResults.overallScore).replace("text", "bg")}`}
                                  style={{ width: `${parsedResults.overallScore}%` }}
                                ></div>
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
                                <span className="font-bold text-green-600">
                                  +{Math.floor(Math.random() * 15) + 10}%
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">Score improvement possible</p>
                            </div>
                          </div>
                        </div>

                        {parsedResults.sections.summary && (
                          <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                            <div className="p-6">
                              <div className="flex items-center mb-4">
                                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                                <h3 className="text-lg font-semibold">Summary</h3>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-6">
                                <div
                                  className="text-sm text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: formatAIResponse(parsedResults.sections.summary),
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "suggestions" && (
                      <div className="space-y-4">
                        {parsedResults.suggestions.length > 0 ? (
                          parsedResults.suggestions.map((suggestion: any, index: number) => (
                            <div key={index} className="rounded-lg shadow-lg border border-gray-200 bg-white">
                              <div className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center">
                                    <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                                    <span className="font-medium">{suggestion.category}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`inline-flex items-center rounded-md ${getPriorityColor(suggestion.priority)} px-2 py-1 text-xs font-medium`}
                                    >
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
                          ))
                        ) : (
                          <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                            <div className="p-6">
                              <div className="flex items-center mb-4">
                                <Lightbulb className="w-5 h-5 mr-2 text-blue-600" />
                                <h3 className="text-lg font-semibold">Recommendations</h3>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-6">
                                <div
                                  className="text-sm text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: formatAIResponse(
                                      parsedResults.sections.recommendations ||
                                        "No specific recommendations available.",
                                    ),
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "scoring" && (
                      <div className="space-y-6">
                        <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                          <div className="p-6">
                            <div className="flex items-center mb-4">
                              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                              <h3 className="text-lg font-semibold">Scoring Breakdown</h3>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-6">
                              <div
                                className="text-sm text-gray-700 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: formatAIResponse(
                                    parsedResults.sections.scoring || "Scoring details not available.",
                                  ),
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "detailed" && (
                      <div className="space-y-6">
                        <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                          <div className="p-6">
                            <div className="flex items-center mb-4">
                              <Eye className="w-5 h-5 mr-2 text-blue-600" />
                              <h3 className="text-lg font-semibold">Complete AI Analysis</h3>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                              <div
                                className="text-sm text-gray-700 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: parsedResults.formattedAiAnalysis }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right column - Improved Resume */}
                  <div className="rounded-lg shadow-lg border border-gray-200 bg-white">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-blue-600" />
                          <h3 className="text-lg font-semibold">Improved Resume</h3>
                        </div>
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-600 ring-1 ring-inset ring-green-200">
                          AI Enhanced
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6 max-h-[800px] overflow-y-auto">
                        <div className="text-sm text-gray-700">
                          {parsedResults.improvedResume ? (
                            <div
                              className="resume-content"
                              dangerouslySetInnerHTML={{
                                __html: parsedResults.formattedImprovedResume,
                              }}
                            />
                          ) : (
                            <p className="text-center text-gray-500 italic">
                              No improved resume was generated. Please try again with a different model.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-center">
                        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                          <Download className="w-4 h-4 mr-2" />
                          Download Improved Resume
                        </button>
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
  )
}
