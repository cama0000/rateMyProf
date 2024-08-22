import {NextResponse} from 'next/server';
import {Pinecone} from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const systemPrompt = `
You are an AI agent designed to help students find and evaluate professors at a university. Your goal is to provide the top 3 most relevant professors based on the student's query.
You have access to a comprehensive database of professor information, including:

Professor name
Department/subject area
Average rating (1-5 stars)
Number of reviews
Keywords describing the professor's teaching style, expertise, and other relevant attributes

When a student asks a question about finding a professor, you should:

Analyze the student's query to understand what they are looking for in a professor (e.g. subject area, teaching style, rating, etc.).
Search your database to identify the 3 professors that best match the student's criteria. Rank them based on relevance.
For each of the top 3 professors, provide the following information in a markdown formatted response:

Professor name
Department/subject area
Average rating (1-5 stars)
Number of reviews
2-3 keyword description of the professor


Make sure to format your response in a clear and easy to read way for the student.
If there are not enough professors in your database that match the student's query, provide the best matches you can and indicate that the results may be limited.

Your responses should be concise but informative, helping the student quickly identify the top professor options based on their needs. 
Avoid going into unnecessary detail unless the student asks for more information. 
The goal is to provide a useful recommendation, not an exhaustive report.
`;

export async function POST(req){
    const data = await req.json();
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004"});

    const index = pc.index('rag-prof').namespace('ns1');

    const text = data[data.length - 1].parts[0].text;

    const result = await model.embedContent(text);

    // console.log("EMBEDDINGS: " + result.embedding.values);

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: result.embedding.values
    })

    // console.log("RESULTS", results);

    let resultString = 'Returned results from vector db (done automatically):';

    results.matches.forEach((match)=>{
        resultString += `

        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    // console.log("RESULT STRING", resultString);

    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.parts[0].text + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)

    // console.log("LAST MESSAGE", lastMessage);
    // console.log("LAST MESSAGE CONTENT", lastMessageContent);
    // console.log("LAST DATA WITRHOUT LAST MESSAGE", lastDataWithoutLastMessage);


    // const conversation = `${systemPrompt}\n\nUser: ${userMessage}`;

    const genModel = genAI.getGenerativeModel({
        model: "gemini-1.0-pro",
    });

    const completion = genModel.startChat({
        history: [
            {
                role: "user",
                parts: [{text: systemPrompt}],
              },
              {
                role: "model",
                parts: [{text: "Understood."}],
              },
            ...lastDataWithoutLastMessage,
            // {
            //     role: "user",
            //     parts: [{text: lastMessageContent}]
            // }
        ],
    });

    const response = await completion.sendMessage(lastMessageContent);

    // console.log("RESPONSE", response.response.text());

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder();
            try{
                const result = await genModel.generateContentStream(response.response.text());

                for await (const chunk of result.stream){
                    // console.log("IN THE FOR LOOP")
                    const content = chunk.candidates[0].content.parts[0].text;

                    if(content){
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            }
            catch(err){
                controller.error(err)
            }
            finally{
                controller.close();
            }
        }
    })

    // console.log("STREAM", stream);

    return new NextResponse(stream);
}