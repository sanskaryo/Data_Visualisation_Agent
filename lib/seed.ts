import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "@vercel/postgres";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import "dotenv/config";

function parseDate(dateString: string): string {
  if (!dateString) {
    return ""; // or handle differently
  }
  // Handle both formats: DD/MM/YYYY or DD-MM-YYYY
  const parts = dateString.includes("/")
    ? dateString.split("/")
    : dateString.split("-");

  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  console.warn(`Could not parse date: ${dateString}`);
  return ""; // Return empty string instead of throwing error
}

export async function seed() {
  const createTable = await sql`
    CREATE TABLE IF NOT EXISTS placements (
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
  `;

  console.log(`Created "placements" table`);

  const results: any[] = [];
  const csvFilePath = path.join(process.cwd(), "GLA.csv");

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", resolve)
      .on("error", reject);
  });

  for (const row of results) {
    try {
      // Debug info for first row only
      if (results.indexOf(row) === 0) {
        console.log("First row:", row);
      }

      // Safely handle date
      const formattedDate = parseDate(row["DOB"]);
      console.log(`Processing ${row.Name}, date: ${formattedDate}`);

      // Safely handle package
      let packageLPA = 0;
      if (row["Package (LPA)"]) {
        const packageStr = row["Package (LPA)"]
          .trim()
          .replace("$", "")
          .replace(",", "");
        packageLPA = parseFloat(packageStr);
        console.log(`Package for ${row.Name}: ${packageLPA}`);

        if (isNaN(packageLPA)) {
          console.warn(
            `Invalid package for ${row.Name}: ${row["Package (LPA)"]}`
          );
          packageLPA = 0;
        }
      }

      // Handle potential missing fields
      await sql`
        INSERT INTO placements (
          name, 
          dob, 
          cpi, 
          tenth_percentage, 
          twelfth_percentage, 
          company_placed, 
          package_lpa, 
          department, 
          role, 
          location, 
          internship_done, 
          rounds_cleared
        )
        VALUES (
          ${row.Name || ""},
          ${formattedDate || null},
          ${row.CPI || 0},
          ${row["10th Percentage"] || 0},
          ${row["12th Percentage"] || 0},
          ${row["Company Placed"] || ""},
          ${packageLPA},
          ${row.Department || ""},
          ${row.Role || ""},
          ${row.Location || ""},
          ${row["Internship Done"] === "Yes"},
          ${row["Rounds Cleared"] || 0}
        );
      `;

      console.log(`Inserted: ${row.Name}`);
    } catch (error) {
      console.error("Error processing row:", row.Name, error);
    }
  }

  console.log(`Seeded ${results.length} placements`);

  return {
    createTable,
    placements: results,
  };
}

seed().catch(console.error);