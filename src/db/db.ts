import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { randomUUID } from 'crypto';

export enum Classificacao {
  CAPITAL = 'Capital',
}

export type TaxaFrete = {
    id: string;
    uf: string;
    municipios: string;
    classificacao: string;
}

export type FretePrecos = {

}

type Data = {
  users: { id: string; email: string; password: string }[]
  taxasFrete: TaxaFrete[]
  fretePrecos?: FretePrecos[]
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
