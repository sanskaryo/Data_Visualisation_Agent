"use server";

import { Config, configSchema, explanationsSchema, Result } from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { sql } from "@vercel/postgres";
import { generateObject } from "ai";
import { z } from "zod";
import { unstable_noStore as noStore } from 'next/cache';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generates a SQL SELECT query for the placements table
export const generateQuery = async (question: string, tableName?: string) => {
  noStore();
  try {
    // Get table structure if tableName is provided
    let tableStructure = '';
    if (tableName) {
      const tableInfo = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${tableName}
      `;
      tableStructure = `Table structure:
      ${tableInfo.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n')}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a SQL expert. Generate SQL queries based on natural language questions.
          ${tableStructure}
          Rules:
          1. Use the table name provided in the query
          2. Keep queries simple and efficient
          3. Return only the SQL query, no explanations
          4. Use standard SQL syntax compatible with PostgreSQL`
        },
        { role: "user", content: question }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const query = completion.choices[0].message.content;
    if (!query) throw new Error("Failed to generate query");

    // Replace placeholder with actual table name if provided
    return tableName ? query.replace(/\$TABLE/g, tableName) : query;

  } catch (error) {
    console.error("Error generating query:", error);
    return undefined;
  }
};

// Executes the SQL query
export const runGenerateSQLQuery = async (query: string): Promise<any[]> => {
  noStore();
  try {
    const result = await sql.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error running query:", error);
    throw error;
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
export const generateChartConfig = async (data: any[], question: string) => {
  noStore();
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a data visualization expert. Generate chart configurations based on data and questions.
          Available chart types: bar, line, area, pie, scatter
          Return a JSON object with:
          {
            "type": chart type,
            "title": chart title,
            "xKey": x-axis field,
            "yKeys": array of y-axis fields,
            "description": chart description,
            "takeaway": key insight,
            "legend": boolean if legend needed
          }`
        },
        {
          role: "user",
          content: `Data: ${JSON.stringify(data.slice(0, 5))}
          Question: ${question}
          Generate an appropriate chart configuration.`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const config = JSON.parse(completion.choices[0].message.content);
    return { config };

  } catch (error) {
    console.error("Error generating chart config:", error);
    return {
      config: {
        type: "bar",
        title: "Data Visualization",
        xKey: Object.keys(data[0])[0],
        yKeys: [Object.keys(data[0])[1]],
        description: "Basic data visualization",
        takeaway: "Data visualization",
        legend: false
      }
    };
  }
};

export type QueryResult = {
  rows: any[];
  columns: string[];
  query: string;
  error?: string;
};

export async function runQuery(query: string, tableName: string): Promise<QueryResult> {
  noStore();
  try {
    // Validate table name to prevent SQL injection
    if (!tableName.match(/^csv_data_\d+$/)) {
      throw new Error('Invalid table name');
    }

    // Get table structure
    const tableInfo = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
    `;

    const columns = tableInfo.rows.map(row => row.column_name);

    // Replace placeholder table name in query
    const finalQuery = query.replace(/\$TABLE/g, tableName);

    // Execute query
    const result = await sql.query(finalQuery);

    return {
      rows: result.rows,
      columns: columns,
      query: finalQuery
    };
  } catch (error) {
    console.error('Query error:', error);
    return {
      rows: [],
      columns: [],
      query: query,
      error: error instanceof Error ? error.message : 'An error occurred while running the query'
    };
  }
}

export async function getTableInfo(tableName: string) {
  noStore();
  try {
    // Validate table name
    if (!tableName.match(/^csv_data_\d+$/)) {
      throw new Error('Invalid table name');
    }

    // Get column information
    const columnInfo = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
      ORDER BY ordinal_position
    `;

    // Get sample data
    const sampleData = await sql`
      SELECT *
      FROM ${sql(tableName)}
      LIMIT 5
    `;

    // Get row count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM ${sql(tableName)}
    `;

    return {
      columns: columnInfo.rows,
      sampleData: sampleData.rows,
      totalRows: countResult.rows[0].total
    };
  } catch (error) {
    console.error('Error getting table info:', error);
    throw error;
  }
}

export async function generateSuggestedQueries(tableName: string): Promise<string[]> {
  const tableInfo = await getTableInfo(tableName);
  
  // Generate queries based on column types
  const queries = [];
  const numericColumns = tableInfo.columns.filter(col => 
    ['integer', 'decimal', 'numeric'].includes(col.data_type.toLowerCase())
  );
  
  const categoricalColumns = tableInfo.columns.filter(col =>
    ['character varying', 'text', 'varchar'].includes(col.data_type.toLowerCase())
  );

  if (numericColumns.length > 0) {
    queries.push(
      `SELECT AVG(${numericColumns[0].column_name}) as average FROM $TABLE`,
      `SELECT MAX(${numericColumns[0].column_name}) as maximum FROM $TABLE`
    );
  }

  if (categoricalColumns.length > 0) {
    queries.push(
      `SELECT ${categoricalColumns[0].column_name}, COUNT(*) as count 
       FROM $TABLE 
       GROUP BY ${categoricalColumns[0].column_name} 
       ORDER BY count DESC 
       LIMIT 5`
    );
  }

  // Add general queries
  queries.push(
    'SELECT * FROM $TABLE LIMIT 5',
    'SELECT COUNT(*) as total_rows FROM $TABLE'
  );

  return queries;
}
