'use client';

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Sparkles } from 'lucide-react';

const suggestions = [
  "Show me the average package by department",
  "What is the distribution of CPI scores?",
  "Compare internship completion rates across departments",
  "Show placement rates by company",
  "Analyze the correlation between CPI and package",
  "What are the top 5 companies by placement count?"
];

interface SuggestedQueriesProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function SuggestedQueries({ onSuggestionClick }: SuggestedQueriesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Suggested Queries</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: index * 0.1 }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestionClick(suggestion)}
            className="p-3 text-left rounded-lg bg-card hover:bg-accent transition-colors border text-sm"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
