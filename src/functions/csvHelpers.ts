import { CsvParserStream, parse } from 'fast-csv';
import { Readable } from 'stream';

import { Classificacao } from '../db/db';

export interface DadosPreco {
    UF: string;
    classificacao: Classificacao;
    precos_por_kg: { [key: string]: number };
}

interface CsvRow extends Array<string> { }

/**
 * Mapeia a string da localidade do CSV para o enum Classificacao.
 * @param localidade A string da segunda coluna do CSV.
 * @returns O valor do enum Classificacao correspondente.
 */
function getClassificationFromString(localidade: string): Classificacao {
    switch (localidade) {
        case 'Interior 0':
            return Classificacao.INTERIOR0;
        case 'Interior 1':
            return Classificacao.INTERIOR1;
        case 'Interior 2':
            return Classificacao.INTERIOR2;
        case 'Interior 3':
            return Classificacao.INTERIOR3;
        case 'Fluvial 1':
            return Classificacao.FLUVIAL1;
        case 'Fluvial 2':
            return Classificacao.FLUVIAL2;
        case 'Fluvial 3':
            return Classificacao.FLUVIAL3;
        default:
            return Classificacao.CAPITAL;
    }
}

export function parseCsvStream(stream: Readable): Promise<DadosPreco[]> {
    return new Promise((resolve, reject) => {
        const results: DadosPreco[] = [];
        let lastUF = '';

        const csvStream: CsvParserStream<CsvRow, CsvRow> = parse({ headers: false, skipRows: 2 })
            .on('error', (error) => reject(error))
            .on('data', (row: CsvRow) => {
                if (row.length < 3 || row.every(field => field.trim() === '')) {
                    return;
                }

                const currentUF = row[0] && row[0].trim() !== '' ? row[0].trim() : lastUF;
                const localidade = row[1] ? row[1].trim() : '';

                if (currentUF && localidade) {
                    lastUF = currentUF;
                    const classificacao = getClassificationFromString(localidade);
                    const precos_por_kg: { [key: string]: number } = {};

                    for (let i = 2; i < row.length - 1; i++) {
                        const key = (i - 1).toString();
                        const value = row[i];

                        if (value && value.trim() !== '') {
                            const cleanedValue = value.replace(/"/g, '');
                            precos_por_kg[key] = parseFloat(cleanedValue.replace(',', '.'));
                        }
                    }

                    if (Object.keys(precos_por_kg).length > 0) {
                        results.push({
                            UF: currentUF,
                            classificacao,
                            precos_por_kg,
                        });
                    }
                }
            })
            .on('end', (rowCount: number) => {
                console.log(`Parsed ${rowCount} data rows from CSV.`);
                resolve(results);
            });

        stream.pipe(csvStream);
    });
}
