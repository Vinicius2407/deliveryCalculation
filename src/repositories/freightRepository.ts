
import { getDb, TaxaFrete } from '../db/db.js';
import { DadosPreco } from '../functions/csvHelpers.js';

/**
 * @class FreightRepository
 * @description Handles database operations for freight.
 */
export class FreightRepository {
    /**
     * @method saveTaxasFrete
     * @description Saves freight rates to the database.
     * @param {TaxaFrete[]} taxas - The freight rates to save.
     */
    async saveTaxasFrete(taxas: TaxaFrete[]) {
        const db = getDb();
        db.data.taxasFrete = [];
        db.data.taxasFrete.push(...taxas);
        await db.write();
    }

    /**
     * @method saveFretePrecos
     * @description Saves freight prices to the database.
     * @param {DadosPreco[]} precos - The freight prices to save.
     */
    async saveFretePrecos(precos: DadosPreco[]) {
        const db = getDb();
        db.data.fretePrecos = [];
        db.data.fretePrecos.push(...precos);
        await db.write();
    }

    /**
     * @method findTaxaFrete
     * @description Finds a freight rate by UF and municipality.
     * @param {string} uf - The state (UF).
     * @param {string} municipio - The municipality.
     * @returns {Promise<TaxaFrete | undefined>} The freight rate or undefined if not found.
     */
    async findTaxaFrete(uf: string, municipio: string): Promise<TaxaFrete | undefined> {
        const db = getDb();
        return db.data.taxasFrete.find((t: TaxaFrete) => t.uf.toLowerCase() === uf.toLowerCase() && t.municipios.toLowerCase() === municipio.toLowerCase());
    }

    /**
     * @method findPrecosPorKg
     * @description Finds freight prices per kg by UF and classification.
     * @param {string | undefined} uf - The state (UF).
     * @param {string | undefined} classificacao - The classification.
     * @returns {Promise<DadosPreco[]>} The freight prices.
     */
    async findPrecosPorKg(uf: string | undefined, classificacao: string | undefined): Promise<DadosPreco[]> {
        const db = getDb();
        return db.data.fretePrecos.filter((p: DadosPreco) => p.UF == uf && p.classificacao.toLowerCase() === (classificacao?.toLowerCase() ?? 'capital'));
    }
}
