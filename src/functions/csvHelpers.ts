export interface PrecosPorKg {
    [key: string]: number;
}

export interface DadosPreco {
    uf: string;
    regiao: string;
    precos_por_kg: PrecosPorKg;
}

export interface LinhaCsv {
    [key: string]: string;
}

import { parse } from 'fast-csv';
import { Readable } from 'stream';

export function parseCsvStream(stream: Readable): Promise<DadosPreco[]> {
    return new Promise((resolve, reject) => {
        const results: DadosPreco[] = [];
        let lastUf = '';

        stream
            .pipe(parse({ headers: true, trim: true }))
            .on('error', (error) => reject(error))
            .on('data', (row: LinhaCsv) => {
                if (row.UF && row.UF.trim() !== '') {
                    lastUf = row.UF;
                }

                const precosPorKg: PrecosPorKg = {};
                for (const key in row) {
                    if (!isNaN(parseInt(key, 10)) && key.trim() !== '') {
                        precosPorKg[key] = parseFloat(row[key]!);
                    }
                }

                const parsedRow: DadosPreco = {
                    uf: lastUf,
                    regiao: row['Região'] || '',
                    precos_por_kg: precosPorKg,
                };

                results.push(parsedRow);
            })
            .on('end', (rowCount: number) => {
                console.log(`Parsing do CSV finalizado. ${rowCount} linhas processadas.`);
                resolve(results);
            });
    });
  }