export type ChessComPlayerProfile = {
  username: string;
  player_id?: number;
  name?: string;
  title?: string;
  status?: string;
  avatar?: string;
  country?: string;
  joined?: number;
  last_online?: number;
  followers?: number;
  is_streamer?: boolean;
  verified?: boolean;
  league?: string;
  url?: string;
};

export type ChessComStats = Record<string, unknown>;

export type ChessComArchivesResponse = {
  archives: string[];
};

export type ChessComGamePlayer = {
  username?: string;
  rating?: number;
  result?: string;
  '@id'?: string;
};

export type ChessComGame = {
  url: string;
  pgn?: string;
  tcn?: string;
  fen?: string;
  end_time: number;
  time_class?: string;
  time_control?: string;
  rated?: boolean;
  rules?: string;
  eco?: string;
  eco_url?: string;
  accuracies?: {
    white?: number | string;
    black?: number | string;
  };
  white: ChessComGamePlayer;
  black: ChessComGamePlayer;
};

export type ChessComMonthlyGamesResponse = {
  games: ChessComGame[];
};
