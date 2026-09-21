-- Les mesures du test utilisateur de Phase 2.
--
-- SOURCE UNIQUE. Le protocole ne les recopie pas : deux copies divergent, et
-- celle qu'on lirait ne serait pas celle qu'on exécute. Lancées par
-- `./session.sh --mesures <profil>`.
--
-- Les cibles ne sont pas ici. Elles sont engagées dans SPECIFICATION.md
-- §22.3 depuis le 8 septembre 2026, et ce fichier ne les juge pas : il rend
-- les nombres.
--
-- ⚠️ Une fois le premier testeur reçu, CES REQUÊTES NE CHANGENT PLUS. Une
-- requête corrigée en cours de route redéfinit l'indicateur après avoir vu
-- le résultat — exactement ce que §22.2 interdit pour les seuils.

\echo '── B · volume déclaré (§22.3 B)'
SELECT
  count(DISTINCT target_id)                          AS jeux_declares,
  count(DISTINCT platform_id)                        AS plateformes,
  count(*) FILTER (WHERE occurred_kind <> 'Unknown') AS moments_dates
FROM player_events
WHERE user_id = :'profil'
  AND superseded_by_event_id IS NULL;

\echo '── A · T1 et T2, à deux gestes d''amorce près (§22.3 A)'
SELECT
  min(recorded_at)                                        AS depart,
  (SELECT recorded_at FROM player_events WHERE user_id = :'profil'
    ORDER BY recorded_at OFFSET 9 LIMIT 1)                AS dixieme,
  (SELECT recorded_at FROM player_events WHERE user_id = :'profil'
    ORDER BY recorded_at OFFSET 24 LIMIT 1)               AS vingt_cinquieme,
  (SELECT recorded_at FROM player_events WHERE user_id = :'profil'
    ORDER BY recorded_at OFFSET 9 LIMIT 1) - min(recorded_at)  AS t1,
  (SELECT recorded_at FROM player_events WHERE user_id = :'profil'
    ORDER BY recorded_at OFFSET 24 LIMIT 1) - min(recorded_at) AS t2
FROM player_events WHERE user_id = :'profil';

\echo '── E · couverture du référentiel — À RAPPORTER SÉPARÉMENT (§22.3 E)'
SELECT
  count(*) FILTER (WHERE target_kind = 'unresolvedClaim') AS titres_saisis,
  count(*)                                                AS total,
  round(100.0 * count(*) FILTER (WHERE target_kind = 'unresolvedClaim')
        / nullif(count(*), 0), 1)                         AS pourcentage
FROM player_events WHERE user_id = :'profil';

\echo '── ce que le référentiel doit apprendre de ce testeur (§3.5)'
SELECT title, platform_id
FROM unresolved_claims WHERE user_id = :'profil' ORDER BY title;

\echo '── §9 · les souvenirs, et leur genre de cible — signal, pas porte'
SELECT target_kind, count(*), avg(length(text))::int AS longueur_moyenne
FROM memories WHERE user_id = :'profil' GROUP BY target_kind;
