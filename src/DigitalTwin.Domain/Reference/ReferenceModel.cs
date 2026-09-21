namespace DigitalTwin.Domain.Reference;

/// <summary>
/// La nature d'un lien entre deux œuvres (MODELE-DE-DOMAINE §4).
/// <b>Toujours nommée, jamais implicite.</b>
/// </summary>
public enum WorkRelationKind { Remake, Remaster, Prequel, Sequel, Spinoff, SameSeries }

/// <summary>Une plateforme, avec sa génération.</summary>
public sealed record Platform(string CanonicalId, string Name);

/// <summary>
/// L'œuvre abstraite — le premier des quatre niveaux.
///
/// <para><b>Un remake n'est pas une version</b> : c'est un <c>Work</c>
/// distinct, relié par une <see cref="WorkRelation"/>. Final Fantasy VII
/// Remake est une autre œuvre.</para>
/// </summary>
public sealed record Work(string CanonicalId, string Title)
{
    /// <summary>Rang de notoriété, requis par §3.3 — la sélection massive ordonne par lui.</summary>
    public int Notability { get; init; }

    /// <summary>
    /// Identifiants externes rattachés à cette œuvre. C'est ce qui permet à
    /// trois fiches d'une source — Pokémon Rouge/Vert, Rouge, Rouge/Bleu —
    /// de désigner un seul souvenir.
    /// </summary>
    public IReadOnlyList<string> ExternalIds { get; init; } = [];
}

/// <summary>Une refonte significative — remaster, portage. Pas un remake.</summary>
public sealed record GameVersion(string CanonicalId, string WorkId, string Label);

/// <summary>
/// Une <see cref="GameVersion"/> sur une <see cref="Platform"/> dans une
/// région. <b>La région est requise dès la Phase 1</b> (§3.4) : elle change
/// les titres autant que les dates.
/// </summary>
public sealed record Release(
    string CanonicalId, string GameVersionId, string PlatformId, string Region);

/// <summary>
/// L'objet commercial précis — standard, Platinum, collector, numérique.
///
/// <para>Une édition peut contenir <b>plusieurs œuvres</b> : c'est le cas de
/// la compilation. Posséder l'édition ne fait pas posséder les œuvres
/// qu'elle réunit (§6.3).</para>
/// </summary>
public sealed record Edition(string CanonicalId, string ReleaseId, string Label)
{
    public IReadOnlyList<string> ContainedWorkIds { get; init; } = [];
}

/// <summary>Un lien typé entre deux œuvres.</summary>
public sealed record WorkRelation(string FromWorkId, string ToWorkId, WorkRelationKind Kind);

/// <summary>
/// Le référentiel, et <b>sa table de redirection permanente</b>.
///
/// <para>MODELE-DE-DOMAINE §10.2 : un <c>CanonicalId</c> n'est jamais
/// réattribué, et la table n'est jamais purgée — un export utilisateur vieux
/// de trois ans doit encore se résoudre.</para>
/// </summary>
public sealed class ReferenceCatalog
{
    private readonly Dictionary<string, Work> _works = new(StringComparer.Ordinal);
    private readonly Dictionary<string, string> _redirects = new(StringComparer.Ordinal);
    private readonly Dictionary<string, string> _externalToWork = new(StringComparer.Ordinal);
    private readonly List<WorkRelation> _relations = [];
    private readonly Dictionary<string, Edition> _editions = new(StringComparer.Ordinal);

    public ReferenceCatalog Add(Work work)
    {
        _works[work.CanonicalId] = work;
        foreach (var externe in work.ExternalIds)
        {
            _externalToWork[externe] = work.CanonicalId;
        }
        return this;
    }

    public ReferenceCatalog Add(Edition edition)
    {
        _editions[edition.CanonicalId] = edition;
        return this;
    }

    public ReferenceCatalog Relate(string from, string to, WorkRelationKind kind)
    {
        _relations.Add(new WorkRelation(from, to, kind));
        return this;
    }

    /// <summary>
    /// Enregistre une scission. Le <c>CanonicalId</c> d'origine reste sur
    /// l'entité qui conserve <b>la majorité des correspondances externes</b> ;
    /// l'autre en reçoit un nouveau, et les références à l'ancien s'y
    /// redirigent quand elles le désignent.
    /// </summary>
    public ReferenceCatalog RecordSplit(string originalId, string newId)
    {
        _redirects[originalId] = newId;
        return this;
    }

    /// <summary>
    /// Résout un identifiant à travers la table de redirection. Une référence
    /// ancienne trouve toujours son œuvre — <b>sans perte</b>.
    /// </summary>
    public string Resolve(string canonicalId)
    {
        var vus = new HashSet<string>(StringComparer.Ordinal);
        var courant = canonicalId;
        while (_redirects.TryGetValue(courant, out var suivant) && vus.Add(courant))
        {
            courant = suivant;
        }
        return courant;
    }

    /// <summary>L'œuvre canonique derrière un identifiant de source externe.</summary>
    public Work? ByExternalId(string externalId) =>
        _externalToWork.TryGetValue(externalId, out var id) ? _works.GetValueOrDefault(id) : null;

    public Work? ById(string canonicalId) => _works.GetValueOrDefault(Resolve(canonicalId));

    public Edition? EditionById(string canonicalId) => _editions.GetValueOrDefault(canonicalId);

    public IReadOnlyList<WorkRelation> RelationsOf(string workId) =>
        _relations.Where(r => r.FromWorkId == workId || r.ToWorkId == workId).ToArray();

    /// <summary>
    /// <c>true</c> si les deux identifiants désignent la même œuvre après
    /// résolution des alias et des redirections. C'est ce qui permet à un
    /// joueur français de 1999 et à un joueur japonais de 1996 de se comparer.
    /// </summary>
    public bool SameWork(string a, string b) =>
        (ByExternalId(a)?.CanonicalId ?? Resolve(a)) ==
        (ByExternalId(b)?.CanonicalId ?? Resolve(b));
}
