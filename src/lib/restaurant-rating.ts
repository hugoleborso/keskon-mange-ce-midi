/**
 * Décide si un restaurant mérite la pastille "beurk 🤮".
 *
 * Un restaurant sans aucun avis n'est PAS beurk : pas d'avis ne veut pas
 * dire mauvais, juste qu'on ne sait pas encore.
 */
export function isBeurk(averageRating: number | null, reviewsCount: number): boolean {
	if (reviewsCount === 0 || averageRating === null) return false;
	return averageRating < 2;
}
