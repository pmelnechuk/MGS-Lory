-- 1. Agregar columna snapshot
ALTER TABLE public.daily_maintenance_logs 
ADD COLUMN IF NOT EXISTS task_snapshot text;

-- 2. Permitir nulos en task_def_id y cambiar FK a SET NULL
ALTER TABLE public.daily_maintenance_logs 
ALTER COLUMN task_def_id DROP NOT NULL;

-- Intentar borrar la constraint por su nombre por defecto
ALTER TABLE public.daily_maintenance_logs 
DROP CONSTRAINT IF EXISTS daily_maintenance_logs_task_def_id_fkey;

-- Recrear la constraint con ON DELETE SET NULL
ALTER TABLE public.daily_maintenance_logs 
ADD CONSTRAINT daily_maintenance_logs_task_def_id_fkey 
FOREIGN KEY (task_def_id) 
REFERENCES public.maintenance_task_definitions(id) 
ON DELETE SET NULL;

-- 3. Backfill de datos existentes (Llenar snapshots vacíos)
UPDATE public.daily_maintenance_logs l
SET task_snapshot = t.task
FROM public.maintenance_task_definitions t
WHERE l.task_def_id = t.id
AND l.task_snapshot IS NULL;

-- 4. Trigger para Snapshot Automático
CREATE OR REPLACE FUNCTION public.tr_snapshot_task_details()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es un insert, o si se actualiza el task_def_id
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.task_def_id IS DISTINCT FROM OLD.task_def_id) THEN
        -- Solo buscar si hay un task_def_id válido y el snapshot no viene seteado manualmente (opcional)
        IF NEW.task_def_id IS NOT NULL THEN
            SELECT task INTO NEW.task_snapshot
            FROM public.maintenance_task_definitions
            WHERE id = NEW.task_def_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_snapshot_task_details ON public.daily_maintenance_logs;
CREATE TRIGGER tr_snapshot_task_details
BEFORE INSERT OR UPDATE OF task_def_id ON public.daily_maintenance_logs
FOR EACH ROW EXECUTE FUNCTION public.tr_snapshot_task_details();

-- 5. Trigger para Inmutabilidad (Bloqueo si la hoja está verificada)
CREATE OR REPLACE FUNCTION public.tr_check_sheet_locked()
RETURNS TRIGGER AS $$
DECLARE
    target_sheet_id bigint;
    sheet_status text;
    sheet_verified_by uuid;
BEGIN
    -- Determinar el sheet_id
    IF (TG_OP = 'DELETE') THEN
        target_sheet_id := OLD.sheet_id;
    ELSE
        target_sheet_id := NEW.sheet_id;
    END IF;

    -- Consultar estado de la hoja
    SELECT status, verified_by INTO sheet_status, sheet_verified_by
    FROM public.monthly_maintenance_sheets
    WHERE id = target_sheet_id;

    -- Verificar bloqueo
    IF sheet_status = 'verified' OR sheet_verified_by IS NOT NULL THEN
        RAISE EXCEPTION 'Operación denegada: La planilla mensual está cerrada y verificada.';
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_sheet_locked ON public.daily_maintenance_logs;
CREATE TRIGGER tr_check_sheet_locked
BEFORE INSERT OR UPDATE OR DELETE ON public.daily_maintenance_logs
FOR EACH ROW EXECUTE FUNCTION public.tr_check_sheet_locked();
