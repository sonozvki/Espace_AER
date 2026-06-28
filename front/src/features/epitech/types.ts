export type EpitechActivity = {
  id: string;
  module: string;
  moduleTitle: string;
  title: string;
  type: string;
  start: string; // "YYYY-MM-DD HH:mm:ss"
  end: string;
  room: string | null;
  registered: boolean;
};

// État renvoyé par le hook pour piloter l'affichage du dashboard
export type EpitechStatus = "ok" | "no_token" | "token_invalid";
