using DigitalTwin.Domain.Player;

namespace DigitalTwin.Api.Persistence;

/// <summary>
/// Traduction entre la ligne et le jugement de domaine.
///
/// <para>Passer par le type de domaine n'est pas une formalité : c'est lui
/// qui porte les invariants. <c>DeclareNeverPlayed</c> efface provenance et
/// affect (invariant 8) ; <c>WithProvenance</c> lève <c>NeverPlayed</c>
/// (invariant 10, la correction n'est jamais refusée). Réécrire la ligne
/// champ par champ dans le magasin reviendrait à réimplémenter ces règles —
/// donc à les laisser diverger.</para>
/// </summary>
public static class PlayDeclarationMapping
{
    public static PlayDeclaration ToDomain(PlayDeclarationRow l)
    {
        var jugement = new PlayDeclaration(l.UserId, l.WorkId, l.PlatformId)
        {
            Provenance = Enum.Parse<Provenance>(l.Provenance),
            Affect = Enum.Parse<Affect>(l.Affect),
        };
        // L'ORDRE compte : `DeclareNeverPlayed` efface « en cours », donc
        // relire une ligne qui porte les deux doit laisser gagner le premier
        // — c'est ce que l'invariant 8 dit, et la base ne devrait jamais
        // contenir cette combinaison.
        if (l.NeverPlayed) return jugement.DeclareNeverPlayed();
        return l.StillPlaying ? jugement.DeclareStillPlaying() : jugement;
    }

    public static void Apply(PlayDeclarationRow ligne, PlayDeclaration jugement)
    {
        ligne.NeverPlayed = jugement.NeverPlayed;
        ligne.StillPlaying = jugement.StillPlaying;
        ligne.Provenance = jugement.Provenance.ToString();
        ligne.Affect = jugement.Affect.ToString();
    }

    public static PlayDeclarationRow ToRow(PlayDeclaration jugement)
    {
        var ligne = new PlayDeclarationRow
        {
            UserId = jugement.UserId,
            WorkId = jugement.WorkId,
            PlatformId = jugement.PlatformId,
        };
        Apply(ligne, jugement);
        return ligne;
    }
}
