CREATE TABLE public.online_ghosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  fighter_id text NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.online_ghosts TO service_role;
ALTER TABLE public.online_ghosts ENABLE ROW LEVEL SECURITY;
CREATE INDEX online_ghosts_created_idx ON public.online_ghosts (created_at DESC);

CREATE TABLE public.duel_lobbies (
  code text PRIMARY KEY,
  host_name text NOT NULL,
  host_fighter text NOT NULL,
  host_result jsonb,
  guest_name text,
  guest_fighter text,
  guest_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.duel_lobbies TO service_role;
ALTER TABLE public.duel_lobbies ENABLE ROW LEVEL SECURITY;