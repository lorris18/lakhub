import { env } from "@/lib/env";
import { ClaudeProvider } from "@/lib/ai/providers/claude";
import { PerplexityProvider } from "@/lib/ai/providers/perplexity";
import type { AiProvider } from "@/lib/ai/providers/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { insertAuditLog, requireUser } from "@/lib/data/helpers";
import type { AiRunInput } from "@/lib/validation/shared";

export function resolveAiProvider(mode: AiRunInput["mode"]): AiProvider {
  if (mode === "research") {
    return "perplexity";
  }

  return "claude";
}

export async function listAiWorkspaceData() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [conversations, savedOutputs, usage] = await Promise.all([
    supabase
      .from("ai_conversations")
      .select("id, title, provider, mode, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("ai_saved_outputs")
      .select("id, title, kind, created_at, document_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("ai_usage")
      .select("provider, request_count, input_tokens, output_tokens, usage_date")
      .eq("user_id", user.id)
      .order("usage_date", { ascending: false })
      .limit(7)
  ]);

  if (conversations.error) throw conversations.error;
  if (savedOutputs.error) throw savedOutputs.error;
  if (usage.error) throw usage.error;

  return {
    conversations: conversations.data,
    savedOutputs: savedOutputs.data,
    usage: usage.data,
    dailyLimit: env.AI_USAGE_DAILY_LIMIT
  };
}

export async function executeAiRun(input: AiRunInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);
  const usageCheck = await supabase
    .from("ai_usage")
    .select("provider, request_count, input_tokens, output_tokens")
    .eq("user_id", user.id)
    .eq("usage_date", today);

  if (usageCheck.error) throw usageCheck.error;

  const usedToday = usageCheck.data.reduce((sum, item) => sum + item.request_count, 0);
  if (usedToday >= env.AI_USAGE_DAILY_LIMIT) {
    throw new Error("Quota quotidien IA atteint pour cet utilisateur.");
  }

  const provider = resolveAiProvider(input.mode);

  let conversation = input.conversationId;
  if (!conversation) {
    const createdConversation = await supabase
      .from("ai_conversations")
      .insert({
        user_id: user.id,
        title: input.title?.trim() || "Nouvelle session IA",
        provider,
        mode: input.mode,
        project_id: input.projectId || null,
        document_id: input.documentId || null
      })
      .select("id")
      .single();

    if (createdConversation.error) throw createdConversation.error;
    conversation = createdConversation.data.id;
  }

  if (!conversation) {
    throw new Error("Conversation IA impossible à créer.");
  }

  const runRecord = await supabase
    .from("ai_runs")
    .insert({
      user_id: user.id,
      conversation_id: conversation,
      provider,
      mode: input.mode,
      prompt: input.prompt,
      status: "pending"
    })
    .select("id")
    .single();

  if (runRecord.error) throw runRecord.error;

  const client = provider === "perplexity" ? new PerplexityProvider() : new ClaudeProvider();

  try {
    const result = await client.run({
      prompt: input.prompt,
      context: input.context,
      mode: input.mode
    });

    const providerUsage = usageCheck.data.find((item) => item.provider === result.provider);

    const [messagesInsert, runUpdate, usageWrite, sourcesWrite, savedOutputInsert] = await Promise.all([
      supabase.from("ai_messages").insert([
        {
          conversation_id: conversation,
          role: "user",
          content: input.prompt
        },
        {
          conversation_id: conversation,
          role: "assistant",
          content: result.text,
          metadata: result.sources ?? []
        }
      ]),
      supabase
        .from("ai_runs")
        .update({
          status: "completed",
          output: result.text,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          completed_at: new Date().toISOString()
        })
        .eq("id", runRecord.data.id),
      providerUsage
        ? supabase
            .from("ai_usage")
            .update({
              request_count: providerUsage.request_count + 1,
              input_tokens: providerUsage.input_tokens + result.inputTokens,
              output_tokens: providerUsage.output_tokens + result.outputTokens
            })
            .eq("user_id", user.id)
            .eq("provider", result.provider)
            .eq("usage_date", today)
        : supabase.from("ai_usage").insert({
            user_id: user.id,
            provider: result.provider,
            usage_date: today,
            request_count: 1,
            input_tokens: result.inputTokens,
            output_tokens: result.outputTokens
          }),
      result.sources?.length
        ? supabase.from("ai_sources").insert(
            result.sources.map((source, index) => ({
              run_id: runRecord.data.id,
              title: source.title,
              url: source.url,
              snippet: source.snippet ?? null,
              source_rank: index + 1
            }))
          )
        : Promise.resolve({ error: null }),
      supabase.from("ai_saved_outputs").insert({
        user_id: user.id,
        conversation_id: conversation,
        run_id: runRecord.data.id,
        document_id: input.documentId || null,
        kind: input.mode,
        title: input.title?.trim() || "Sortie IA",
        content: result.text
      })
    ]);

    [messagesInsert, runUpdate, usageWrite, sourcesWrite, savedOutputInsert].forEach((operation) => {
      if ("error" in operation && operation.error) {
        throw operation.error;
      }
    });

    await insertAuditLog("ai.run", "ai_run", runRecord.data.id, {
      provider: result.provider,
      mode: input.mode
    });

    return {
      conversationId: conversation,
      runId: runRecord.data.id,
      ...result
    };
  } catch (error) {
    await supabase
      .from("ai_runs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Erreur IA",
        completed_at: new Date().toISOString()
      })
      .eq("id", runRecord.data.id);

    throw error;
  }
}
