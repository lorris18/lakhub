import type { Database } from "@/lib/supabase/database.types";

export type AiMode = Database["public"]["Enums"]["ai_mode"];
export type AiProvider = Database["public"]["Enums"]["ai_provider"];

export type AiSource = {
  title: string;
  url: string;
  snippet?: string | null;
};

export type AiExecutionInput = {
  prompt: string;
  context?: string | null;
  mode: AiMode;
};

export type AiExecutionResult = {
  provider: AiProvider;
  text: string;
  inputTokens: number;
  outputTokens: number;
  sources?: AiSource[];
};

export interface AiProviderClient {
  run(input: AiExecutionInput): Promise<AiExecutionResult>;
}

