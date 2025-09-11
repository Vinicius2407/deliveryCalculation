import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { randomUUID } from 'crypto';
import { DadosPreco } from '../functions/csvHelpers.js';

export enum Classificacao {
  CAPITAL = 'Capital',
  INTERIOR0 = 'Interior 0',
  INTERIOR1 = 'Interior 1',
  INTERIOR2 = 'Interior 2',
  INTERIOR3 = 'Interior 3',
  FLUVIAL1 = 'Fluvial 1',
  FLUVIAL2 = 'Fluvial 2',
  FLUVIAL3 = 'Fluvial 3',
}

export type TaxaFrete = {
    id: string;
    uf: string;
    municipios: string;
    classificacao: string;
}

export type FretePrecos = DadosPreco

type Data = {
  users: { id: string; email: string; password: string }[]
  taxasFrete: TaxaFrete[]
  fretePrecos: FretePrecos[]
}

let db: Low<Data>

export async function createConnection() {
  const file = './src/db/db.json'
  const adapter = new JSONFile<Data>(file)
  const defaultData: Data = { users: [], taxasFrete: [], fretePrecos: [] }
  db = new Low<Data>(adapter, defaultData)

  await db.read()

  if (db.data.users.length === 0) {
    db.data.users.push({
      id: randomUUID(),
      email: 'andre_admin@ninhonatural.com.br',
      password: 'Nncb899800?'
    })
  }

  await db.write()
}

export const getDb = () => db
