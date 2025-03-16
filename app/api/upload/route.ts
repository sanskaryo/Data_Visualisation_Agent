import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { parse } from 'csv-parse/sync';

function sanitizeColumnName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&');
}

function inferSqlType(values: string[]): string {
  const nonEmptyValues = values.filter(v => v !== '' && v !== null && v !== undefined);
  if (nonEmptyValues.length === 0) return 'TEXT';

  // Check if boolean
  if (nonEmptyValues.every(v => ['true', 'false', 'yes', 'no', '0', '1'].includes(v.toLowerCase()))) {
    return 'BOOLEAN';
  }

  // Check if integer
  if (nonEmptyValues.every(v => /^-?\d+$/.test(v))) {
    return 'INTEGER';
  }

  // Check if decimal
  if (nonEmptyValues.every(v => /^-?\d*\.?\d+$/.test(v))) {
    return 'DECIMAL(10,2)';
  }

  // Check if date
  if (nonEmptyValues.every(v => 
    /^\d{4}-\d{2}-\d{2}$/.test(v) || 
    /^\d{2}[/-]\d{2}[/-]\d{4}$/.test(v)
  )) {
    return 'DATE';
  }

  return 'TEXT';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileContent = fileBuffer.toString();
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Get column names and sanitize them
    const columns = Object.keys(records[0]);
    const sanitizedColumns = columns.map(sanitizeColumnName);

    // Infer column types
    const columnTypes = columns.map(col => {
      const values = records.map(record => record[col]);
      return inferSqlType(values);
    });

    // Generate table name based on timestamp
    const tableName = `csv_data_${Date.now()}`;

    // Create table
    const createTableSQL = `
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        ${sanitizedColumns.map((col, i) => `${col} ${columnTypes[i]}`).join(',\n')}
      )
    `;

    await sql.query(createTableSQL);

    // Insert data
    for (const record of records) {
      const values = sanitizedColumns.map(col => record[columns[sanitizedColumns.indexOf(col)]]);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      await sql.query(
        `INSERT INTO ${tableName} (${sanitizedColumns.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }

    return NextResponse.json({ 
      success: true, 
      tableName,
      columns: sanitizedColumns,
      rowCount: records.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process CSV file' }, { status: 500 });
  }
} 