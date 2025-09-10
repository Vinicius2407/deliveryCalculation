export interface RequestIntegration {
    zipcode: string
    amount: number
    cart: Cart
    skus: Sku[]
}

export interface Cart {
    promocode: any
    customer: Customer
}

export interface Customer {
    document: string
    email: string
}

export interface Sku {
    id: number
    product_id: number
    sku: string
    price: number
    unit_price: number
    quantity: number
    length: number
    width: number
    height: number
    weight: number
    availability_days: number
    platform: Platform
}

export interface Platform {
    name: string
    external_id: number
}

export class ResponseIntegration {
    public quotes: Quote[];

    constructor() {
        this.quotes = []
    }
}

export class Quote {
    public name: string = "Tabela Fedex";
    public service: string = "FEDEX";
    public price: number = 0;
    public days: number = 0;
    public quote_id: string = "";
    public free_shipment: boolean = false;
}
