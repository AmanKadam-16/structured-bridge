import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

// Dynamic schema builder from field configs
function buildZodSchema(
  presetId: string,
  enabledFields: string[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const fieldDefs: Record<
    string,
    Record<string, z.ZodTypeAny>
  > = {
    bio: {
      name: z.string().describe("The person's full name"),
      age: z.number().describe("The person's age as a number"),
      hobbies: z.array(z.string()).describe("A list of the person's hobbies"),
    },
    invoice: {
      vendor: z.string().describe("The vendor or company name"),
      total: z.number().describe("The total amount due"),
      items: z
        .array(
          z.object({
            name: z.string().describe("Item name"),
            quantity: z.number().describe("Quantity of the item"),
            price: z.number().describe("Price per unit"),
          })
        )
        .describe("List of invoice line items"),
    },
    medical: {
      symptoms: z.array(z.string()).describe("List of reported symptoms"),
      severity: z
        .enum(["mild", "moderate", "severe", "critical"])
        .describe("Overall severity assessment"),
      duration: z.string().describe("How long symptoms have persisted"),
    },
  };

  const presetFields = fieldDefs[presetId] || fieldDefs.bio;
  const schema: Record<string, z.ZodTypeAny> = {};

  for (const key of enabledFields) {
    if (presetFields[key]) {
      schema[key] = presetFields[key];
    }
  }

  return z.object(schema);
}

export async function POST(req: NextRequest) {
  try {
    const { text, presetId, enabledFields } = await req.json();

    if (!text || !presetId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN is not configured" },
        { status: 500 }
      );
    }

    // Build dynamic schema based on enabled fields
    const dynamicSchema = buildZodSchema(presetId, enabledFields);

    // === PARALLEL DUAL CALLS ===
    const [hopeResult, enforcementResult] = await Promise.allSettled([
      // CALL 1: "THE HOPE" — Standard completion, high chaos
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 1.2,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Extract data into JSON but be conversational and friendly in your response. Share your thoughts about the data before providing the JSON. Feel free to add commentary.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),

      // CALL 2: "THE ENFORCEMENT" — Structured output, strict
      openai.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Extract the structured data from the user's input text. Be precise and thorough.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        response_format: zodResponseFormat(dynamicSchema, "extracted_data"),
      }),
    ]);

    // Process "The Hope" result
    let hopeResponse: {
      raw: string;
      parsed: unknown;
      success: boolean;
      error: string | null;
      latency: number;
    };

    if (hopeResult.status === "fulfilled") {
      const rawContent =
        hopeResult.value.choices[0]?.message?.content || "";
      let parsed = null;
      let success = false;
      let error = null;

      try {
        // Try to extract JSON from the response
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
          success = true;
        } else {
          parsed = JSON.parse(rawContent);
          success = true;
        }
      } catch (e: unknown) {
        const parseError = e as Error;
        error = `SyntaxError: ${parseError.message}`;
        success = false;
      }

      hopeResponse = {
        raw: rawContent,
        parsed,
        success,
        error,
        latency: 0,
      };
    } else {
      hopeResponse = {
        raw: "",
        parsed: null,
        success: false,
        error: `API Error: ${hopeResult.reason?.message || "Unknown error"}`,
        latency: 0,
      };
    }

    // Process "The Enforcement" result
    let enforcementResponse: {
      parsed: unknown;
      success: boolean;
      error: string | null;
      latency: number;
    };

    if (enforcementResult.status === "fulfilled") {
      const parsedData =
        enforcementResult.value.choices[0]?.message?.parsed;
      enforcementResponse = {
        parsed: parsedData,
        success: true,
        error: null,
        latency: 0,
      };
    } else {
      enforcementResponse = {
        parsed: null,
        success: false,
        error: `API Error: ${enforcementResult.reason?.message || "Unknown error"}`,
        latency: 0,
      };
    }

    return NextResponse.json({
      hope: hopeResponse,
      enforcement: enforcementResponse,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Extract route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
