'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createOperator(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        full_name: formData.get('full_name') as string,
        dni: formData.get('dni') as string,
        phone: formData.get('phone') as string,
        specialty: formData.get('specialty') as string,
    }

    const { error } = await supabase
        .from('operators')
        .insert(rawData)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/operators')
    return { success: true }
}

export async function updateOperator(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const rawData = {
        full_name: formData.get('full_name') as string,
        dni: formData.get('dni') as string,
        phone: formData.get('phone') as string,
        specialty: formData.get('specialty') as string,
        is_active: formData.get('is_active') === 'on'
    }

    const { error } = await supabase
        .from('operators')
        .update(rawData)
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/operators')
    return { success: true }
}

export async function deleteOperator(id: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('operators')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/operators')
    return { success: true }
}
