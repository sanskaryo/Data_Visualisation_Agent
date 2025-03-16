"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import {
  generateChartConfig,
  generateQuery,
  runGenerateSQLQuery,
  getTableInfo
} from "./actions";
import { Config, Result } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProjectInfo } from "@/components/project-info";
import { Results } from "@/components/results";
import { SuggestedQueries } from "@/components/suggested-queries";
import { QueryViewer } from "@/components/query-viewer";
import { Search } from "@/components/search";
import { FileUpload } from '@/components/file-upload';
import { ChatPanel } from '@/components/chat-panel';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [chartConfig, setChartConfig] = useState<Config | null>(null);
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<any>(null);

  const handleSubmit = async (suggestion?: string) => {
    const question = suggestion ?? inputValue;
    if (!question.trim()) return;

    setSubmitted(true);
    setLoading(true);
    setLoadingStep(1);
    setActiveQuery("");
    
    try {
      if (!currentTable) {
        toast.error("Please upload a CSV file first");
        setLoading(false);
        return;
      }

      const query = await generateQuery(question, currentTable);
      if (!query) {
        toast.error("Failed to generate query. Please try again.");
        setLoading(false);
        return;
      }

      setActiveQuery(query);
      setLoadingStep(2);

      const data = await runGenerateSQLQuery(query);
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      
      setResults(data);
      setColumns(columns);
      
      const chartGeneration = await generateChartConfig(data, question);
      setChartConfig(chartGeneration.config);
      
      setLoading(false);
    } catch (error) {
      console.error('Query error:', error);
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (data: any) => {
    setCurrentTable(data.tableName);
    const info = await getTableInfo(data.tableName);
    setTableInfo(info);
    toast.success(`Uploaded ${data.rowCount} rows of data`);
  };

  const handleChatMessage = async (message: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          chartData: {
            config: chartConfig,
            results
          },
          tableInfo
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data.response;

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response');
      return 'Sorry, I encountered an error while processing your request.';
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSubmit(suggestion);
  };

  const handleClear = () => {
    setSubmitted(false);
    setInputValue("");
    setResults([]);
    setColumns([]);
    setChartConfig(null);
    setActiveQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <ProjectInfo />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* File Upload */}
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Your Data</h2>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Search and Results */}
            <div className="bg-card rounded-lg p-6">
              <Search
                handleSubmit={handleSubmit}
                inputValue={inputValue}
                setInputValue={setInputValue}
              />

              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-3 text-lg">
                    {loadingStep === 1 ? "Analyzing query..." : "Running query..."}
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {!submitted ? (
                    <SuggestedQueries onSuggestionClick={handleSuggestionClick} />
                  ) : (
                    <>
                      {activeQuery && <QueryViewer query={activeQuery} />}
                      <Suspense>
                        <Results
                          results={results}
                          columns={columns}
                          chartConfig={chartConfig}
                        />
                      </Suspense>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1 h-[calc(100vh-2rem)]">
            <ChatPanel
              onSendMessage={handleChatMessage}
              chartData={chartConfig ? { config: chartConfig, results } : undefined}
              tableInfo={tableInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
