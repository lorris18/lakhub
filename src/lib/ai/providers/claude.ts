import { env, hasAnthropicEnv } from "@/lib/env";
import type { AiExecutionInput, AiExecutionResult, AiProviderClient } from "@/lib/ai/providers/types";

type ClaudeResponse = {
  content?: Array<{ text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

export class ClaudeProvider implements AiProviderClient {
  async run(input: AiExecutionInput): Promise<AiExecutionResult> {
    if (!hasAnthropicEnv) {
      throw new Error("ANTHROPIC_API_KEY manquant.");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1600,
        system:
          "Tu es un assistant académique exigeant. Rédige en français clair, rigoureux, structuré, sans inventer de sources.",
        messages: [
          {
            role: "user",
            content: `${input.context ? `Contexte:\n${input.context}\n\n` : ""}${input.prompt}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const payload = (await response.json()) as ClaudeResponse;

    return {
      provider: "claude",
      text: payload.content?.map((part) => part.text ?? "").join("\n").trim() ?? "",
      inputTokens: payload.usage?.input_tokens ?? 0,
      outputTokens: payload.usage?.output_tokens ?? 0
    };
  }
}

