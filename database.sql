DROP TABLE IF EXISTS "matches";
CREATE TABLE "public"."matches" (
    "player1" character varying(16) NOT NULL,
    "player2" character varying(16) NOT NULL,
    "tournament_id" integer NOT NULL,
    "round" integer NOT NULL,
    "match" integer NOT NULL,
    "winner" character varying(16),
    "player1_hits" integer DEFAULT 0 NOT NULL,
    "player2_hits" integer DEFAULT 0 NOT NULL
) with (oids = false);

CREATE UNIQUE INDEX "matches_player1_player2_round" ON "public"."matches" (LEAST("player1", "player2"), GREATEST("player1", "player2"), "round");

DROP TABLE IF EXISTS "players";
CREATE TABLE "public"."players" (
    "player_name" character varying(16) NOT NULL,
    CONSTRAINT "players_player_name" UNIQUE ("player_name")
) WITH (oids = false);


DROP TABLE IF EXISTS "tournament_players";
CREATE TABLE "public"."tournament_players" (
    "player_name" character varying(16) NOT NULL,
    "tournament_id" integer NOT NULL,
    CONSTRAINT "tournament_players_player_name_tournament_id" PRIMARY KEY ("player_name", "tournament_id")
) WITH (oids = false);


DROP TABLE IF EXISTS "tournaments";
DROP SEQUENCE IF EXISTS tournaments_id_seq;
CREATE SEQUENCE tournaments_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 2 CACHE 1;

CREATE TABLE "public"."tournaments" (
    "id" integer DEFAULT nextval('tournaments_id_seq') NOT NULL,
    "name" character varying(32) NOT NULL,
    "date" date NOT NULL,
    "format" character varying(16) NOT NULL,
    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "users";
CREATE TABLE "public"."users" (
    "username" character varying NOT NULL,
    "password" character varying(256) NOT NULL,
    "role" character varying(16) NOT NULL
) WITH (oids = false);


ALTER TABLE ONLY "public"."matches" ADD CONSTRAINT "matches_player1_tournament_id_fkey" FOREIGN KEY (player1, tournament_id) REFERENCES tournament_players(player_name, tournament_id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."matches" ADD CONSTRAINT "matches_player2_tournament_id_fkey" FOREIGN KEY (player2, tournament_id) REFERENCES tournament_players(player_name, tournament_id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."matches" ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."matches" ADD CONSTRAINT "matches_winner_tournament_id_fkey" FOREIGN KEY (winner, tournament_id) REFERENCES tournament_players(player_name, tournament_id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE;

ALTER TABLE ONLY "public"."tournament_players" ADD CONSTRAINT "tournament_players_player_name_fkey" FOREIGN KEY (player_name) REFERENCES players(player_name) NOT DEFERRABLE;
ALTER TABLE ONLY "public"."tournament_players" ADD CONSTRAINT "tournament_players_tournament_id_fkey" FOREIGN KEY (tournament_id) REFERENCES tournaments(id) NOT DEFERRABLE;
