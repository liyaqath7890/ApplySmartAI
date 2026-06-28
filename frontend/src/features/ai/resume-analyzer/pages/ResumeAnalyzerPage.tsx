import { useState } from 'react';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export default function ResumeAnalyzerPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysis({
        score: 85,
        strengths: [
          'Strong technical skills section',
          'Clear work experience progression',
          'Good use of action verbs',
          'Quantifiable achievements included',
        ],
        improvements: [
          'Add more specific metrics to achievements',
          'Include relevant certifications',
          'Shorten the summary section',
          'Add a projects section',
        ],
        skillsMatch: {
          technical: 90,
          soft: 75,
          industry: 80,
        },
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">AI Resume Analyzer</h1>
        <p className="text-dark-600">
          Upload your resume and get AI-powered feedback to improve your chances
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Upload Resume</h2>
          
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-dark-300 hover:border-dark-400'
              }`}
            >
              <FileText className="h-12 w-12 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-700 font-medium mb-2">
                Drag and drop your resume here
              </p>
              <p className="text-dark-500 text-sm mb-4">or</p>
              <label className="btn btn-primary cursor-pointer">
                Browse Files
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
              <p className="text-dark-400 text-xs mt-4">
                Supports PDF, DOC, DOCX (max 10MB)
              </p>
            </div>
          ) : (
            <div className="bg-dark-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary-600" />
                <div>
                  <p className="font-medium text-dark-900">{file.name}</p>
                  <p className="text-sm text-dark-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFile(null)}
                  className="btn btn-secondary text-sm"
                >
                  Remove
                </button>
                <button
                  onClick={analyzeResume}
                  disabled={isAnalyzing}
                  className="btn btn-primary text-sm"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        <div className="card">
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Analysis Results</h2>
          
          {!analysis ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-dark-300 mx-auto mb-4" />
              <p className="text-dark-500">
                Upload a resume to see AI-powered analysis
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary-100 mb-2">
                  <span className="text-3xl font-bold text-primary-600">{analysis.score}</span>
                </div>
                <p className="text-dark-500">Overall Score</p>
              </div>

              {/* Strengths */}
              <div>
                <h3 className="font-medium text-dark-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-dark-600">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div>
                <h3 className="font-medium text-dark-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-dark-600">
                      <span className="text-yellow-500 mt-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills Match */}
              <div>
                <h3 className="font-medium text-dark-900 mb-3">Skills Match</h3>
                <div className="space-y-3">
                  {Object.entries(analysis.skillsMatch).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-dark-600 capitalize">{key}</span>
                        <span className="text-dark-900 font-medium">{String(value)}%</span>
                      </div>
                      <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}