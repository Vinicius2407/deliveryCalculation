import { ResponseViaCep } from "../types/integrations/responseViaCep";

export async function getAddressByZipcode(zipcode: string): Promise<ResponseViaCep> {
    const response = await fetch(`https://viacep.com.br/ws/${zipcode}/json/`);
    if (!response.ok) {
        throw new Error('Erro ao buscar o CEP');
    }
    const data: ResponseViaCep = await response.json();
    return data;
} 