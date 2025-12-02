import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Styles based on the user's image description
const styles = StyleSheet.create({
    page: {
        padding: 15,
        fontSize: 7,
        fontFamily: 'Helvetica',
        flexDirection: 'column',
    },
    // New Top Header Section
    topHeaderContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 5,
        height: 60,
    },
    headerLogoCol: {
        width: '20%',
        borderRightWidth: 1,
        borderRightColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    logo: {
        width: '80%',
        height: '80%',
        objectFit: 'contain',
    },
    headerTitleCol: {
        width: '60%',
        borderRightWidth: 1,
        borderRightColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    headerCode: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    headerSubtitle: {
        fontSize: 8,
        color: '#444',
    },
    headerMetaCol: {
        width: '20%',
        justifyContent: 'center',
        padding: 5,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 3,
    },
    metaText: {
        fontSize: 8,
        textAlign: 'right',
    },

    assetInfoContainer: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 5,
    },
    headerRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    headerCell: {
        padding: 3,
        borderRightWidth: 1,
        borderRightColor: '#000',
        justifyContent: 'center',
    },
    headerLabel: {
        fontSize: 6,
        color: '#666',
        marginBottom: 1,
    },
    headerValue: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    // Table Section
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#000',
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        height: 15, // Fixed height for consistency
    },
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        backgroundColor: '#f0f0f0', // Reverted to gray
        height: 35, // Keep increased height for vertical text
    },

    // Column Widths & Styles
    colElement: { width: '15%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, justifyContent: 'center' },
    colTask: { width: '25%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, justifyContent: 'center' },

    // Frequency Columns
    colFreqGroup: { width: '15%', flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#000' },
    colFreq: { width: '16.66%', borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center', alignItems: 'center' },
    colFreqLast: { width: '16.66%', justifyContent: 'center', alignItems: 'center' },

    // Calendar Columns
    colWeekGroup: { width: '9%', flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#000' }, // 5 weeks * 9% = 45%
    colDay: { width: '20%', borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center', alignItems: 'center' }, // 5 days per week
    colDayLast: { width: '20%', justifyContent: 'center', alignItems: 'center' },

    // Text Styles
    textSmall: { fontSize: 5, textAlign: 'center' },
    textNormal: { fontSize: 6 },
    textBold: { fontSize: 6, fontWeight: 'bold' },

    // Footer Section
    footerContainer: {
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#000',
        flexDirection: 'column',
    },
    observations: {
        height: 60,
        padding: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    signaturesRow: {
        flexDirection: 'row',
        height: 50,
    },
    signatureBlock: {
        width: '50%',
        borderRightWidth: 1,
        borderRightColor: '#000',
        padding: 2,
    },
    signatureLabel: {
        fontSize: 6,
        marginBottom: 20, // Space for signature
        textAlign: 'center',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        marginHorizontal: 10,
        marginTop: 5,
    },
    signatureDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        marginTop: 2,
    },
});

const FREQUENCIES = ['Diaria', 'Semanal', 'Mensual', 'Trimestral', 'Semestral', 'Anual'];
const WEEKS = [1, 2, 3, 4, 5];
const DAYS = ['L', 'M', 'M', 'J', 'V'];

interface Task {
    id: number;
    component: string;
    task: string;
    frequency: string;
}

interface Asset {
    id: number;
    name: string;
    model: string;
    location: string;
}

interface MaintenancePlanPDFProps {
    asset: Asset;
    tasks: Task[];
    month?: number;
    year?: number;
    workingDays?: number;
}

export const MaintenancePlanPDF = ({ asset, tasks, month, year, workingDays }: MaintenancePlanPDFProps) => {
    const monthName = month ? new Date(2024, month - 1).toLocaleString('es-ES', { month: 'long' }) : '_______';
    const yearStr = year || new Date().getFullYear();

    // Helper to check if frequency matches
    const isFreqMatch = (taskFreq: string, colFreq: string) => {
        if (!taskFreq || !colFreq) return false;

        const tf = taskFreq.toLowerCase().trim();
        const cf = colFreq.toLowerCase().trim();

        // Direct match
        if (tf === cf) return true;

        // Handle 'diario' vs 'diaria'
        if (tf.startsWith('diari') && cf.startsWith('diari')) return true;

        // Handle standard matches ignoring case
        return tf === cf;
    };

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>

                {/* 1. New Top Header */}
                <View style={styles.topHeaderContainer}>
                    {/* Left: Logo */}
                    <View style={styles.headerLogoCol}>
                        {/* Assuming logo is available at this path. React-pdf needs absolute path or url. 
                            In browser, window.location.origin + '/lory-logo.png' might work, 
                            but for safety in this environment, I'll try relative or just the filename if it resolves public. 
                            Actually, for client-side generation, it usually fetches. */}
                        <Image src="/lory-logo.png" style={styles.logo} />
                    </View>

                    {/* Center: Info */}
                    <View style={styles.headerTitleCol}>
                        <Text style={styles.headerCode}>REG-HRR-SGC</Text>
                        <Text style={styles.headerTitle}>Historial de Revisiones y Reparaciones</Text>
                        <Text style={styles.headerSubtitle}>Sistema de Gestión de Calidad ISO 9001</Text>
                    </View>

                    {/* Right: Metadata */}
                    <View style={styles.headerMetaCol}>
                        <Text style={styles.metaText}>Página: 1/1</Text>
                        <Text style={styles.metaText}>Fecha: 01/07/2024</Text>
                        <Text style={styles.metaText}>Versión: 03</Text>
                    </View>
                </View>

                {/* 2. Existing Asset Info Header (Moved Down) */}
                <View style={styles.assetInfoContainer}>
                    <View style={styles.headerRow}>
                        <View style={[styles.headerCell, { width: '10%' }]}>
                            <Text style={styles.headerLabel}>ID:</Text>
                            <Text style={styles.headerValue}>{asset.id}</Text>
                        </View>
                        <View style={[styles.headerCell, { width: '40%' }]}>
                            <Text style={styles.headerLabel}>EQUIPO Y/O MAQUINA:</Text>
                            <Text style={styles.headerValue}>{asset.name}</Text>
                        </View>
                        <View style={[styles.headerCell, { width: '30%' }]}>
                            <Text style={styles.headerLabel}>IDENTIFICACION:</Text>
                            <Text style={styles.headerValue}>{asset.model}</Text>
                        </View>
                        <View style={[styles.headerCell, { width: '20%', borderRightWidth: 0 }]}>
                            <Text style={styles.headerLabel}>INSTRUCTIVO DE MANTENIMIENTO Nº:</Text>
                            <Text style={styles.headerValue}>1</Text>
                        </View>
                    </View>
                    <View style={[styles.headerRow, { borderBottomWidth: 0 }]}>
                        <View style={[styles.headerCell, { width: '40%' }]}>
                            <Text style={styles.headerLabel}>OPERARIO A CARGO:</Text>
                            <Text style={styles.headerValue}>__________________________</Text>
                        </View>
                        <View style={[styles.headerCell, { width: '20%' }]}>
                            <Text style={styles.headerLabel}>MES:</Text>
                            <Text style={styles.headerValue}>{monthName.toUpperCase()}</Text>
                        </View>
                        <View style={[styles.headerCell, { width: '20%' }]}>
                            <Text style={styles.headerLabel}>AÑO:</Text>
                            <Text style={styles.headerValue}>{yearStr}</Text>
                        </View>
                        <View style={[styles.headerCell, { width: '20%', borderRightWidth: 0 }]}>
                            <Text style={styles.headerLabel}>DÍAS LABORALES:</Text>
                            <Text style={styles.headerValue}>{workingDays || 22}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Main Table */}
                <View style={styles.table}>
                    {/* Header Row 1: Titles */}
                    <View style={[styles.tableHeaderRow, { height: 20 }]}>
                        <View style={styles.colElement}><Text style={styles.textBold}></Text></View>
                        <View style={styles.colTask}><Text style={styles.textBold}></Text></View>
                        <View style={styles.colFreqGroup}>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={styles.textBold}>Plan mantenimiento</Text>
                            </View>
                        </View>
                        {WEEKS.map((w, i) => (
                            <View key={w} style={[styles.colWeekGroup, i === 4 ? { borderRightWidth: 0 } : {}]}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={styles.textBold}>Semana {w}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Header Row 2: Sub-columns */}
                    <View style={styles.tableHeaderRow}>
                        <View style={styles.colElement}><Text style={styles.textBold}>ELEMENTO</Text></View>
                        <View style={styles.colTask}><Text style={styles.textBold}>TAREA / REVISION</Text></View>

                        {/* Frequency Headers */}
                        <View style={styles.colFreqGroup}>
                            {FREQUENCIES.map((f, i) => (
                                <View key={f} style={i === FREQUENCIES.length - 1 ? styles.colFreqLast : styles.colFreq}>
                                    <Text style={[styles.textSmall, { transform: 'rotate(-90deg)', width: 50, textAlign: 'center' }]}>
                                        {f}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Calendar Days Headers */}
                        {WEEKS.map((w, i) => (
                            <View key={w} style={[styles.colWeekGroup, i === 4 ? { borderRightWidth: 0 } : {}]}>
                                {DAYS.map((d, j) => (
                                    <View key={j} style={j === 4 ? styles.colDayLast : styles.colDay}>
                                        <Text style={styles.textSmall}>{d}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* Data Rows */}
                    {tasks.map((task, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={styles.colElement}>
                                <Text style={styles.textNormal}>{task.component}</Text>
                            </View>
                            <View style={styles.colTask}>
                                <Text style={styles.textNormal}>{task.task}</Text>
                            </View>

                            {/* Frequency Cells */}
                            <View style={styles.colFreqGroup}>
                                {FREQUENCIES.map((f, i) => (
                                    <View
                                        key={f}
                                        style={[
                                            i === FREQUENCIES.length - 1 ? styles.colFreqLast : styles.colFreq,
                                            { backgroundColor: isFreqMatch(task.frequency, f) ? '#a3c2fa' : 'transparent' } // Reverted to Blue shading
                                        ]}
                                    />
                                ))}
                            </View>

                            {/* Calendar Cells (Empty grids) */}
                            {WEEKS.map((w, i) => (
                                <View key={w} style={[styles.colWeekGroup, i === 4 ? { borderRightWidth: 0 } : {}]}>
                                    {DAYS.map((d, j) => (
                                        <View key={j} style={j === 4 ? styles.colDayLast : styles.colDay}>
                                            {/* Empty for manual marking */}
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                {/* 3. Footer */}
                <View style={styles.footerContainer}>
                    <View style={styles.observations}>
                        <Text style={[styles.textBold, { fontSize: 8 }]}>OBSERVACIONES:</Text>
                        <Text style={[styles.textSmall, { marginTop: 30, color: '#666', fontSize: 7 }]}>
                            Se completará un anexo al registro solamente en casos que sea necesario y según criterio del Responsable de Taller
                        </Text>
                    </View>
                    <View style={[styles.signaturesRow, { height: 100 }]}>
                        <View style={styles.signatureBlock}>
                            <Text style={[styles.textBold, { textAlign: 'center', fontSize: 9, marginBottom: 5 }]}>ELABORÓ</Text>
                            <View style={{ marginTop: 40 }} /> {/* Space for signature */}
                            <View style={[styles.signatureDetails, { marginTop: 8 }]}>
                                <Text style={{ fontSize: 7 }}>FIRMA:</Text>
                                <Text style={{ fontSize: 7 }}>_________________</Text>
                            </View>
                            <View style={[styles.signatureDetails, { marginTop: 8 }]}>
                                <Text style={{ fontSize: 7 }}>ACLARACION:</Text>
                                <Text style={{ fontSize: 7 }}>_________________</Text>
                            </View>
                            <View style={[styles.signatureDetails, { marginTop: 8 }]}>
                                <Text style={{ fontSize: 7 }}>FECHA:</Text>
                                <Text style={{ fontSize: 7 }}>___/___/___</Text>
                            </View>
                        </View>
                        <View style={[styles.signatureBlock, { borderRightWidth: 0 }]}>
                            <Text style={[styles.textBold, { textAlign: 'center', fontSize: 9, marginBottom: 5 }]}>APROBÓ</Text>
                            <View style={{ marginTop: 40 }} /> {/* Space for signature */}
                            <View style={[styles.signatureDetails, { marginTop: 8 }]}>
                                <Text style={{ fontSize: 7 }}>FIRMA:</Text>
                                <Text style={{ fontSize: 7 }}>_________________</Text>
                            </View>
                            <View style={[styles.signatureDetails, { marginTop: 8 }]}>
                                <Text style={{ fontSize: 7 }}>ACLARACION:</Text>
                                <Text style={{ fontSize: 7 }}>_________________</Text>
                            </View>
                            <View style={[styles.signatureDetails, { marginTop: 8 }]}>
                                <Text style={{ fontSize: 7 }}>FECHA:</Text>
                                <Text style={{ fontSize: 7 }}>___/___/___</Text>
                            </View>
                        </View>
                    </View>
                </View>

            </Page>
        </Document>
    );
};
