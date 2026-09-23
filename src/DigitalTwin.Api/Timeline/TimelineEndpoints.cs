using DigitalTwin.Api.Persistence;
using DigitalTwin.Api.Reference;
using DigitalTwin.Domain.Player;
using DigitalTwin.Domain.Temporal;

namespace DigitalTwin.Api.Timeline;

/// <summary>
/// La valeur temporelle telle que l'écran doit pouvoir l'afficher.
///
/// <para><b>La granularité voyage avec la date.</b> N'exposer qu'un
/// intervalle perdrait ce que l'utilisateur a déclaré : « vers 1995 »
/// s'afficherait comme « 1995 », et l'incertitude assumée — le seul
/// différenciateur réellement vacant du produit — disparaîtrait à
/// l'affichage.</para>
/// </summary>
public sealed record TemporalView(
    string Kind,
    string? Date = null,
    int? Year = null,
    int? Month = null,
    int? EndYear = null,
    int? Margin = null,
    int? Age = null);

/// <summary>
/// Le souvenir attaché à la cible du moment (§9.2).
///
/// <para><b>Nul quand il n'y en a pas</b>, jamais un objet vide : l'axe
/// afficherait un repère annonçant une phrase introuvable.</para>
/// </summary>
public sealed record MemoryView(string? Title, string Text);

/// <param name="TargetLabel">
/// Le titre lisible. L'écran ne peut pas le résoudre : il n'a chargé qu'une
/// plateforme, et la timeline les traverse toutes.
/// </param>
/// <param name="PlatformId">
/// La machine sur laquelle cette déclaration a été faite — <b>une donnée
/// reçue, jamais déduite de l'œuvre</b>.
///
/// <para>Elle a un lecteur : la fiche de jeu (E05) ouverte depuis l'axe
/// déclare et rétracte sur CETTE machine. La déduire du catalogue
/// fonctionnerait sur le dataset POC, dont une seule œuvre sur 221 est
/// multi-plateforme, et se mettrait à mentir dès qu'il grandit.</para>
///
/// <para><c>null</c> pour un événement qui ne vient pas d'une sélection par
/// machine : la fiche ne propose alors pas de déclarer, plutôt que de
/// choisir une machine à la place du joueur.</para>
/// </param>
/// <param name="Memory">
/// Le souvenir écrit sur la CIBLE, pas sur le moment : le modèle l'attache à
/// un jeu (MODELE §5), et trois moments du même titre en portent donc le
/// même. Le rendre une fois par cible est une décision d'écran, pas de
/// l'API — qui dirait alors laquelle des trois lignes est la bonne.
/// </param>
public sealed record MomentView(
    string Id, string Type, string TargetKind, string TargetId,
    string TargetLabel, string Confidence, TemporalView OccurredAt,
    string? PlatformId = null, MemoryView? Memory = null);

public sealed record IntervalView(string Start, string End);

public sealed record EntryView(
    bool IsEpisode, IntervalView Interval, IReadOnlyList<MomentView> Moments);

public sealed record WarningView(
    string ExpectedEarlierId, string ExpectedLaterId, string Message);

public sealed record TimelineView(
    IReadOnlyList<EntryView> Entries,
    IReadOnlyList<MomentView> Undated,
    IReadOnlyList<WarningView> Warnings);

public static class TimelineEndpoints
{
    public static IEndpointRouteBuilder MapTimeline(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/timeline/{userId}", async (
            string userId, EventStore magasin,
            ReferenceCatalogSource source, CancellationToken ct) =>
        {
            var journal = await magasin.ReadAsync(userId, ct);

            // Les titres, résolus UNE FOIS pour tout le rendu : une recherche
            // par moment ferait 221 comparaisons par ligne affichée.
            var titres = source.Dataset.Works.ToDictionary(
                w => w.CanonicalId, w => w.Title, StringComparer.Ordinal);
            var revendications = (await magasin.ReadClaimsAsync(userId, ct))
                .ToDictionary(c => c.Id, c => c.Title, StringComparer.Ordinal);

            // Indexés par le COUPLE genre + identifiant. L'identifiant seul
            // rapprocherait un jour le souvenir d'une revendication de celui
            // d'une œuvre — deux espaces de noms distincts que rien
            // n'empêche de se croiser.
            var souvenirs = (await magasin.ReadMemoriesAsync(userId, ct))
                .ToDictionary(
                    m => (m.TargetKind, m.TargetId),
                    m => new MemoryView(m.Title, m.Text));

            MemoryView? Souvenir(PlayerEvent e)
                => souvenirs.GetValueOrDefault((e.Target.Kind, e.Target.Id));

            string Libelle(PlayerEvent e) => e.Target.Kind switch
            {
                "unresolvedClaim" => revendications.GetValueOrDefault(e.Target.Id)
                                     ?? "Titre saisi, introuvable",
                _ => titres.GetValueOrDefault(e.Target.Id)
                     // Montrer l'identifiant serait faire remonter le modèle
                     // dans l'écran : mieux vaut dire qu'on ne sait pas.
                     ?? "Œuvre inconnue du référentiel",
            };

            // L'horizon se construit À LA LECTURE, avec l'année de naissance
            // du moment. C'est ce qui permet de la renseigner plus tard et de
            // replacer tous les moments concernés — sans réécrire un seul
            // événement, ce que le journal en ajout seul interdirait.
            // Lue en base, une seule source : reçue en paramètre, elle
            // pouvait différer d'un écran à l'autre, et les mêmes moments
            // changeaient de place selon la page.
            var horizon = new TemporalHorizon(
                DateOnly.FromDateTime(DateTime.UtcNow),
                await magasin.BirthYearAsync(userId, ct));

            // Aucun ordonnancement ici. Le domaine en a 387 tests ; le
            // réimplémenter, même partiellement, le ferait diverger sans que
            // rien ne le signale — et la timeline bougerait d'une visite à
            // l'autre, ce que l'utilisateur ne distingue pas d'une perte de
            // données.
            var tri = TimelineSorter.Sort(journal, horizon);

            return Results.Ok(new TimelineView(
                [.. tri.Entries.Select(e => new EntryView(
                    e.IsEpisode,
                    new IntervalView(
                        e.Interval.Start.ToString("yyyy-MM-dd"),
                        e.Interval.End.ToString("yyyy-MM-dd")),
                    [.. e.Moments.Select(m => Voir(m, Libelle(m), Souvenir(m)))]))],
                [.. tri.Undated.Select(m => Voir(m, Libelle(m), Souvenir(m)))],
                [.. tri.Warnings.Select(w => new WarningView(
                    w.ExpectedEarlierId, w.ExpectedLaterId, w.Message))]));
        });

        return routes;
    }

    private static MomentView Voir(PlayerEvent e, string libelle, MemoryView? souvenir)
        => new(e.Id, e.Type, e.Target.Kind, e.Target.Id, libelle,
               e.Confidence.ToString(), TemporalEncoding.Voir(e.OccurredAt),
               e.PlatformId, souvenir);
}
