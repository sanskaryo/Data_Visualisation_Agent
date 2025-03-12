import { motion } from "framer-motion";
import { Button } from "./ui/button";

export const SuggestedQueries = ({
  handleSuggestionClick,
}: {
  handleSuggestionClick: (suggestion: string) => void;
}) => {
  const suggestionQueries = [
    
    {
      desktop: "Which company offered the highest average package?",
      mobile: "Highest package",
    },
    {
      desktop: "Get the average CPI of all placed students in IBM",
      mobile: "Company counts",
    },
   
  
    
    {
      desktop: "Package range  for different job roles",
      mobile: "Package range ",
    },
  
    {
      desktop: "Show a bar chart of the number of students placed per company",
      mobile: "Company bar chart",
    },
 

    {
      desktop: "Distribution of students who did internships before placement.",
      mobile: "Distribution of students",
    },
    {
      desktop: "Which company hired the most students?",
      mobile: "Top recruiter",
    },
  
    {
      desktop: "List students with CPI above 9.5 and package above 10 LPA",
      mobile: "Top scorers",
    },
    {
      desktop: "Show a chart of CPI distribution",
      mobile: "CPI histogram",
    },
    {
      desktop: "Show me academic records of students placed in Amazon",
      mobile: "Data summary",
    },
    {
      desktop: "List all students placed in Google",
      mobile: "Google hires",
    },

    {
      desktop: "Display an area chart of average package over CPI ranges",
      mobile: "Average package by CPI",
    },

    {
      desktop: "How many students got placed in Bangalore?",
      mobile: "Bangalore placements",
    },

    {
      desktop: "Which company has the widest salary range?",
      mobile: "Salary range",
    },
    {
      desktop: "List students who got more than 9 LPA package",
      mobile: "Above 9 LPA",
    },

    {
      desktop: "Which company placed the highest CPI students?",
      mobile: "Top CPI recruiters",
    },
  
    {
      desktop: "Show number of students placed by Role in pi chart",
      mobile: "Placed by role",
    },
 
    {
      desktop: "Average package in different locations .",
      mobile: "Average package in different locations",
    }
  ];
  

  return (
    <motion.div
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
        Try these queries:
      </h2>
      <div className="flex flex-wrap gap-2">
        {suggestionQueries.map((suggestion, index) => (
          <Button
            key={index}
            className={index > 5 ? "hidden sm:inline-block" : ""}
            type="button"
            variant="outline"
            onClick={() => handleSuggestionClick(suggestion.desktop)}
          >
            <span className="sm:hidden">{suggestion.mobile}</span>
            <span className="hidden sm:inline">{suggestion.desktop}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
};
