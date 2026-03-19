import { z } from "zod";

// ===== SCHEMA DEFINITIONS =====

export const BioSchema = z.object({
  name: z.string().describe("The person's full name"),
  age: z.number().describe("The person's age as a number"),
  hobbies: z.array(z.string()).describe("A list of the person's hobbies"),
});

export const InvoiceSchema = z.object({
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
});

export const MedicalSchema = z.object({
  symptoms: z.array(z.string()).describe("List of reported symptoms"),
  severity: z
    .enum(["mild", "moderate", "severe", "critical"])
    .describe("Overall severity assessment"),
  duration: z.string().describe("How long symptoms have persisted"),
});

// ===== SCHEMA FIELD CONFIGS (for the live editor) =====
export interface SchemaField {
  key: string;
  label: string;
  type: string;
  enabled: boolean;
  description: string;
}

export interface PresetConfig {
  id: string;
  label: string;
  icon: string;
  sampleText: string;
  fields: SchemaField[];
  schemaName: string;
}

export const PRESETS: PresetConfig[] = [
  {
    id: "bio",
    label: "Messy Bio",
    icon: "🧑",
    schemaName: "UserProfile",
    sampleText: `yo so my name's Priya Sharma lol, i'm like 28 or something?? idk tbh. anyway I love painting (mostly watercolors u know), playing badminton on weekends with my squad, cooking random stuff from youtube, and oh yeah I recently got into like amateur photography which is pretty sick ngl. also does binge watching count as a hobby because if so add that too haha 😂`,
    fields: [
      {
        key: "name",
        label: "Name",
        type: "str",
        enabled: true,
        description: "The person's full name",
      },
      {
        key: "age",
        label: "Age",
        type: "int",
        enabled: true,
        description: "The person's age",
      },
      {
        key: "hobbies",
        label: "Hobbies",
        type: "list[str]",
        enabled: true,
        description: "List of hobbies",
      },
    ],
  },
  {
    id: "invoice",
    label: "Casual Invoice",
    icon: "🧾",
    schemaName: "InvoiceData",
    sampleText: `hey so that order from "TechParts Plus" came thru... it was like 3 HDMI cables at $12.99 each, one USB-C hub for $45, and they threw in 2 screen protectors at $8.50 per piece. total damage: $101.47. oh wait actually they charged tax too so make it $109.12 final.`,
    fields: [
      {
        key: "vendor",
        label: "Vendor",
        type: "str",
        enabled: true,
        description: "Company name",
      },
      {
        key: "total",
        label: "Total",
        type: "float",
        enabled: true,
        description: "Total amount",
      },
      {
        key: "items",
        label: "Items",
        type: "list[LineItem]",
        enabled: true,
        description: "Line items",
      },
    ],
  },
  {
    id: "medical",
    label: "Medical Note",
    icon: "🏥",
    schemaName: "MedicalNote",
    sampleText: `patient came in complaining about a really bad headache that's been going on for like 3 days now, says it's mostly behind the eyes and gets worse in bright light. also mentioned some nausea especially in the mornings, and they've been feeling pretty dizzy when standing up too fast. honestly seems kinda rough but they're still functional so idk, moderate maybe? they took some ibuprofen but it barely helped.`,
    fields: [
      {
        key: "symptoms",
        label: "Symptoms",
        type: "list[str]",
        enabled: true,
        description: "Reported symptoms",
      },
      {
        key: "severity",
        label: "Severity",
        type: 'Literal',
        enabled: true,
        description: "Severity level",
      },
      {
        key: "duration",
        label: "Duration",
        type: "str",
        enabled: true,
        description: "Duration of symptoms",
      },
    ],
  },
];

// ===== CODE SNIPPETS (Python / Pydantic) =====
export function getOldWayCode(schemaName: string): string {
  return `# ❌ THE OLD WAY — String prompting, pray it works
from openai import OpenAI
import json

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    temperature=1.2,
    messages=[
        {
            "role": "system",
            "content": """You are a helpful assistant.
  Extract data into JSON Format."""
        },
        {
            "role": "user",
            "content": user_input  # ← raw, messy text
        }
    ]
)

# 🤞 Hope this works...
result = json.loads(response.choices[0].message.content)
#                   ↑ RUNTIME ERROR: json.decoder.JSONDecodeError
#                     Expecting value: line 1 column 1
#                     "Sure! Here's the data you asked for..."`;
}

export function getNewWayCode(
  schemaName: string,
  fields: SchemaField[]
): string {
  const enabledFields = fields.filter((f) => f.enabled);
  const schemaDefinition = enabledFields
    .map((f) => `    ${f.key}: ${f.type}`)
    .join("\n");

  return `# ✅ THE NEW WAY — Structured Output with Pydantic
from openai import OpenAI
from pydantic import BaseModel

class ${schemaName}(BaseModel):
${schemaDefinition}

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "system",
            "content": "Extract the structured data from the input."
        },
        {
            "role": "user",
            "content": user_input
        }
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "${schemaName.toLowerCase()}_schema",
            "schema": ${schemaName}.model_json_schema(),
        }
    }
)

data = json.loads(response.choices[0].message.content)
#    ↑ 100% SCHEMA-COMPLIANT — always matches your Pydantic model
#    Guaranteed: data["${enabledFields[0]?.key || "field"}"] ✅`;
}
