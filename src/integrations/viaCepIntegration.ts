import { ResponseViaCep } from "../types/integrations/responseViaCep.js";

export async function getAddressByZipcode(zipcode: string): Promise<ResponseViaCep> {
    const response = await fetch(`https://viacep.com.br/ws/${zipcode}/json/`);
    if (!response.ok) {
        throw new Error('Erro ao buscar o CEP');
    }
    const data: ResponseViaCep = await response.json();
    console.log(`Dados recebidos do ViaCep para o CEP ${zipcode}:`, data);
    return data;
} 