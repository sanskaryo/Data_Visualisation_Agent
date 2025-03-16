import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DynamicChart } from './dynamic-chart';
import { Loader2, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { Config, Result } from "@/lib/types";

type ResultsProps = {
  results: Result[];
  columns: string[];
  chartConfig: Config | null;
};

export function Results({ results, columns, chartConfig }: ResultsProps) {
  const [showAll, setShowAll] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (results.length > 0 && chartConfig) {
      generateInsights();
    }
  }, [results, chartConfig]);

  const generateInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Provide a brief analysis of the data and chart, highlighting key insights and patterns.',
          chartData: {
            config: chartConfig,
            results
          }
        })
      });

      const data = await response.json();
      if (response.ok) {
        setInsights(data.response);
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const displayedResults = showAll ? results : results.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Chart Section */}
      {chartConfig && (
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Data Visualization</h3>
          </div>
          <div className="w-full aspect-[16/9]">
            <DynamicChart chartData={results} chartConfig={chartConfig} />
          </div>
          
          {/* Insights */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Key Insights</h4>
            {loadingInsights ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing data...</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{insights}</p>
            )}
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-card rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Results</h3>
          <span className="text-sm text-muted-foreground">
            {results.length} rows found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="text-left p-2 text-sm font-medium text-muted-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedResults.map((result, i) => (
                <tr
                  key={i}
                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                >
                  {columns.map((column) => (
                    <td key={column} className="p-2 text-sm">
                      {result[column]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            {showAll ? (
              <>
                Show Less
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show All
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
