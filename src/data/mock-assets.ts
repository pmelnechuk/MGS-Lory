import { Database } from '@/types/supabase'

type Asset = Database['public']['Tables']['assets']['Row']

export const MOCK_ASSETS: Asset[] = [
    {
        id: 1,
        name: 'Compresor Principal',
        description: 'Alimenta toda la planta neumática. Parada total.',
        criticality: 3,
        status: 'operational',
        location: 'Sala Máq.',
        image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2070',
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Pantógrafo',
        description: 'Único equipo de corte de chapa. Sin reemplazo.',
        criticality: 3,
        status: 'operational',
        location: 'Planta Alta',
        image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=2069',
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Puente Grúa (Abajo)',
        description: 'Vital para montaje (>500kg). Reparación peligrosa.',
        criticality: 2,
        status: 'maintenance',
        location: 'Planta Baja',
        image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=2070',
        created_at: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Puente Grúa (Arriba)',
        description: 'Vital para movimiento general.',
        criticality: 2,
        status: 'operational',
        location: 'Planta Alta',
        image_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=2070',
        created_at: new Date().toISOString()
    },
    {
        id: 5,
        name: 'Torno CNC',
        description: 'Alta productividad. Depende de aire comprimido.',
        criticality: 1,
        status: 'operational',
        location: 'Mecanizado',
        image_url: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&q=80&w=1935',
        created_at: new Date().toISOString()
    },
    {
        id: 6,
        name: 'Compresor Tornillo',
        description: 'Estado: Fuera de Servicio/Para Reparar.',
        criticality: 0,
        status: 'broken',
        location: 'Sala Máq.',
        image_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=2070',
        created_at: new Date().toISOString()
    }
]
