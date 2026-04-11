export type UserFacingErrorScope =
  | "auth"
  | "recovery"
  | "invitation"
  | "workspace"
  | "dashboard"
  | "document"
  | "project"
  | "library"
  | "admin";

export type UserFacingError = {
  title: string;
  description: string;
};

type ErrorLike = {
  message?: string | null;
  code?: string | null;
  status?: number | null;
};

const fallbackByScope: Record<UserFacingErrorScope, UserFacingError> = {
  auth: {
    title: "Connexion impossible",
    description:
      "LAKHub n’a pas pu ouvrir votre session. Vérifiez vos identifiants puis réessayez."
  },
  recovery: {
    title: "Réinitialisation indisponible",
    description:
      "Le lien ou l’envoi de réinitialisation n’a pas pu être finalisé pour le moment."
  },
  invitation: {
    title: "Invitation indisponible",
    description:
      "Le lien d’invitation ne peut pas être traité pour le moment. Réessayez ou demandez un nouveau lien."
  },
  workspace: {
    title: "Workspace temporairement indisponible",
    description:
      "LAKHub n’a pas pu charger cet écran. Réessayez dans un instant ou revenez au tableau de bord."
  },
  dashboard: {
    title: "Tableau de bord indisponible",
    description:
      "Le point d’entrée du workspace ne s’est pas chargé correctement. Réessayez dans un instant."
  },
  document: {
    title: "Document indisponible",
    description:
      "Ce document n’est plus accessible pour le moment ou vos droits ne permettent pas de l’ouvrir."
  },
  project: {
    title: "Projet indisponible",
    description:
      "Ce projet n’est plus accessible pour le moment ou vos droits ne permettent pas de l’ouvrir."
  },
  library: {
    title: "Bibliothèque indisponible",
    description:
      "La bibliothèque n’a pas pu être chargée correctement. Réessayez dans un instant."
  },
  admin: {
    title: "Administration indisponible",
    description:
      "La vue d’administration n’a pas pu être chargée. Vérifiez vos droits puis réessayez."
  }
};

function getErrorLike(error: unknown): ErrorLike {
  if (!error || typeof error !== "object") {
    return {
      message: typeof error === "string" ? error : null,
      code: null,
      status: null
    };
  }

  return error as ErrorLike;
}

function getLowerMessage(error: unknown) {
  return (getErrorLike(error).message ?? "").toLowerCase();
}

export function isSupabaseNotFoundError(error: unknown) {
  const { code, status } = getErrorLike(error);
  const message = getLowerMessage(error);

  return (
    code === "PGRST116" ||
    status === 404 ||
    message.includes("json object requested") ||
    message.includes("no rows") ||
    message.includes("0 rows")
  );
}

export function getUserFacingError(
  error: unknown,
  scope: UserFacingErrorScope = "workspace"
): UserFacingError {
  const { message, code, status } = getErrorLike(error);
  const lowerMessage = (message ?? "").toLowerCase();

  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid credentials")
  ) {
    return {
      title: "Identifiants non reconnus",
      description:
        "Vérifiez l’adresse email utilisée pour LAKHub ainsi que le mot de passe saisi."
    };
  }

  if (lowerMessage.includes("email not confirmed")) {
    return {
      title: "Accès pas encore activé",
      description:
        "Votre compte existe, mais son activation n’est pas encore finalisée. Utilisez le lien reçu par email ou demandez un nouvel accès."
    };
  }

  if (
    lowerMessage.includes("too many requests") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("rate-limit") ||
    lowerMessage.includes("too many") ||
    status === 429
  ) {
    return {
      title: "Trop de tentatives",
      description:
        "LAKHub limite momentanément les essais pour protéger l’accès. Attendez quelques minutes puis réessayez."
    };
  }

  if (
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch failed")
  ) {
    return {
      title: "Connexion réseau interrompue",
      description:
        "Le navigateur n’a pas pu joindre le service d’authentification ou de données. Vérifiez la connexion puis réessayez."
    };
  }

  if (
    lowerMessage.includes("authentification requise") ||
    lowerMessage.includes("not authenticated") ||
    lowerMessage.includes("jwt expired") ||
    lowerMessage.includes("session")
  ) {
    return {
      title: "Session à rouvrir",
      description:
        "Votre session n’est plus valide. Reconnectez-vous pour reprendre le travail en toute sécurité."
    };
  }

  if (
    lowerMessage.includes("profil utilisateur introuvable") ||
    lowerMessage.includes("profile not found")
  ) {
    return {
      title: "Compte incomplet côté workspace",
      description:
        "L’authentification fonctionne, mais le profil LAKHub lié à ce compte n’est pas encore prêt."
    };
  }

  if (
    lowerMessage.includes("permission") ||
    lowerMessage.includes("not allowed") ||
    lowerMessage.includes("forbidden") ||
    lowerMessage.includes("row-level security")
  ) {
    return {
      title: "Accès non autorisé",
      description:
        "Vous n’avez pas les droits nécessaires pour ouvrir cet écran ou exécuter cette action."
    };
  }

  if (isSupabaseNotFoundError(error)) {
    if (scope === "document") {
      return {
        title: "Document introuvable",
        description:
          "Ce document n’existe plus, n’est plus partagé avec vous ou son lien n’est plus valide."
      };
    }

    if (scope === "project") {
      return {
        title: "Projet introuvable",
        description:
          "Ce projet n’existe plus, n’est plus partagé avec vous ou son lien n’est plus valide."
      };
    }

    if (scope === "invitation") {
      return {
        title: "Invitation introuvable",
        description:
          "Le lien d’invitation n’est plus valide. Demandez un nouveau lien si nécessaire."
      };
    }
  }

  if (lowerMessage.includes("service role")) {
    return {
      title: "Configuration incomplète",
      description:
        "Une clé de service nécessaire à cette opération n’est pas disponible dans l’environnement."
    };
  }

  if (code === "23505" || lowerMessage.includes("duplicate key")) {
    return {
      title: "Élément déjà existant",
      description:
        "Cette opération a déjà été effectuée ou les mêmes informations existent déjà dans LAKHub."
    };
  }

  return fallbackByScope[scope];
}
