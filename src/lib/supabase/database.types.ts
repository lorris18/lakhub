export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string;
          document_id: string | null;
          id: string;
          mode: Database["public"]["Enums"]["ai_mode"];
          project_id: string | null;
          provider: Database["public"]["Enums"]["ai_provider"];
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          document_id?: string | null;
          id?: string;
          mode: Database["public"]["Enums"]["ai_mode"];
          project_id?: string | null;
          provider: Database["public"]["Enums"]["ai_provider"];
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_conversations"]["Insert"]>;
      };
      ai_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          metadata: Json;
          role: Database["public"]["Enums"]["ai_message_role"];
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          role: Database["public"]["Enums"]["ai_message_role"];
        };
        Update: Partial<Database["public"]["Tables"]["ai_messages"]["Insert"]>;
      };
      ai_prompt_templates: {
        Row: {
          created_at: string;
          id: string;
          is_system: boolean;
          kind: string;
          owner_user_id: string | null;
          prompt_template: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_system?: boolean;
          kind: string;
          owner_user_id?: string | null;
          prompt_template: string;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_prompt_templates"]["Insert"]>;
      };
      ai_runs: {
        Row: {
          completed_at: string | null;
          conversation_id: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          input_tokens: number;
          mode: Database["public"]["Enums"]["ai_mode"];
          output: string | null;
          output_tokens: number;
          prompt: string;
          provider: Database["public"]["Enums"]["ai_provider"];
          status: Database["public"]["Enums"]["ai_run_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          conversation_id?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          input_tokens?: number;
          mode: Database["public"]["Enums"]["ai_mode"];
          output?: string | null;
          output_tokens?: number;
          prompt: string;
          provider: Database["public"]["Enums"]["ai_provider"];
          status?: Database["public"]["Enums"]["ai_run_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_runs"]["Insert"]>;
      };
      ai_saved_outputs: {
        Row: {
          content: string;
          conversation_id: string | null;
          created_at: string;
          document_id: string | null;
          id: string;
          kind: string;
          run_id: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          content: string;
          conversation_id?: string | null;
          created_at?: string;
          document_id?: string | null;
          id?: string;
          kind: string;
          run_id?: string | null;
          title: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_saved_outputs"]["Insert"]>;
      };
      ai_sources: {
        Row: {
          created_at: string;
          id: string;
          run_id: string;
          snippet: string | null;
          source_rank: number;
          title: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          run_id: string;
          snippet?: string | null;
          source_rank?: number;
          title: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_sources"]["Insert"]>;
      };
      ai_usage: {
        Row: {
          created_at: string;
          id: string;
          input_tokens: number;
          output_tokens: number;
          provider: Database["public"]["Enums"]["ai_provider"];
          request_count: number;
          usage_date: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          input_tokens?: number;
          output_tokens?: number;
          provider: Database["public"]["Enums"]["ai_provider"];
          request_count?: number;
          usage_date?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_usage"]["Insert"]>;
      };
      assets: {
        Row: {
          bucket: string;
          created_at: string;
          document_id: string | null;
          id: string;
          library_item_id: string | null;
          mime_type: string | null;
          owner_user_id: string;
          path: string;
          size_bytes: number | null;
        };
        Insert: {
          bucket: string;
          created_at?: string;
          document_id?: string | null;
          id?: string;
          library_item_id?: string | null;
          mime_type?: string | null;
          owner_user_id: string;
          path: string;
          size_bytes?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["assets"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
      citations: {
        Row: {
          citation_key: string;
          created_at: string;
          document_id: string;
          id: string;
          library_item_id: string | null;
          locator: string | null;
          note: string | null;
        };
        Insert: {
          citation_key: string;
          created_at?: string;
          document_id: string;
          id?: string;
          library_item_id?: string | null;
          locator?: string | null;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["citations"]["Insert"]>;
      };
      collections: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_user_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_user_id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
      };
      comments: {
        Row: {
          anchor_id: string;
          author_user_id: string;
          body: string;
          created_at: string;
          document_id: string;
          id: string;
          parent_id: string | null;
          status: Database["public"]["Enums"]["comment_status"];
          updated_at: string;
          version_id: string | null;
        };
        Insert: {
          anchor_id: string;
          author_user_id: string;
          body: string;
          created_at?: string;
          document_id: string;
          id?: string;
          parent_id?: string | null;
          status?: Database["public"]["Enums"]["comment_status"];
          updated_at?: string;
          version_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
      };
      deliverables: {
        Row: {
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          project_id: string;
          status: Database["public"]["Enums"]["deliverable_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          project_id: string;
          status?: Database["public"]["Enums"]["deliverable_status"];
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deliverables"]["Insert"]>;
      };
      document_versions: {
        Row: {
          content_json: Json;
          created_at: string;
          created_by: string;
          document_id: string;
          id: string;
          summary: string | null;
          title: string;
          version_number: number;
        };
        Insert: {
          content_json?: Json;
          created_at?: string;
          created_by: string;
          document_id: string;
          id?: string;
          summary?: string | null;
          title: string;
          version_number: number;
        };
        Update: Partial<Database["public"]["Tables"]["document_versions"]["Insert"]>;
      };
      documents: {
        Row: {
          content_json: Json;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["document_kind"];
          last_edited_at: string | null;
          owner_user_id: string;
          plain_text: string;
          project_id: string | null;
          status: Database["public"]["Enums"]["document_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          content_json?: Json;
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["document_kind"];
          last_edited_at?: string | null;
          owner_user_id: string;
          plain_text?: string;
          project_id?: string | null;
          status?: Database["public"]["Enums"]["document_status"];
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          project_id: string;
          role: Database["public"]["Enums"]["project_role"];
          status: Database["public"]["Enums"]["invitation_status"];
          token: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          project_id: string;
          role: Database["public"]["Enums"]["project_role"];
          status?: Database["public"]["Enums"]["invitation_status"];
          token: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invitations"]["Insert"]>;
      };
      item_collections: {
        Row: {
          collection_id: string;
          item_id: string;
        };
        Insert: {
          collection_id: string;
          item_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["item_collections"]["Insert"]>;
      };
      item_tags: {
        Row: {
          item_id: string;
          tag_id: string;
        };
        Insert: {
          item_id: string;
          tag_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["item_tags"]["Insert"]>;
      };
      library_items: {
        Row: {
          abstract: string | null;
          authors: string[];
          created_at: string;
          doi: string | null;
          id: string;
          item_type: Database["public"]["Enums"]["library_item_type"];
          metadata: Json;
          owner_user_id: string;
          project_id: string | null;
          publication_year: number | null;
          summary: string | null;
          title: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          abstract?: string | null;
          authors?: string[];
          created_at?: string;
          doi?: string | null;
          id?: string;
          item_type?: Database["public"]["Enums"]["library_item_type"];
          metadata?: Json;
          owner_user_id: string;
          project_id?: string | null;
          publication_year?: number | null;
          summary?: string | null;
          title: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["library_items"]["Insert"]>;
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      project_members: {
        Row: {
          invited_by: string | null;
          joined_at: string;
          project_id: string;
          role: Database["public"]["Enums"]["project_role"];
          user_id: string;
        };
        Insert: {
          invited_by?: string | null;
          joined_at?: string;
          project_id: string;
          role?: Database["public"]["Enums"]["project_role"];
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_members"]["Insert"]>;
      };
      projects: {
        Row: {
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          objectives: string | null;
          owner_user_id: string;
          problem_statement: string | null;
          status: Database["public"]["Enums"]["project_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          objectives?: string | null;
          owner_user_id: string;
          problem_statement?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      submissions: {
        Row: {
          created_at: string;
          document_id: string;
          id: string;
          note: string | null;
          reviewer_user_id: string | null;
          status: Database["public"]["Enums"]["submission_status"];
          submitted_at: string;
          submitted_by: string;
          version_id: string;
        };
        Insert: {
          created_at?: string;
          document_id: string;
          id?: string;
          note?: string | null;
          reviewer_user_id?: string | null;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_at?: string;
          submitted_by: string;
          version_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
      };
      suggestions: {
        Row: {
          anchor_id: string;
          author_user_id: string;
          created_at: string;
          document_id: string;
          id: string;
          original_text: string;
          proposed_text: string;
          status: Database["public"]["Enums"]["suggestion_status"];
          updated_at: string;
          version_id: string | null;
        };
        Insert: {
          anchor_id: string;
          author_user_id: string;
          created_at?: string;
          document_id: string;
          id?: string;
          original_text: string;
          proposed_text: string;
          status?: Database["public"]["Enums"]["suggestion_status"];
          updated_at?: string;
          version_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["suggestions"]["Insert"]>;
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>;
      };
      user_settings: {
        Row: {
          created_at: string;
          email_notifications: boolean;
          theme: Database["public"]["Enums"]["theme_mode"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email_notifications?: boolean;
          theme?: Database["public"]["Enums"]["theme_mode"];
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Insert"]>;
      };
      users: {
        Row: {
          avatar_path: string | null;
          bio: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          institution: string | null;
          role: Database["public"]["Enums"]["platform_role"];
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          bio?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          institution?: string | null;
          role?: Database["public"]["Enums"]["platform_role"];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
    };
    Enums: {
      ai_message_role: "user" | "assistant" | "system";
      ai_mode: "auto" | "writing" | "research" | "critique" | "compare";
      ai_provider: "claude" | "perplexity";
      ai_run_status: "pending" | "completed" | "failed";
      comment_status: "open" | "resolved";
      deliverable_status: "planned" | "in_progress" | "done" | "blocked";
      document_kind: "note" | "article" | "chapter" | "thesis" | "report";
      document_status: "draft" | "in_review" | "approved" | "rejected";
      invitation_status: "pending" | "accepted" | "expired" | "revoked";
      library_item_type: "pdf" | "docx" | "note" | "web" | "book" | "article";
      platform_role: "user" | "admin" | "superadmin";
      project_role: "owner" | "admin" | "collaborator" | "reviewer" | "reader";
      project_status: "planning" | "active" | "review" | "completed" | "archived";
      submission_status: "submitted" | "changes_requested" | "approved" | "rejected";
      suggestion_status: "open" | "accepted" | "rejected";
      theme_mode: "light" | "dark" | "system";
    };
  };
};

export type AppTables = Database["public"]["Tables"];
export type TableRow<T extends keyof AppTables> = AppTables[T]["Row"];
export type TableInsert<T extends keyof AppTables> = AppTables[T]["Insert"];
