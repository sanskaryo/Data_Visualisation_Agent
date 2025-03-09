"use server";

import { Config, configSchema, explanationsSchema, Result } from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { sql } from "@vercel/postgres";
import { generateObject } from "ai";
import { z } from "zod";

// Generates a SQL SELECT query for the placements table
export const generateQuery = async (input: string) => {
  "use server";
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      system: `
You are a SQL (postgres) and data visualization expert. Your job is to help the user write a SQL query to retrieve the data they need.
The table schema is as follows:

placements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dob DATE,
  cpi DECIMAL(4, 2),
  tenth_percentage DECIMAL(5, 2),
  twelfth_percentage DECIMAL(5, 2),
  company_placed VARCHAR(255),
  package_lpa DECIMAL(5, 2),
  department VARCHAR(255),
  role VARCHAR(255),
  location VARCHAR(255),
  internship_done BOOLEAN,
  rounds_cleared INTEGER
);

Only retrieval (SELECT) queries are allowed.

For fields like name, company_placed, department, role, and location, use ILIKE:
LOWER(field_name) ILIKE LOWER('%search_term%')

When the user asks about something 'over time', return data grouped by year if appropriate.

EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART!
If the user asks for a single column, return that column and a count or numeric measure.
If the user asks for a rate or percentage, return it as a decimal (e.g., 0.1 = 10%).
    `,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });
    return result.object.query;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

// Executes the SQL query
export const runGenerateSQLQuery = async (query: string) => {
  "use server";
  // Only allow SELECT queries
  const q = query.trim().toLowerCase();
  if (
    !q.startsWith("select") ||
    q.includes("drop") ||
    q.includes("delete") ||
    q.includes("insert") ||
    q.includes("update") ||
    q.includes("alter") ||
    q.includes("truncate") ||
    q.includes("create") ||
    q.includes("grant") ||
    q.includes("revoke")
  ) {
    throw new Error("Only SELECT queries are allowed");
  }

  try {
    const data = await sql.query(query);
    return data.rows as Result[];
  } catch (e: any) {
    // If the table doesn't exist
    if (e.message.includes('relation "placements" does not exist')) {
      console.log("Table does not exist, creating and seeding it with dummy data now...");
      throw Error("Table does not exist");
    } else {
      throw e;
    }
  }
};

// Explains the generated SQL query in plain language
export const explainQuery = async (input: string, sqlQuery: string) => {
  "use server";
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        explanations: explanationsSchema,
      }),
      system: `
You are a SQL (postgres) expert. Your job is to explain the SQL query you wrote to retrieve the data the user asked for.
The table schema is as follows:

placements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dob DATE,
  cpi DECIMAL(4, 2),
  tenth_percentage DECIMAL(5, 2),
  twelfth_percentage DECIMAL(5, 2),
  company_placed VARCHAR(255),
  package_lpa DECIMAL(5, 2),
  department VARCHAR(255),
  role VARCHAR(255),
  location VARCHAR(255),
  internship_done BOOLEAN,
  rounds_cleared INTEGER
);

When you explain the query, break it down into unique sections. For example:
"SELECT ...", "FROM placements", "WHERE ..." etc.
If a section has no explanation, still include it but leave the explanation empty.
      `,
      prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query:

User Query:
${input}

Generated SQL Query:
${sqlQuery}`,
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query explanation");
  }
};

// Generates a suggested chart configuration for visualizing the query results
export const generateChartConfig = async (
  results: Result[],
  userQuery: string,
) => {
  "use server";
  const system = `You are a data visualization expert.`;

  try {
    const { object: config } = await generateObject({
      model: openai("gpt-4o"),
      system,
      prompt: `
Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the user's query.
For multiple groups, use multi-lines if appropriate.

User Query:
${userQuery}

Data:
${JSON.stringify(results, null, 2)}
      `,
      schema: configSchema,
    });

    // Inject colors for each yKey from our palette
    const colors: Record<string, string> = {};
    config.yKeys.forEach((key, index) => {
      colors[key] = `hsl(var(--chart-${index + 1}))`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate chart suggestion");
  }
};
