import { env, hasPerplexityEnv } from "@/lib/env";
import type { AiExecutionInput, AiExecutionResult, AiProviderClient, AiSource } from "@/lib/ai/providers/types";

type PerplexityResponse = {
  citations?: string[];
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
};

export class PerplexityProvider implements AiProviderClient {
  async run(input: AiExecutionInput): Promise<AiExecutionResult> {
    if (!hasPerplexityEnv) {
      throw new Error("PERPLEXITY_API_KEY manquant.");
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PERPLEXITY_API_KEY!}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant de recherche. Reponds en francais, cite des sources web recentes et distingue clairement faits et interpretations."
          },
          {
            role: "user",
            content: `${input.context ? `Contexte:\n${input.context}\n\n` : ""}${input.prompt}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const payload = (await response.json()) as PerplexityResponse;
    const sources: AiSource[] =
      payload.citations?.map((citation, index) => ({
        title: `Source ${index + 1}`,
        url: citation
      })) ?? [];

    return {
      provider: "perplexity",
      text: payload.choices?.[0]?.message?.content?.trim() ?? "",
      sources,
      inputTokens: payload.usage?.prompt_tokens ?? 0,
      outputTokens: payload.usage?.completion_tokens ?? 0
    };
  }
}
