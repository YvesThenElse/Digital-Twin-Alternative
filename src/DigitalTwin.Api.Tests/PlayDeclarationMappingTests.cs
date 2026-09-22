using DigitalTwin.Api.Persistence;
using DigitalTwin.Domain.Player;

namespace DigitalTwin.Api.Tests;

/// <summary>
/// La traduction ligne ↔ jugement, testée pour elle-même.
///
/// <para>Une mutation a révélé que <c>ToDomain</c> pouvait ignorer
/// <c>NeverPlayed</c> sans qu'aucun test ne bronche : les deux intentions
/// existantes le réécrivent toutes les deux, donc aucun chemin ne le
/// <b>préserve</b>. Le jour où une troisième intention arrive — l'affect —,
/// la faute effacerait « je n'y ai jamais joué » au premier « j'ai adoré ».
/// </para>
/// </summary>
public class PlayDeclarationMappingTests
{
    private static PlayDeclarationRow Ligne(
        bool jamaisJoue = false, string provenance = "Unknown", string affect = "Indifferent")
        => new()
        {
            UserId = "usr_1", WorkId = "wrk_1", PlatformId = "plt_1",
            NeverPlayed = jamaisJoue, Provenance = provenance, Affect = affect,
        };

    [Fact]
    public void Une_ligne_jamais_jouee_se_relit_jamais_jouee()
    {
        Assert.True(PlayDeclarationMapping.ToDomain(Ligne(jamaisJoue: true)).NeverPlayed);
    }

    [Fact]
    public void Une_ligne_ordinaire_ne_se_relit_pas_jamais_jouee()
    {
        Assert.False(PlayDeclarationMapping.ToDomain(Ligne()).NeverPlayed);
    }

    [Fact]
    public void Relire_une_ligne_jamais_jouee_efface_ce_que_l_invariant_8_exclut()
    {
        // Invariant 8 : `NeverPlayed` exclut toute autre déclaration. Une
        // ligne incohérente en base — écrite par une version antérieure, ou à
        // la main — ne doit pas ressusciter « je n'y ai jamais joué, et je
        // l'ai adoré ».
        var jugement = PlayDeclarationMapping.ToDomain(
            Ligne(jamaisJoue: true, provenance: "Owned", affect: "Favourite"));

        Assert.True(jugement.NeverPlayed);
        Assert.Equal(Provenance.Unknown, jugement.Provenance);
        Assert.Equal(Affect.Unstated, jugement.Affect);
    }

    [Fact]
    public void Une_ligne_sans_affect_saisi_se_relit_comme_non_prononcee()
    {
        // La valeur par défaut de la colonne est ce qui portait le défaut :
        // toute déclaration créée sans que la question soit posée repartait
        // en base avec « sans plus ».
        var ligne = new PlayDeclarationRow
        {
            UserId = "usr_defaut", WorkId = "wrk_x", PlatformId = "plt_x",
        };

        Assert.Equal(Affect.Unstated, PlayDeclarationMapping.ToDomain(ligne).Affect);
        Assert.Equal("Unstated", ligne.Affect);
    }

    [Fact]
    public void Provenance_et_affect_survivent_a_l_aller_retour()
    {
        var ligne = Ligne(provenance: "Borrowed", affect: "Loved");

        var relu = PlayDeclarationMapping.ToRow(PlayDeclarationMapping.ToDomain(ligne));

        Assert.Equal("Borrowed", relu.Provenance);
        Assert.Equal("Loved", relu.Affect);
    }

    [Fact]
    public void Un_affect_deja_pose_survit_a_une_declaration_de_provenance()
    {
        // Le chemin que le magasin emprunte : relire, appliquer, réécrire.
        // C'est lui qui garantit qu'un geste ne détruit pas les deux autres
        // champs.
        var ligne = Ligne(affect: "Favourite");

        var jugement = PlayDeclarationMapping.ToDomain(ligne).WithProvenance(Provenance.Owned);
        PlayDeclarationMapping.Apply(ligne, jugement);

        Assert.Equal("Owned", ligne.Provenance);
        Assert.Equal("Favourite", ligne.Affect);
        Assert.False(ligne.NeverPlayed);
    }
}
