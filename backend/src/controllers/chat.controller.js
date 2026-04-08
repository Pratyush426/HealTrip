import OpenAI from 'openai';
import { Chat } from '../models/Chat.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Handle Search/Chat with Persistence
 */
export const handleChat = async (req, res) => {
    try {
        const { userId, message, context, attachment } = req.body;

        if (!userId || !message) {
            return errorResponse(res, 400, "UserId and Message are required");
        }

        // 1. Get/Create Chat History
        let chat = await Chat.findOne({ userId });
        if (!chat) {
            chat = new Chat({ userId, messages: [] });
        }

        // 2. Save User Message
        const userMsg = { role: 'user', content: message, timestamp: new Date() };
        if (attachment) {
            userMsg.content += ` [Attached: ${attachment.name}]`;
        }
        chat.messages.push(userMsg);

        // 3. Update Medical Record (if context provided from frontend analysis)
        let medicalRecord = await MedicalRecord.findOne({ userId });
        if (!medicalRecord) {
            medicalRecord = new MedicalRecord({ userId, symptoms: [], history: [], files: [] });
        }

        if (context && context.symptoms) {
            context.symptoms.forEach(s => {
                if (!medicalRecord.symptoms.includes(s)) medicalRecord.symptoms.push(s);
            });
        }
        if (context && context.history) {
            context.history.forEach(h => {
                if (!medicalRecord.history.includes(h)) medicalRecord.history.push(h);
            });
        }
        if (attachment) {
            medicalRecord.files.push({
                fileName: attachment.name,
                fileType: attachment.type,
                uploadDate: new Date()
            });
        }
        await medicalRecord.save();

        // 4. Generate AI Response (Groq)
        let aiReply = "";
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("DEBUG: GROQ_API_KEY is missing");
            aiReply = "(System Error: API Key missing) " + generateFallbackResponse(message, medicalRecord, chat.messages);
        } else {
            const openai = new OpenAI({
                baseURL: 'https://api.groq.com/openai/v1',
                apiKey: apiKey
            });

            try {
                const systemPrompt = getSystemPrompt(medicalRecord);

                // Build Messages Array
                const messagesPayload = [{ role: "system", content: systemPrompt }];

                // Add conversation history (last 5)
                const recentHistory = chat.messages.slice(-5);
                recentHistory.forEach(msg => {
                    const role = msg.role === 'bot' ? 'assistant' : 'user';
                    messagesPayload.push({ role, content: msg.content });
                });

                // ML DATA INJECTION
                // Try to extract city from message to fetch real prices
                // Regex looks for "to [City]", "in [City]", "visit [City]"
                let mlContext = "";
                const cityMatch = message.match(/(?:to|in|visit|at)\s+([A-Za-z\s]+?)(?:$|[.,!?])/i);

                if (cityMatch && cityMatch[1]) {
                    const city = cityMatch[1].trim();
                    if (city.length > 2) {
                        try {
                            // Call local ML Service
                            const mlRes = await fetch(`http://localhost:8000/recommend?location=${city}&stars=3`);
                            if (mlRes.ok) {
                                const data = await mlRes.json();
                                if (data.results && data.results.length > 0) {
                                    // Calculate average price of top 5
                                    const topHotels = data.results.slice(0, 5);
                                    const avgPrice = Math.round(topHotels.reduce((sum, h) => sum + h.Hotel_Price, 0) / topHotels.length);
                                    const minPrice = Math.min(...topHotels.map(h => h.Hotel_Price));

                                    mlContext = `\n[REAL-TIME DATA: Found ${data.count} hotels in ${city}. Predicted Avg Cost: ₹${avgPrice}/night. Min: ₹${minPrice}/night. Examples: ${topHotels[0].Hotel_Name} (₹${topHotels[0].Hotel_Price}). USE THESE EXACT PRICES.]`;
                                }
                            }
                        } catch (mlErr) {
                            console.warn("ML Service unavailable:", mlErr.message);
                        }
                    }
                }

                // Add current message with attachment note and ML context
                let finalContent = message + mlContext;
                if (attachment) {
                    finalContent += `\n[System Note: User attached file "${attachment.name}". Analyze the filename context, but content reading is not supported in this version.]`;
                }
                messagesPayload.push({ role: "user", content: finalContent });

                const completion = await openai.chat.completions.create({
                    messages: messagesPayload,
                    model: "llama-3.3-70b-versatile", // Groq fast inference model
                    temperature: 0.7,
                    max_tokens: 1024,
                });

                aiReply = completion.choices[0]?.message?.content || "No response generated.";

            } catch (err) {
                console.error("Groq API Error:", err);
                aiReply = `(System Error: Groq Failed. ${err.message}) ` + generateFallbackResponse(message, medicalRecord, chat.messages);
            }
        }

        // 5. Save Bot Message
        chat.messages.push({ role: 'bot', content: aiReply.trim(), timestamp: new Date() });
        chat.lastUpdated = new Date();
        await chat.save();

        return successResponse(res, 200, {
            reply: aiReply.trim(),
            history: chat.messages
        }, "Message processed and saved");

    } catch (error) {
        console.error("Handle Chat Error:", error);
        return errorResponse(res, 500, "Internal Server Error");
    }
};

