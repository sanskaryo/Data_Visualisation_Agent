import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { message, chartData, tableInfo } = await request.json();

    const systemPrompt = `You are a data analysis expert helping users understand their data and charts.
You have access to:
1. The current chart data and configuration
2. Table information including schema and sample data

When users ask questions:
- Provide clear, concise insights about the data
- Explain patterns or trends you notice
- Suggest additional analyses they might find interesting
- Keep responses focused and relevant to the data

Current context:
${JSON.stringify({ chartData, tableInfo }, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content || 'No response generated'
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 