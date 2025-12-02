import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

export async function generateWorkOrderPDF(
    workOrder: WorkOrderData,
    parts?: WorkOrderPart[]
) {
    const doc = new jsPDF()

    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('ORDEN DE TRABAJO', 105, yPosition, { align: 'center' })

    yPosition += 10
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(`OT #${workOrder.id}`, 105, yPosition, { align: 'center' })

    // Status badge
    yPosition += 10
    const statusText = workOrder.status.toUpperCase()
    doc.setFontSize(10)
    doc.text(statusText, 105, yPosition, { align: 'center' })

    yPosition += 15

    // General Information Section
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMACIÓN GENERAL', 14, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const generalInfo = [
        ['Título', workOrder.title],
        ['Tipo', workOrder.type === 'preventive' ? 'Preventivo' : 'Correctivo'],
        ['Prioridad', workOrder.priority.toUpperCase()],
        ['Estado', statusText],
        ['Fecha Creación', new Date(workOrder.created_at).toLocaleString('es-ES')],
    ]

    if (workOrder.started_at) {
        generalInfo.push(['Fecha Inicio', new Date(workOrder.started_at).toLocaleString('es-ES')])
    }
    if (workOrder.completed_at) {
        generalInfo.push(['Fecha Finalización', new Date(workOrder.completed_at).toLocaleString('es-ES')])
    }
    if (workOrder.assigned_to) {
        generalInfo.push(['Asignado a', workOrder.assigned_to])
    }
    if (workOrder.operators?.full_name) {
        generalInfo.push(['Operador', workOrder.operators.full_name])
    }

    autoTable(doc, {
        startY: yPosition,
        body: generalInfo,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 130 }
        }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10

    // Asset Information
    if (workOrder.assets) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('ACTIVO', 14, yPosition)
        yPosition += 8

        const assetInfo = [
            ['Equipo', workOrder.assets.name],
            ['Ubicación', workOrder.assets.location || 'N/A'],
            ['Modelo', workOrder.assets.model || 'N/A'],
        ]

        autoTable(doc, {
            startY: yPosition,
            body: assetInfo,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 130 }
            }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Description
    if (workOrder.description) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('DESCRIPCIÓN DEL PROBLEMA', 14, yPosition)
        yPosition += 6

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const splitDescription = doc.splitTextToSize(workOrder.description, 180)
        doc.text(splitDescription, 14, yPosition)
        yPosition += (splitDescription.length * 5) + 10
    }

    // Solution Notes
    if (workOrder.solution_notes) {
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('SOLUCIÓN APLICADA', 14, yPosition)
        yPosition += 6

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const splitSolution = doc.splitTextToSize(workOrder.solution_notes, 180)
        doc.text(splitSolution, 14, yPosition)
        yPosition += (splitSolution.length * 5) + 10
    }

    // Parts Used
    if (parts && parts.length > 0) {
        if (yPosition > 230) {
            doc.addPage()
            yPosition = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('REPUESTOS UTILIZADOS', 14, yPosition)
        yPosition += 6

        const partsData = parts.map(part => [
            part.inventory_items?.name || 'N/A',
            part.inventory_items?.sku || 'N/A',
            `${part.quantity_used} ${part.inventory_items?.unit || ''}`,
            `$${part.unit_cost.toFixed(2)}`,
            `$${(part.quantity_used * part.unit_cost).toFixed(2)}`
        ])

        autoTable(doc, {
            startY: yPosition,
            head: [['Repuesto', 'SKU', 'Cantidad', 'Costo Unit.', 'Total']],
            body: partsData,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66], fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' }
            }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Metrics Section
    if (workOrder.downtime_hours || workOrder.labor_hours || workOrder.parts_cost || workOrder.labor_cost) {
        if (yPosition > 230) {
            doc.addPage()
            yPosition = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('MÉTRICAS Y COSTOS', 14, yPosition)
        yPosition += 6

        const metricsData = []

        if (workOrder.downtime_hours) {
            metricsData.push(['Tiempo de Inactividad', `${workOrder.downtime_hours} horas`])
        }
        if (workOrder.labor_hours) {
            metricsData.push(['Horas de Trabajo', `${workOrder.labor_hours} horas`])
        }
        if (workOrder.parts_cost) {
            metricsData.push(['Costo de Repuestos', `$${workOrder.parts_cost.toFixed(2)}`])
        }
        if (workOrder.labor_cost) {
            metricsData.push(['Costo de Mano de Obra', `$${workOrder.labor_cost.toFixed(2)}`])
        }
        if (workOrder.parts_cost && workOrder.labor_cost) {
            metricsData.push(['COSTO TOTAL', `$${(workOrder.parts_cost + workOrder.labor_cost).toFixed(2)}`])
        }

        autoTable(doc, {
            startY: yPosition,
            body: metricsData,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 70 },
                1: { cellWidth: 110, halign: 'right' }
            }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(128, 128, 128)
        doc.text(
            `Generado el ${new Date().toLocaleString('es-ES')}`,
            105,
            285,
            { align: 'center' }
        )
        doc.text(
            `Página ${i} de ${pageCount}`,
            105,
            290,
            { align: 'center' }
        )
    }

    // Save the PDF
    doc.save(`OT-${workOrder.id}-${new Date().toISOString().split('T')[0]}.pdf`)
}
