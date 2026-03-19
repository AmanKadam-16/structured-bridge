import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

// ===== RESUME ZOD SCHEMA =====
const ExperienceItem = z.object({
  company: z.string().describe("Company or organization name"),
  role: z.string().describe("Job title or role"),
  duration: z.string().describe("Duration or date range, e.g. 'Jan 2020 - Present'"),
  description: z.string().describe("Brief description of responsibilities and achievements"),
});

const EducationItem = z.object({
  institution: z.string().describe("School, university, or institution name"),
  degree: z.string().describe("Degree or certification obtained"),
  year: z.string().describe("Graduation year or date range"),
});

const ResumeSchema = z.object({
  full_name: z.string().describe("Candidate's full name"),
  email: z.string().describe("Candidate's email address, or empty string if not found"),
  phone: z.string().describe("Candidate's phone number, or empty string if not found"),
  summary: z.string().describe("A brief professional summary of the candidate in 1-2 sentences"),
  skills: z.array(z.string()).describe("List of technical and professional skills"),
  experience: z.array(ExperienceItem).describe("Work experience entries"),
  education: z.array(EducationItem).describe("Education entries"),
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN is not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Determine MIME type
    const mimeType = file.type || "application/octet-stream";
    const isImage = mimeType.startsWith("image/");

    // Build the message content
    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: "text" as const,
        text: "Extract all structured information from this resume. Be thorough — capture every skill, every job, and every education entry you can find. If something is unclear, make your best inference. For email/phone, use empty string if not visible.",
      },
    ];

    if (isImage) {
      userContent.push({
        type: "image_url" as const,
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
          detail: "high" as const,
        },
      });
    } else {
      // For PDFs — extract text and send as text content
      // Most vision models can handle PDF as base64 image too
      userContent.push({
        type: "image_url" as const,
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
          detail: "high" as const,
        },
      });
    }

    // Call OpenAI with structured output
    const response = await openai.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume parser. Extract structured data from resumes with precision. Always populate all fields. For arrays, include every item you can identify. Be thorough and accurate.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      response_format: zodResponseFormat(ResumeSchema, "resume_data"),
    });

    const parsed = response.choices[0]?.message?.parsed;

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Resume extract error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to extract resume data" },
      { status: 500 }
    );
  }
}
