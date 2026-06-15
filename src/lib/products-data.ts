
export type Product = {
    id: string;
    name: string;
    price: number;
    stock: number;
    description: string;
    location: string;
    imageUrl?: string;
    beneficiaryId: string;
    beneficiaryName: string;
    category?: string;
    deliveryCost?: number;
}
