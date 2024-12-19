import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from 'node:fs/promises';

dotenv.config(); // Load environment variables from .env file

// Function to upload file to Gemini (reading the file and encoding)
async function uploadToGemini(filePath, mimeType) {
    try {
        const fileData = await fs.readFile(filePath); // Read the file as binary data

        // Convert file data to base64 string
        const base64Data = Buffer.from(fileData).toString('base64');

        // Return the mimeType and base64 data
        const file = {
            mimeType: mimeType,
            data: base64Data,
        };

        console.log(`Prepared file: ${filePath}`);
        return file;
    } catch (error) {
        console.error("Error uploading file:", error);
        return null;
    }
}

async function main() {
    
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Error: GOOGLE_API_KEY environment variable not set.");
        console.error("Please set the GOOGLE_API_KEY in your .env file.");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const generationConfig = {
        temperature: 0.7,
        top_p: 0.95,
        top_k: 40,
        max_output_tokens: 8192,
        response_mime_type: "text/plain",
    };

    
    const resumePath = "resume.pdf";
    const mimeType = "application/pdf";
    const resumeFile = await uploadToGemini(resumePath, mimeType);
    if (!resumeFile) {
        return; // Exit on file upload fail
    }

    const jobDescription = `Software Engineer
        Responsibilities:
    
            - Design, develop, and maintain web applications using React and Node.js.
            - Collaborate with cross-functional teams to define and implement features.
            - Ensure code quality and follow coding standards.
            - Participate in code reviews and provide constructive feedback.
            - Troubleshoot and debug issues in a timely manner.
    
        Qualifications:
    
            - Bachelor's degree in Computer Science or a related field.
            - 3+ years of experience in web development.
            - Proficiency in React, Node.js, and JavaScript.
            - Experience with databases (e.g., MongoDB, PostgreSQL).
            - Knowledge of version control (Git).
            - Strong problem-solving skills and attention to detail.
        `;

    
    const prompt = `
        Analyze the skills mentioned in the following:
    
        1. Resume (uploaded as a PDF): The resume content is available as a binary file.
        2. Job Description (text provided below):
        ${jobDescription}
    
        Compare the skills listed in the resume with the skills required in the job description. Provide:
            - A list of matching skills.
            - Skills mentioned in the job description but missing in the resume.
            - Recommendations for additional skills to learn to improve the chance of getting shortlisted.
        `;

    
    const messages = [
        {
            role: "user",
            parts: [{ text: prompt }],
        },
        {
            role: "user",
             parts: [{ inlineData: resumeFile }],
        },
    ];

   
    try {
        console.log("Generating response...");
        const result = await model.generateContent({
            contents: messages,
            generationConfig: generationConfig,
        });

       const response = result.response;

        if (response && response.text) {
            console.log("--- Gemini Response ---");
            const responseText = await response.text(); // Get the text with await
            console.log(responseText);
            // Save the response to a file
            try {
                await fs.writeFile("gemini_response.txt", responseText);  // Correct: Use responseText
                console.log("Gemini response saved to 'gemini_response.txt'");
            } catch (e) {
                console.error(`Error saving file:`, e);
            }
        } else {
            console.log("No response text received");
        }
    } catch (error) {
        console.error("Error during Gemini API call:", error);
    }
}

main();