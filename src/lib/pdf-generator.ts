import jsPDF from 'jspdf'


interface WorkOrderData {
    id: number
    title: string
    description?: string
    type: 'preventive' | 'corrective'
    priority: string
    status: string
    created_at: string
    started_at?: string
    completed_at?: string
    downtime_hours?: number
    labor_hours?: number
    parts_cost?: number
    labor_cost?: number
    solution_notes?: string
    assets?: {
        name: string
        location?: string
        model?: string
        image_url?: string
    }
    operators?: {
        full_name: string
    }
    assigned_to?: string
}

interface WorkOrderPart {
    inventory_item_id: number
    quantity_used: number
    unit_cost: number
    notes?: string
    inventory_items?: {
        name: string
        sku: string
        unit: string
    }
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(img)
        img.onerror = reject
    })
}

export async function generateWorkOrderPDF(
    workOrder: WorkOrderData,
    parts?: WorkOrderPart[]
) {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    })

    // Load Logo
    let logoImg: HTMLImageElement | null = null
    try {
        logoImg = await loadImage('/lory-logo-full.png')
    } catch (e) {
        console.error('Error loading logo', e)
    }

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 10
    const topMargin = 20 // Perforations
    const contentWidth = pageWidth - (margin * 2)

    // --- 1. HEADER (Y=20 to 50, Height=30) ---
    const headerY = topMargin
    const headerH = 30

    // Main Box
    doc.setLineWidth(0.3)
    doc.rect(margin, headerY, contentWidth, headerH)

    // Vertical Dividers
    const col1W = 50
    const col2W = 90
    const col3W = contentWidth - col1W - col2W // 50

    doc.line(margin + col1W, headerY, margin + col1W, headerY + headerH)
    doc.line(margin + col1W + col2W, headerY, margin + col1W + col2W, headerY + headerH)

    // Left: Logo
    if (logoImg) {
        const imgRatio = logoImg.width / logoImg.height
        const maxH = 20
        const maxW = 40
        let w = maxW
        let h = w / imgRatio
        if (h > maxH) {
            h = maxH
            w = h * imgRatio
        }
        const x = margin + (col1W - w) / 2
        const y = headerY + (headerH - h) / 2
        doc.addImage(logoImg, 'PNG', x, y, w, h)
    } else {
        doc.setFontSize(10)
        doc.text('LORY', margin + col1W / 2, headerY + headerH / 2, { align: 'center' })
    }

    // Center: Info
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const centerX = margin + col1W + (col2W / 2)
    let centerY = headerY + 8
    doc.text('ANEXO 1-REG-HRR-SGC', centerX, centerY, { align: 'center' })
    centerY += 7
    doc.setFontSize(12)
    doc.text('Historial de Revisiones y Reparaciones', centerX, centerY, { align: 'center' })
    centerY += 7
    doc.setFontSize(9)
    doc.text('Sistema de Gestión de Calidad ISO 9001', centerX, centerY, { align: 'center' })

    // Right: Control Data
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const rightX = margin + col1W + col2W + 2
    let rightY = headerY + 8

    doc.text(`Página: 1/1`, rightX, rightY)
    rightY += 8
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, rightX, rightY)
    rightY += 8
    doc.text(`Versión: 02`, rightX, rightY)


    // --- 2. EQUIPMENT ROW (Y=50 to 60, Height=10) ---
    const row2Y = headerY + headerH
    const row2H = 10
    doc.rect(margin, row2Y, contentWidth, row2H)

    // Dividers
    // Celda 1 (Ancha): EQUIPO... | MES:
    // Celda 2 (Mediana): AÑO:
    // Celda 3 (Estrecha): ID

    // Let's split: 60% - 20% - 20%
    const r2c1W = contentWidth * 0.60
    const r2c2W = contentWidth * 0.20

    doc.line(margin + r2c1W, row2Y, margin + r2c1W, row2Y + row2H)
    doc.line(margin + r2c1W + r2c2W, row2Y, margin + r2c1W + r2c2W, row2Y + row2H)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')

    // Cell 1
    const assetName = workOrder.assets?.name || '________________'
    const currentMonth = new Date(workOrder.created_at).toLocaleString('es-ES', { month: 'long' }).toUpperCase()
    doc.text(`EQUIPO Y/O MAQUINA: ${assetName}`, margin + 2, row2Y + 4)
    doc.text(`MES: ${currentMonth}`, margin + 2, row2Y + 8.5)

    // Cell 2
    const currentYear = new Date().getFullYear()
    doc.text(`AÑO: ${currentYear}`, margin + r2c1W + 2, row2Y + 6)

    // Cell 3
    doc.text(`IDENTIFICACION:`, margin + r2c1W + r2c2W + 2, row2Y + 4)
    doc.setFont('helvetica', 'normal')
    doc.text(`${workOrder.assets?.model || 'N/A'}`, margin + r2c1W + r2c2W + 2, row2Y + 8)


    // --- 3. MAIN BODY (Table) ---
    const bodyY = row2Y + row2H
    const footerHeight = 35 // Approx space for footer (Signatures only)
    const bodyBottom = pageHeight - margin - footerHeight
    const bodyH = bodyBottom - bodyY

    doc.rect(margin, bodyY, contentWidth, bodyH)

    // Column Divider (80% / 20%)
    const bodyCol1W = contentWidth * 0.80
    doc.line(margin + bodyCol1W, bodyY, margin + bodyCol1W, bodyY + bodyH)

    // Header Row
    const bodyHeaderH = 8
    doc.line(margin, bodyY + bodyHeaderH, margin + contentWidth, bodyY + bodyHeaderH)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('DETALLE TAREA / REVISION', margin + (bodyCol1W / 2), bodyY + 5, { align: 'center' })
    doc.text('FECHA Y TIEMPO', margin + bodyCol1W + ((contentWidth - bodyCol1W) / 2), bodyY + 3.5, { align: 'center' })
    doc.text('DE LA TAREA', margin + bodyCol1W + ((contentWidth - bodyCol1W) / 2), bodyY + 7, { align: 'center' })

    // Content Lines
    const lineH = 7
    let currentY = bodyY + bodyHeaderH + lineH

    // Pre-fill with OT Data
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    const fullDescription = `[${workOrder.type.toUpperCase()}] ${workOrder.title}\n${workOrder.description || ''}\n${workOrder.solution_notes ? 'SOLUCIÓN: ' + workOrder.solution_notes : ''}`

    // Split text to fit column 1
    const textLines = doc.splitTextToSize(fullDescription, bodyCol1W - 4)

    let textIdx = 0

    while (currentY < bodyBottom) {
        doc.line(margin, currentY, margin + contentWidth, currentY)

        // Draw text if available
        if (textIdx < textLines.length) {
            doc.text(textLines[textIdx], margin + 2, currentY - 2)
            textIdx++

            // Draw date on first line only
            if (textIdx === 1) {
                const dateStr = new Date(workOrder.created_at).toLocaleDateString('es-ES')
                doc.text(dateStr, margin + bodyCol1W + 2, currentY - 2)
            }
        }

        currentY += lineH
    }


    // --- 4. FOOTER ---
    const footerY = bodyBottom

    // B. Signatures (Height 35)
    const sigY = footerY
    const sigH = 35
    doc.rect(margin, sigY, contentWidth, sigH)

    // Split Signatures
    const sigMid = contentWidth / 2
    doc.line(margin + sigMid, sigY, margin + sigMid, sigY + sigH)

    // Left: ELABORO
    let ly = sigY + 4
    doc.text('ELABORO', margin + 2, ly)

    ly += 8
    doc.setFont('helvetica', 'normal')
    doc.text('FIRMA: __________________________', margin + 5, ly)
    ly += 6
    doc.text(`ACLARACION: ${workOrder.operators?.full_name || '____________________'}`, margin + 5, ly)
    ly += 6
    doc.text('CARGO: __________________________', margin + 5, ly)
    ly += 6
    doc.text('FECHA: __________________________', margin + 5, ly)

    doc.setFont('helvetica', 'bold')
    // doc.text('OPERARIO', margin + (sigMid / 2), sigY + sigH - 2, { align: 'center' })

    // Right: APROBO
    let ry = sigY + 4
    doc.text('APROBO', margin + sigMid + 2, ry)

    ry += 8
    doc.setFont('helvetica', 'normal')
    doc.text('FIRMA: __________________________', margin + sigMid + 5, ry)
    ry += 6
    doc.text('ACLARACION: ____________________', margin + sigMid + 5, ry)
    ry += 6
    doc.text('CARGO: __________________________', margin + sigMid + 5, ry)
    ry += 6
    doc.text('FECHA: __________________________', margin + sigMid + 5, ry)

    doc.setFont('helvetica', 'bold')
    // doc.text('RESPONSABLE DE TALLER', margin + sigMid + (sigMid / 2), sigY + sigH - 2, { align: 'center' })

    // Save
    doc.save(`OT-${workOrder.id}.pdf`)
}
