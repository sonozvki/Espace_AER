export type EpitechActivity = {
  id: string;
  module: string;
  moduleTitle: string;
  title: string;
  type: string;
  start: string; // "YYYY-MM-DD HH:mm:ss"
  end: string;
  room: string | null;
  status: string | null; // statut de l'AER sur l'activité (status_manager)
};