// Helper: System Prompt
const getSystemPrompt = (medicalRecord) => {
    // Safely get arrays even if legacy data has undefined fields
    const safeSymptoms = medicalRecord.symptoms || [];
    const safeHistory = medicalRecord.history || [];

    return `You are HealAI, a warm, friendly, and expert Medical Tourism Guide.

    Current Patient Profile:
    - Symptoms: ${safeSymptoms.join(", ") || "None recorded"}
    - History: ${safeHistory.join(", ") || "None recorded"}

    GOAL: Help organize their health info and plan medical travel.

    RESTRICTIONS:
    - Recommend ONLY hospitals, cities, and travel destinations within INDIA. Do not suggest international locations.
    - Use the REAL-TIME DATA provided in the context for prices. Do not hallucinate costs if data is available.

    TONE & STYLE:
    - Be super welcoming, casual, and empathetic (like a helpful friend).
    - If the user uses "buddy", "bro", or casual language, reciprocate that warmth.
    - Start conversations with a friendly greeting before diving into medical questions.

    TASKS:
    - If new user, warmly welcome them and gently ask if they have any health concerns or recent reports.
    - Suggest itineraries (Start -> Hospital -> Treatment -> recovery).
    - Estimate costs in INR using the provided data.
    - Keep responses concise but very friendly.`;
};

// Removed buildPrompt helper as OpenAI uses messages array structure


/**
 * Get Chat History
 */
export const getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const chat = await Chat.findOne({ userId });
        const record = await MedicalRecord.findOne({ userId });

        return successResponse(res, 200, {
            messages: chat ? chat.messages : [],
            medicalRecord: record || null
        }, "History fetched");
    } catch (error) {
        return errorResponse(res, 500, "Error fetching history");
    }
};

/**
 * Generate Report
 */
export const generateReport = async (req, res) => {
    try {
        const { userId } = req.body;
        const record = await MedicalRecord.findOne({ userId });

        if (!record) return errorResponse(res, 404, "No medical record found");

        const report = `
        MEDICAL SUMMARY REPORT
        ----------------------
        Date: ${new Date().toLocaleDateString()}
        Patient ID: ${userId}

        SYMPTOMS:
        ${record.symptoms.map(s => `- ${s}`).join('\n') || "None recorded"}

        MEDICAL HISTORY:
        ${record.history.map(h => `- ${h}`).join('\n') || "None recorded"}

        ATTACHMENTS:
        ${record.files.map(f => `- ${f.fileName}`).join('\n') || "None"}

        Generated by HealTrip AI
        `;

        record.generatedReport = report;
        record.isProcessed = true;
        await record.save();

        return successResponse(res, 200, { report }, "Report generated");

    } catch (error) {
        return errorResponse(res, 500, "Error generating report");
    }
}

/**
 * Delete Chat History
 */
export const deleteChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        await Chat.findOneAndDelete({ userId });
        return successResponse(res, 200, null, "History deleted");
    } catch (error) {
        console.error("Delete Chat Error:", error);
        return errorResponse(res, 500, "Error deleting history");
    }
};

/**
 * Direct Update Medical Record
 */
export const updateMedicalRecord = async (req, res) => {
    try {
        const { userId, symptoms, history, diseaseInfo } = req.body;
        
        let record = await MedicalRecord.findOne({ userId });
        if (!record) {
            record = new MedicalRecord({ userId, symptoms: [], history: [], files: [] });
        }

        if (symptoms) {
            if (Array.isArray(symptoms)) {
                symptoms.forEach(s => { if (!record.symptoms.includes(s)) record.symptoms.push(s); });
            } else if (typeof symptoms === 'string' && !record.symptoms.includes(symptoms)) {
                record.symptoms.push(symptoms);
            }
        }
        
        if (history) {
            if (Array.isArray(history)) {
                history.forEach(h => { if (!record.history.includes(h)) record.history.push(h); });
            } else if (typeof history === 'string' && !record.history.includes(history)) {
                record.history.push(history);
            }
        }

        if (diseaseInfo && !record.history.includes(diseaseInfo)) {
            record.history.push(diseaseInfo);
        }

        await record.save();
        return successResponse(res, 200, { medicalRecord: record }, "Medical record updated");

    } catch (error) {
        console.error("Update Medical Record Error:", error);
        return errorResponse(res, 500, "Error updating medical record");
    }
};


// Fallback Logic
const generateFallbackResponse = (text, record, history = []) => {
    const lower = text.toLowerCase();

    // Prevent looping greeting if history exists
    if (history.length > 2) {
        if (lower.includes("cost") || lower.includes("price")) return "Estimates vary. Hotel: ₹3k-8k/night, Treatment: dependent on hospital. Shall I search options?";
        return "I'm listening. Could you clarify your travel plans?";
    }

    if (lower.includes("plan") || lower.includes("trip")) {
        return "I can help plan your trip! I estimate a 3-day trip for consultation would cost around ₹15,000 (Flights + Hotel). Which city are you travelling to?";
    }
    const symptoms = record.symptoms || [];

    if (symptoms.length === 0 && !lower.includes("symptom")) {
        return "Hello! I'm HealAI. To start, could you tell me what symptoms you are experiencing?";
    }
    return "I've noted that. Anything else you'd like to add to your medical record?";
};
