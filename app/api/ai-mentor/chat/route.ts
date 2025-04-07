import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});


export async function POST(request: Request) {
  try {
    const { message, emotion = '' } = await request.json();
    const systemPrompt = `You are an AI mentor with expertise in various fields. 
    Your goal is to provide helpful, supportive, and personalized guidance to users.
    ${emotion ? `The user appears to be feeling ${emotion}. Consider this in your response.` : ''}
    
    Guidelines:
    1. Be empathetic and understanding
    2. Provide clear, actionable advice
    3. Break down complex concepts into simple terms
    4. Encourage growth and learning
    5. Ask clarifying questions when needed
    6. Share relevant examples and analogies
    7. Maintain a professional yet friendly tone`;


    const completion = await groq.chat.completions.create({
      model: "mistral-saba-24b",
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({ message: aiResponse });

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
} 



// export async function POST(request: Request) {
//   try {
//     if (!process.env.GROQ_API_KEY) {
//       throw new Error('GROQ_API_KEY is not configured');
//     }

//     const { message } = await request.json();
    
//     if (!message) {
//       return NextResponse.json(
//         { error: 'Message is required' },
//         { status: 400 }
//       );
//     }

//     // Get AI response using Groq
//     const completion = await groq.chat.completions.create({
//       messages: [
//         {
//           role: 'system',
//           content: 'You are a helpful AI mentor who provides guidance and support to users. Your responses should be clear, concise, and encouraging.'
//         },
//         {
//           role: 'user',
//           content: message
//         }
//       ],
//       model: "mistral-saba-24b",
//       temperature: 0.7,
//       max_tokens: 1000,
//     });

//     const aiResponse = completion.choices[0]?.message?.content;

//     if (!aiResponse) {
//       throw new Error('No response from AI');
//     }

//     return NextResponse.json({ message: aiResponse });

//   } catch (error) {
//     console.error('Error in chat route:', error);
//     return NextResponse.json(
//       { error: 'Failed to get AI response' },
//       { status: 500 }
//     );
//   }
// } 