export interface InventoryItem {
    id: number
    name: string
    sku: string
    category: 'repuesto' | 'consumible' | 'herramienta'
    quantity: number
    min_quantity: number
    unit: string
    location: string
    price: number
    last_updated: string
}

export const MOCK_INVENTORY: InventoryItem[] = [
    {
        id: 1,
        name: 'Rodamiento SKF 6204',
        sku: 'ROD-6204',
        category: 'repuesto',
        quantity: 15,
        min_quantity: 5,
        unit: 'unidades',
        location: 'Estantería A-1',
        price: 12.50,
        last_updated: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Aceite Hidráulico ISO 68',
        sku: 'LUB-ISO68',
        category: 'consumible',
        quantity: 40,
        min_quantity: 50, // Low stock
        unit: 'litros',
        location: 'Depósito de Aceites',
        price: 8.00,
        last_updated: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Filtro de Aire Compresor',
        sku: 'FIL-AIR-001',
        category: 'repuesto',
        quantity: 2,
        min_quantity: 3, // Low stock
        unit: 'unidades',
        location: 'Estantería B-2',
        price: 45.00,
        last_updated: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Electrodos 2.5mm',
        sku: 'SOL-ELE-25',
        category: 'consumible',
        quantity: 150,
        min_quantity: 20,
        unit: 'unidades',
        location: 'Pañol Soldadura',
        price: 0.50,
        last_updated: new Date().toISOString()
    },
    {
        id: 5,
        name: 'Llave Inglesa 12"',
        sku: 'HER-LLA-12',
        category: 'herramienta',
        quantity: 3,
        min_quantity: 2,
        unit: 'unidades',
        location: 'Tablero Principal',
        price: 25.00,
        last_updated: new Date().toISOString()
    },
    {
        id: 6,
        name: 'Correa Trapezoidal A-45',
        sku: 'COR-A45',
        category: 'repuesto',
        quantity: 0,
        min_quantity: 4, // Critical stock
        unit: 'unidades',
        location: 'Estantería C-1',
        price: 15.00,
        last_updated: new Date().toISOString()
    }
]
