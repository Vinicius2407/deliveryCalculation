import { Readable } from 'stream';
import * as csv from 'fast-csv';
import { randomUUID } from 'crypto';
import { Classificacao, TaxaFrete } from '../db/db.js';
import { parseCsvStream } from '../functions/csvHelpers.js';
import { getAddressByZipcode } from '../integrations/viaCepIntegration.js';
import { Quote, RequestIntegration, ResponseIntegration } from '../types/integrations/yampiTypes.js';
import { FreightRepository } from '../repositories/freightRepository.js';

/**
 * @class FreightService
 * @description Provides freight-related services.
 */
export class FreightService {
    /**
     * @constructor
     * @param {FreightRepository} freightRepository - The freight repository.
     */
    constructor(private freightRepository: FreightRepository) {}

    /**
     * @method uploadTaxasFrete
     * @description Uploads freight rates from a CSV file.
     * @param {any} data - The file data.
     * @returns {Promise<{message: string}>}
     */
    async uploadTaxasFrete(data: any): Promise<{ message: string }> {
        const taxas: TaxaFrete[] = [];
        const fileStream = data.file;

        const chunks: Buffer[] = [];
        fileStream.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));

        return new Promise<{ message: string }>((resolve, reject) => {
            fileStream.on('end', async () => {
                try {
                    const fileBuffer = Buffer.concat(chunks);
                    const fileContent = fileBuffer.toString('latin1');
                    const readableStream = Readable.from(fileContent);
    
                    const csvStream = readableStream.pipe(csv.parse({ headers: true, delimiter: ';' }));
    
                    for await (const chunk of csvStream) {
                        let classificacao: Classificacao;
                        switch (chunk['Classificacao']) {
                            case 'Interior 0':
                                classificacao = Classificacao.INTERIOR0;
                                break;
                            case 'Interior 1':
                                classificacao = Classificacao.INTERIOR1;
                            case 'Interior 2':
                                classificacao = Classificacao.INTERIOR2;
                                break;
                            case 'Interior 3':
                                classificacao = Classificacao.INTERIOR3;
                                break;
                            case 'Fluvial 1':
                                classificacao = Classificacao.FLUVIAL1;
                                break;
                            case 'Fluvial 2':
                                classificacao = Classificacao.FLUVIAL2;
                                break;
                            case 'Fluvial 3':
                                classificacao = Classificacao.FLUVIAL3;
                                break;
                            default:
                                classificacao = Classificacao.CAPITAL;
                        }
                        taxas.push({
                            id: randomUUID(),
                            uf: chunk['UF'],
                            municipios: chunk['Municipios'],
                            classificacao: classificacao,
                        });
                    }
    
                    await this.freightRepository.saveTaxasFrete(taxas);
                    resolve({ message: `${taxas.length} registros adicionados` });
                } catch (error) {
                    reject(error);
                }
            });

            fileStream.on('error', (error: any) => reject(error));
        });
    }

    /**
     * @method uploadParsePrecos
     * @description Uploads and parses freight prices from a CSV file.
     * @param {any} data - The file data.
     * @returns {Promise<{message: string, filename: string}>}
     */
    async uploadParsePrecos(data: any) {
        console.log(`Recebendo arquivo para parsing de preços: ${data.filename}`);
        const dadosPrecos = await parseCsvStream(data.file);
        await this.freightRepository.saveFretePrecos(dadosPrecos);

        return {
            message: `${dadosPrecos.length} registros de preços salvos com sucesso!`,
            filename: data.filename,
        };
    }

    /**
     * @method calculoFrete
     * @description Calculates the freight cost.
     * @param {RequestIntegration} requestBodyIntegration - The request body.
     * @returns {Promise<ResponseIntegration>}
     * @throws {Error} If the CEP is invalid or not found.
     * @throws {Error} If no freight table is found for the location.
     * @throws {Error} If the total weight exceeds the freight limit.
     */
    async calculoFrete(requestBodyIntegration: RequestIntegration): Promise<ResponseIntegration> {
        const cityViaCep = await getAddressByZipcode(requestBodyIntegration.zipcode);

        if (!cityViaCep || !cityViaCep.uf || !cityViaCep.localidade) {
            throw new Error('CEP inválido ou não encontrado.');
        }

        const classificacaoMunicipios = await this.freightRepository.findTaxaFrete(cityViaCep.uf, cityViaCep.localidade);
        console.log("Classificacao encontrada:", classificacaoMunicipios);
        const pricesPerKg = await this.freightRepository.findPrecosPorKg(classificacaoMunicipios?.uf, classificacaoMunicipios?.classificacao);

        if (pricesPerKg.length === 0 || !pricesPerKg[0]!.precos_por_kg) {
            throw new Error('Nenhuma tabela de frete encontrada para a localidade.');
        }

        const totalWeight = requestBodyIntegration.skus.reduce((acc: number, sku: any) => acc + sku.weight * sku.quantity, 0);

        const precosObj = pricesPerKg[0]!.precos_por_kg;
        const pesosDasFaixas = Object.keys(precosObj);
        const faixasOrdenadas = pesosDasFaixas.map(p => parseFloat(p)).sort((a, b) => a - b);
        const faixaEncontrada = faixasOrdenadas.find(pesoDaFaixa => totalWeight <= pesoDaFaixa);

        let valorDoFrete = null;

        if (faixaEncontrada !== undefined) {
            valorDoFrete = precosObj[faixaEncontrada];
        }

        if (valorDoFrete === null) {
            throw new Error(`O peso total de ${totalWeight}kg excede o limite de frete para esta região.`);
        }

        const retornoPrecos: ResponseIntegration = new ResponseIntegration();
        const quote: Quote = new Quote();
        quote.name = "Fedex API";
        quote.service = "FEDEX";
        quote.price = valorDoFrete!;
        quote.days = 7; // Prazo fixo de entrega
        quote.quote_id = randomUUID();
        quote.free_shipment = false; // Frete grátis para compras acima de 150

        retornoPrecos.quotes.push(quote);

        return retornoPrecos;
    }
}