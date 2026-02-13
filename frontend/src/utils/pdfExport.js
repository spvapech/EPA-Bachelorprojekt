import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Professioneller PDF-Export für Dashboard Analytics
 * 
 * Verwendet einen hybriden Ansatz:
 * 1. html2canvas für den gesamten Container (erfasst Chart + Legende + HTML-Elemente)
 * 2. SVG-Serialisierung als Fallback falls html2canvas fehlschlägt
 * 
 * Optimiert für Datenpräsentation und Geschäftsberichte.
 */

// ─── Farb-Palette (konsistent im ganzen Dokument) ───────────────────────────
const COLORS = {
    primary:     [37,  99, 235],   // blue-600
    primaryDark: [30,  64, 175],   // blue-800
    primaryLight:[219, 234, 254],  // blue-100
    accent:      [14, 165, 233],   // sky-500
    dark:        [15,  23,  42],   // slate-900
    darkAlt:     [30,  41,  59],   // slate-800
    text:        [51,  65,  85],   // slate-700
    textMuted:   [100, 116, 139],  // slate-500
    textLight:   [148, 163, 184],  // slate-400
    border:      [226, 232, 240],  // slate-200
    bgLight:     [248, 250, 252],  // slate-50
    white:       [255, 255, 255],
    green:       [22, 163,  74],   // green-600
    greenLight:  [220, 252, 231],  // green-100
    red:         [220,  38,  38],  // red-600
    redLight:    [254, 226, 226],  // red-100
    orange:      [234, 88,  12],   // orange-600
    orangeLight: [255, 237, 213],  // orange-100
    yellow:      [202, 138,  4],   // yellow-600
    yellowLight: [254, 249, 195],  // yellow-100
};

// ─── Layout-Konstanten (A4: 210 x 297 mm) ──────────────────────────────────
const PAGE = {
    width: 210,
    height: 297,
    marginLeft: 18,
    marginRight: 18,
    marginTop: 20,
    marginBottom: 25,
    get contentWidth() { return this.width - this.marginLeft - this.marginRight; },
    get contentRight() { return this.width - this.marginRight; },
};

// ─── Helper: SVG aus Recharts-Container extrahieren und als PNG rendern ─────
// Wird als Fallback verwendet wenn html2canvas fehlschlägt
const svgToPngDataUrl = (svgElement, targetWidth = 1200) => {
    return new Promise((resolve, reject) => {
        try {
            if (!svgElement) {
                reject(new Error('Kein SVG-Element gefunden'));
                return;
            }

            // SVG klonen damit wir es modifizieren können
            const clone = svgElement.cloneNode(true);

            // Sicherstellen dass width/height gesetzt sind
            const bbox = svgElement.getBoundingClientRect();
            const svgWidth = bbox.width || svgElement.clientWidth || 600;
            const svgHeight = bbox.height || svgElement.clientHeight || 300;

            clone.setAttribute('width', svgWidth);
            clone.setAttribute('height', svgHeight);
            clone.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

            // Computed styles inline setzen für alle Elemente
            const applyComputedStyles = (original, cloned) => {
                try {
                    const computed = window.getComputedStyle(original);
                    const importantProps = [
                        'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
                        'stroke-linecap', 'stroke-linejoin', 'opacity',
                        'font-size', 'font-family', 'font-weight', 'text-anchor',
                        'dominant-baseline', 'visibility', 'display'
                    ];
                    importantProps.forEach(prop => {
                        const val = computed.getPropertyValue(prop);
                        if (val && val !== '' && val !== 'none' && !val.includes('oklch')) {
                            cloned.style.setProperty(prop, val);
                        }
                    });

                    // oklch-Farben ersetzen
                    ['fill', 'stroke', 'color'].forEach(prop => {
                        const val = computed.getPropertyValue(prop);
                        if (val && val.includes('oklch')) {
                            cloned.style.setProperty(prop, '#64748b');
                        }
                    });
                } catch (e) { /* skip */ }

                const origChildren = original.children;
                const cloneChildren = cloned.children;
                for (let i = 0; i < origChildren.length && i < cloneChildren.length; i++) {
                    applyComputedStyles(origChildren[i], cloneChildren[i]);
                }
            };

            applyComputedStyles(svgElement, clone);

            // Namespace sicherstellen
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

            // SVG zu String serialisieren
            const serializer = new XMLSerializer();
            let svgString = serializer.serializeToString(clone);

            // oklch-Farben in der serialisierten SVG nochmal bereinigen
            svgString = svgString.replace(/oklch\([^)]*\)/gi, '#64748b');

            // SVG als Blob -> Image -> Canvas -> PNG
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            const scale = targetWidth / svgWidth;
            const canvasWidth = Math.round(svgWidth * scale);
            const canvasHeight = Math.round(svgHeight * scale);

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                    URL.revokeObjectURL(url);

                    const dataUrl = canvas.toDataURL('image/png', 1.0);
                    resolve({
                        dataUrl,
                        width: svgWidth,
                        height: svgHeight,
                        canvasWidth,
                        canvasHeight,
                    });
                } catch (e) {
                    URL.revokeObjectURL(url);
                    reject(e);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('SVG konnte nicht als Bild geladen werden'));
            };

            img.src = url;
        } catch (e) {
            reject(e);
        }
    });
};

// ─── Helper: oklch-Farben im geklonten DOM rekursiv bereinigen ──────────────
const sanitizeOklchColors = (element, sourceDoc) => {
    try {
        const computed = sourceDoc.defaultView
            ? sourceDoc.defaultView.getComputedStyle(element)
            : window.getComputedStyle(element);

        const colorProps = [
            'color', 'backgroundColor', 'borderColor',
            'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
            'fill', 'stroke', 'outlineColor', 'textDecorationColor'
        ];

        colorProps.forEach(prop => {
            try {
                const val = computed.getPropertyValue(prop);
                if (val && val.includes('oklch')) {
                    element.style.setProperty(prop, 'transparent', 'important');
                }
            } catch (e) { /* skip */ }
        });

        // Inline-Styles bereinigen
        if (element.style?.cssText) {
            element.style.cssText = element.style.cssText
                .replace(/oklch\([^)]*\)/gi, 'transparent');
        }
    } catch (e) { /* skip */ }

    Array.from(element.children || []).forEach(child => sanitizeOklchColors(child, sourceDoc));
};

// ─── Helper: html2canvas-basierte Chart-Extraktion (erfasst Chart + Legende) ─
const extractChartViaHtml2Canvas = async (containerElement, targetWidth = 1400) => {
    if (!containerElement) return null;

    const width = containerElement.offsetWidth || containerElement.scrollWidth || 600;
    const height = containerElement.offsetHeight || containerElement.scrollHeight || 300;

    console.log(`html2canvas: Container-Größe ${width}x${height}`);

    const canvas = await html2canvas(containerElement, {
        scale: Math.max(2, targetWidth / width), // Mindestens 2x Auflösung
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 20000,
        removeContainer: false,
        width: width,
        height: height,
        windowWidth: containerElement.scrollWidth,
        windowHeight: containerElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
            // Finde das geklonte Element
            const clonedEl = containerElement.id
                ? clonedDoc.getElementById(containerElement.id)
                : clonedDoc.body;

            if (clonedEl) {
                // Element vollständig sichtbar machen
                clonedEl.style.visibility = 'visible';
                clonedEl.style.display = 'block';
                clonedEl.style.opacity = '1';
                clonedEl.style.overflow = 'visible';

                // oklch-Farben rekursiv bereinigen
                sanitizeOklchColors(clonedEl, clonedDoc);
            }

            // Stylesheets NICHT entfernen – stattdessen nur oklch-Werte
            // in <style>-Tags und Stylesheet-Regeln neutralisieren.
            // So bleiben Flexbox-Layouts (Recharts-Legend) intakt.
            Array.from(clonedDoc.getElementsByTagName('style')).forEach(style => {
                if (style.textContent?.includes('oklch')) {
                    style.textContent = style.textContent.replace(/oklch\([^)]*\)/gi, 'transparent');
                }
            });

            // Stylesheet-Regeln in <link>-Stylesheets inline bereinigen
            // statt sie komplett zu entfernen
            Array.from(clonedDoc.styleSheets).forEach(sheet => {
                try {
                    const rules = sheet.cssRules || sheet.rules;
                    if (!rules) return;
                    for (let i = 0; i < rules.length; i++) {
                        const rule = rules[i];
                        if (rule.cssText?.includes('oklch')) {
                            try {
                                const cleaned = rule.cssText.replace(/oklch\([^)]*\)/gi, 'transparent');
                                sheet.deleteRule(i);
                                sheet.insertRule(cleaned, i);
                            } catch (e) { /* skip CORS-restricted rules */ }
                        }
                    }
                } catch (e) {
                    // CORS-Fehler bei externen Stylesheets – diese entfernen
                    if (sheet.ownerNode) {
                        sheet.ownerNode.remove();
                    }
                }
            });
        }
    });

    console.log(`html2canvas: Canvas erstellt ${canvas.width}x${canvas.height}`);

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    return {
        dataUrl,
        width: width,
        height: height,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
    };
};

// ─── Helper: Chart-Bild extrahieren (Hybrid: html2canvas → SVG-Fallback) ───
const extractChartImage = async (containerElement, targetWidth = 1400) => {
    if (!containerElement) return null;

    // Methode 1: html2canvas für gesamten Container (erfasst Chart + Legende)
    try {
        console.log('🎯 Versuche html2canvas für gesamten Container...');
        const result = await extractChartViaHtml2Canvas(containerElement, targetWidth);
        if (result?.dataUrl && result.dataUrl.length > 1000) {
            console.log('✅ html2canvas erfolgreich');
            return result;
        }
        console.warn('⚠️ html2canvas lieferte leeres/kleines Bild, versuche SVG-Fallback...');
    } catch (e) {
        console.warn('⚠️ html2canvas fehlgeschlagen, versuche SVG-Fallback:', e.message);
    }

    // Methode 2: SVG-Serialisierung als Fallback (nur Chart, ohne Legende)
    try {
        console.log('🔄 SVG-Fallback...');
        const svg = containerElement.querySelector('svg.recharts-surface')
            || containerElement.querySelector('svg');
        if (svg) {
            const result = await svgToPngDataUrl(svg, targetWidth);
            console.log('✅ SVG-Fallback erfolgreich');
            return result;
        }
    } catch (e) {
        console.error('❌ SVG-Fallback fehlgeschlagen:', e.message);
    }

    return null;
};

// ─── Helper: Fußzeile auf jeder Seite ───────────────────────────────────────
const addFooter = (doc, pageNum, totalPages, companyName) => {
    const y = PAGE.height - 12;

    // Trennlinie
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(PAGE.marginLeft, y - 4, PAGE.contentRight, y - 4);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');

    // Links: Firmenname
    doc.setTextColor(...COLORS.textLight);
    doc.text(`${companyName} \u2013 Analytics Report`, PAGE.marginLeft, y);

    // Mitte: Datum
    const dateStr = new Date().toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    doc.text(dateStr, PAGE.width / 2, y, { align: 'center' });

    // Rechts: Seitenzahl
    doc.text(`${pageNum} / ${totalPages}`, PAGE.contentRight, y, { align: 'right' });
};

// ─── Helper: Abschnittstitel ────────────────────────────────────────────────
const addSectionTitle = (doc, title, yPos, subtitle = null) => {
    // Akzentlinie links
    doc.setFillColor(...COLORS.primary);
    doc.rect(PAGE.marginLeft, yPos - 5, 3, subtitle ? 16 : 10, 'F');

    // Titel
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(title, PAGE.marginLeft + 8, yPos);

    let nextY = yPos + 6;

    if (subtitle) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textMuted);
        doc.text(subtitle, PAGE.marginLeft + 8, nextY);
        nextY += 6;
    }

    return nextY + 4;
};

// ─── Helper: KPI-Karte zeichnen ─────────────────────────────────────────────
const drawKPICard = (doc, x, y, width, height, { label, value, valueColor, badge = null, badgeColor = null }) => {
    // Karten-Hintergrund
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, width, height, 3, 3, 'FD');

    // Oberer Akzentstreifen
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(x, y, width, 3, 3, 3, 'F');
    doc.setFillColor(...COLORS.white);
    doc.rect(x, y + 2, width, 2, 'F');

    // Label
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(label.toUpperCase(), x + width / 2, y + 10, { align: 'center' });

    // Wert
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(valueColor || COLORS.dark));

    // Automatischer Textumbruch für lange Werte
    const maxW = width - 6;
    doc.setFontSize(15);
    let lines = doc.splitTextToSize(String(value), maxW);
    if (lines.length > 2) {
        doc.setFontSize(9);
        lines = doc.splitTextToSize(String(value), maxW);
    } else if (lines.length > 1) {
        doc.setFontSize(10);
        lines = doc.splitTextToSize(String(value), maxW);
    }

    const lineH = lines.length > 1 ? 4.5 : 0;
    const baseY = y + height / 2 + (badge ? 2 : 4);
    lines.forEach((line, i) => {
        doc.text(line, x + width / 2, baseY + (i * lineH) - ((lines.length - 1) * lineH / 2), { align: 'center' });
    });

    // Badge (z.B. Score bei Most Critical)
    if (badge) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(badgeColor || COLORS.textMuted));
        doc.text(String(badge), x + width / 2, y + height - 5, { align: 'center' });
    }
};

// ─── Helper: Filter-Info-Box ────────────────────────────────────────────────
const drawFilterBox = (doc, yPos, filters, statsEntries = []) => {
    const boxX = PAGE.marginLeft;
    const boxW = PAGE.contentWidth;
    const lineH = 5.5;

    // Filter-Einträge aufbauen
    const filterEntries = [];
    if (filters.metric) filterEntries.push(['Metrik', filters.metric]);
    if (filters.source) {
        const sourceLabel = filters.source === 'employee' ? 'Mitarbeiter' : filters.source === 'candidates' ? 'Bewerber' : filters.source;
        filterEntries.push(['Quelle', sourceLabel]);
    }
    if (filters.granularity) {
        const granLabel = filters.granularity === 'overall' ? 'Gesamter Zeitraum' : filters.granularity === 'year' ? 'Jahresansicht' : filters.granularity;
        filterEntries.push(['Zeitraum', granLabel]);
    }
    if (filters.granularity === 'year' && filters.selectedYear) {
        filterEntries.push(['Jahr', String(filters.selectedYear)]);
    }

    const maxLines = Math.max(filterEntries.length, statsEntries.length);
    const boxH = 10 + maxLines * lineH + 4;

    // Box zeichnen
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, yPos, boxW, boxH, 2, 2, 'FD');

    // Linke Spalte: Filter
    let leftY = yPos + 6;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('FILTER', boxX + 6, leftY);
    leftY += lineH + 1;

    filterEntries.forEach(([label, value]) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.text);
        doc.text(`${label}:`, boxX + 8, leftY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textMuted);
        doc.text(value, boxX + 32, leftY);
        leftY += lineH;
    });

    // Rechte Spalte: Statistiken
    if (statsEntries.length > 0) {
        // Vertikale Trennlinie
        const midX = boxX + boxW / 2;
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.2);
        doc.line(midX, yPos + 4, midX, yPos + boxH - 4);

        let rightY = yPos + 6;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.primary);
        doc.text('STATISTIKEN', midX + 6, rightY);
        rightY += lineH + 1;

        statsEntries.forEach(([label, value, color]) => {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.text);
            doc.text(`${label}:`, midX + 8, rightY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...(color || COLORS.textMuted));
            doc.text(String(value), midX + 38, rightY);
            rightY += lineH;
        });
    }

    return yPos + boxH + 6;
};

// ─── Helper: Chart-Bild einfügen mit maximaler Platznutzung ────────────────
const addChartImage = (doc, imgResult, yPos, maxAvailableHeight = null) => {
    if (!imgResult || !imgResult.dataUrl) return yPos;

    const availableWidth = PAGE.contentWidth;
    const availableHeight = maxAvailableHeight || (PAGE.height - PAGE.marginBottom - 10 - yPos);

    // Skalierung berechnen – so groß wie möglich
    const aspectRatio = imgResult.width / imgResult.height;
    let imgW = availableWidth;
    let imgH = imgW / aspectRatio;

    if (imgH > availableHeight) {
        imgH = availableHeight;
        imgW = imgH * aspectRatio;
    }

    // Zentriert platzieren
    const xPos = PAGE.marginLeft + (availableWidth - imgW) / 2;

    doc.addImage(imgResult.dataUrl, 'PNG', xPos, yPos, imgW, imgH);

    return yPos + imgH + 4;
};


// ═══════════════════════════════════════════════════════════════════════════════
// ─── HAUPT-EXPORT-FUNKTION ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const exportKPIsAsPDF = async (kpiData) => {
    const {
        companyName = 'Unbekannte Firma',
        avgScore = '-',
        trend = null,
        mostCritical = null,
        negativeTopic = '-',
        timelineChartElement = null,
        timelineFilters = null,
        topicRatingChartElement = null,
        topicRatingFilters = null,
        topicOverviewData = null,
    } = kpiData;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let currentPage = 1;

    // ─── Chart-Bilder vorab rendern (sequentiell für html2canvas-Stabilität) ──
    console.log('\ud83d\udcf8 Extrahiere Charts...');
    
    let timelineImg = null;
    let topicRatingImg = null;
    
    try {
        timelineImg = await extractChartImage(timelineChartElement);
    } catch (e) {
        console.warn('Timeline-Chart Extraktion fehlgeschlagen:', e);
    }
    
    try {
        topicRatingImg = await extractChartImage(topicRatingChartElement);
    } catch (e) {
        console.warn('Topic-Rating-Chart Extraktion fehlgeschlagen:', e);
    }
    
    console.log('\u2705 Charts extrahiert:', { timeline: !!timelineImg, topicRating: !!topicRatingImg });

    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 1: TITELSEITE
    // ═════════════════════════════════════════════════════════════════════════

    // Dunkler Header-Bereich (obere 42% der Seite)
    const headerH = 125;
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, PAGE.width, headerH, 'F');

    // Subtiler Gradient-Effekt
    doc.setFillColor(...COLORS.darkAlt);
    doc.rect(0, headerH - 25, PAGE.width, 25, 'F');

    // Akzentlinie oben
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE.width, 2.5, 'F');

    // Kleines Logo-Icon (abstrakt: Balken-Diagramm)
    const logoX = PAGE.width / 2;
    const logoY = 38;
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(logoX - 14, logoY, 5, 18, 1, 1, 'F');
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(logoX - 6, logoY - 6, 5, 24, 1, 1, 'F');
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(logoX + 2, logoY - 3, 5, 21, 1, 1, 'F');
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(logoX + 10, logoY + 4, 5, 14, 1, 1, 'F');

    // Haupttitel
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text('Analytics Report', PAGE.width / 2, 82, { align: 'center' });

    // Firmenname
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.primaryLight);
    doc.text(companyName, PAGE.width / 2, 95, { align: 'center' });

    // Dekorative Linie
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(PAGE.width / 2 - 30, 102, PAGE.width / 2 + 30, 102);

    // Datum
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text(`${dateStr}, ${timeStr} Uhr`, PAGE.width / 2, 113, { align: 'center' });

    // ─── Executive Summary Box ──────────────────────────────────────────
    const sumY = headerH + 15;
    const sumW = PAGE.contentWidth;
    const sumH = 68;
    const sumX = PAGE.marginLeft;

    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.4);
    doc.roundedRect(sumX, sumY, sumW, sumH, 4, 4, 'FD');

    // Linker Akzentstreifen
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(sumX, sumY, 3, sumH, 4, 4, 'F');
    doc.setFillColor(...COLORS.white);
    doc.rect(sumX + 2, sumY, 3, sumH, 'F');

    // Summary-Titel
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Executive Summary', sumX + 12, sumY + 11);

    // Trennlinie unter Titel
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(sumX + 12, sumY + 14, sumX + sumW - 10, sumY + 14);

    // Summary-Inhalte als 2x2-Grid
    const gridX1 = sumX + 14;
    const gridX2 = sumX + sumW / 2 + 5;
    let gridY = sumY + 22;
    const gridLineH = 12;

    // Gesamtbewertung
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textMuted);
    doc.text('GESAMTBEWERTUNG', gridX1, gridY);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const scoreColor = avgScore > 3 ? COLORS.green : avgScore >= 2 ? COLORS.dark : COLORS.red;
    doc.setTextColor(...scoreColor);
    doc.text(avgScore !== '-' ? `${avgScore} / 5.0` : '\u2013', gridX1, gridY + 8);

    // Trend
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textMuted);
    doc.text('ENTWICKLUNG', gridX2, gridY);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    if (trend?.avgDelta) {
        const tv = parseFloat(trend.avgDelta);
        const tColor = tv > 0.05 ? COLORS.green : tv < -0.05 ? COLORS.red : COLORS.textMuted;
        doc.setTextColor(...tColor);
        doc.text(`${tv > 0 ? '+' : ''}${trend.avgDelta}`, gridX2, gridY + 8);
    } else {
        doc.setTextColor(...COLORS.textLight);
        doc.text('\u2013', gridX2, gridY + 8);
    }

    gridY += gridLineH + 14;

    // Kritischer Bereich
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textMuted);
    doc.text('KRITISCHER BEREICH', gridX1, gridY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    if (mostCritical && mostCritical.topicName !== '-') {
        doc.setTextColor(...COLORS.red);
        const critName = mostCritical.topicName.length > 28 ? mostCritical.topicName.substring(0, 28) + '\u2026' : mostCritical.topicName;
        doc.text(critName, gridX1, gridY + 7);
    } else {
        doc.setTextColor(...COLORS.textLight);
        doc.text('\u2013', gridX1, gridY + 7);
    }

    // Verbesserungspotenzial
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textMuted);
    doc.text('VERBESSERUNGSPOTENZIAL', gridX2, gridY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    if (negativeTopic && negativeTopic !== '-') {
        doc.setTextColor(...COLORS.orange);
        const negText = negativeTopic.length > 28 ? negativeTopic.substring(0, 28) + '\u2026' : negativeTopic;
        doc.text(negText, gridX2, gridY + 7);
    } else {
        doc.setTextColor(...COLORS.textLight);
        doc.text('\u2013', gridX2, gridY + 7);
    }

    // ─── Inhaltsverzeichnis ─────────────────────────────────────────────
    const tocY = sumY + sumH + 18;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Inhalt', PAGE.marginLeft + 12, tocY);

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginLeft + 12, tocY + 2, PAGE.marginLeft + 80, tocY + 2);

    let tocItemY = tocY + 10;
    let pageCounter = 2;
    const tocItems = [];

    tocItems.push(['KPI-\u00dcbersicht & Timeline', pageCounter]);
    if (topicRatingImg) { pageCounter++; tocItems.push(['Topic-Bewertungen', pageCounter]); }
    if (topicOverviewData?.topics?.length) { pageCounter++; tocItems.push(['Topic-\u00dcbersicht (Tabelle)', pageCounter]); }

    tocItems.forEach(([title, page], idx) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        doc.text(`${idx + 1}.`, PAGE.marginLeft + 14, tocItemY);
        doc.text(title, PAGE.marginLeft + 22, tocItemY);

        // Gepunktete Linie
        doc.setDrawColor(...COLORS.textLight);
        doc.setLineWidth(0.15);
        doc.setLineDashPattern([0.5, 1.5], 0);
        const textW = doc.getTextWidth(title);
        doc.line(PAGE.marginLeft + 24 + textW, tocItemY - 0.5, PAGE.contentRight - 16, tocItemY - 0.5);
        doc.setLineDashPattern([], 0);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.primary);
        doc.text(String(page), PAGE.contentRight - 10, tocItemY, { align: 'right' });

        tocItemY += 7;
    });


    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 2: KPI-ÜBERSICHT + TIMELINE
    // ═════════════════════════════════════════════════════════════════════════
    doc.addPage();
    currentPage++;

    // Seitenhintergrund
    doc.setFillColor(...COLORS.bgLight);
    doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

    let y = addSectionTitle(doc, 'KPI-\u00dcbersicht', PAGE.marginTop + 5, 'Zentrale Kennzahlen des Unternehmens auf einen Blick');

    // 4 KPI-Karten in einer Reihe (volle Breite nutzen)
    const cardGap = 5;
    const cardCount = 4;
    const cardW = (PAGE.contentWidth - (cardCount - 1) * cardGap) / cardCount;
    const cardH = 38;
    const cardStartX = PAGE.marginLeft;

    // Ø Score
    const scoreVal = avgScore !== '-' ? String(avgScore) : '\u2013';
    const sColor = avgScore > 3 ? COLORS.green : avgScore >= 2 ? COLORS.dark : avgScore !== '-' ? COLORS.red : COLORS.textLight;
    drawKPICard(doc, cardStartX, y, cardW, cardH, {
        label: '\u00d8 Score', value: scoreVal, valueColor: sColor,
    });

    // Trend
    let trendVal = '\u2013';
    let tColor = COLORS.textLight;
    if (trend?.avgDelta) {
        const tv = parseFloat(trend.avgDelta);
        trendVal = `${tv > 0 ? '+' : ''}${trend.avgDelta}`;
        tColor = tv > 0.05 ? COLORS.green : tv < -0.05 ? COLORS.red : COLORS.textMuted;
    }
    drawKPICard(doc, cardStartX + cardW + cardGap, y, cardW, cardH, {
        label: 'Trend', value: trendVal, valueColor: tColor,
    });

    // Most Critical
    const critVal = (mostCritical && mostCritical.topicName !== '-') ? mostCritical.topicName : '\u2013';
    const critBadge = (mostCritical && mostCritical.score) ? String(mostCritical.score) : null;
    drawKPICard(doc, cardStartX + 2 * (cardW + cardGap), y, cardW, cardH, {
        label: 'Most Critical', value: critVal, valueColor: COLORS.red, badge: critBadge, badgeColor: COLORS.red,
    });

    // Negative Topic
    const negVal = (negativeTopic && negativeTopic !== '-') ? negativeTopic : '\u2013';
    drawKPICard(doc, cardStartX + 3 * (cardW + cardGap), y, cardW, cardH, {
        label: 'Neg. Topic', value: negVal, valueColor: COLORS.orange,
    });

    y += cardH + 10;

    // ─── Timeline-Chart direkt auf der KPI-Seite ────────────────────────
    if (timelineImg) {
        y = addSectionTitle(doc, 'Timeline-Analyse', y, 'Entwicklung der Bewertungen \u00fcber die Zeit');

        // Filter-Box
        if (timelineFilters) {
            const statsEntries = [];
            if (timelineFilters.stats?.dataPoints) {
                statsEntries.push(['Datenpunkte', String(timelineFilters.stats.dataPoints)]);
            }
            if (timelineFilters.stats?.avgHistorical) {
                statsEntries.push(['\u00d8 Historisch', String(timelineFilters.stats.avgHistorical), COLORS.primary]);
            }
            if (timelineFilters.stats?.avgCount) {
                statsEntries.push(['\u00d8 Anzahl', String(timelineFilters.stats.avgCount)]);
            }
            if (timelineFilters.stats?.avgTrend) {
                const at = parseFloat(timelineFilters.stats.avgTrend || 0);
                statsEntries.push(['\u00d8 Trend', (at >= 0 ? '+' : '') + timelineFilters.stats.avgTrend, at >= 0 ? COLORS.green : COLORS.red]);
            }
            y = drawFilterBox(doc, y, timelineFilters, statsEntries);
        }

        // Chart einfügen – gesamten verbleibenden Platz nutzen
        const maxChartH = PAGE.height - PAGE.marginBottom - 10 - y;
        y = addChartImage(doc, timelineImg, y, maxChartH);
    }


    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 3: TOPIC-BEWERTUNGEN (falls vorhanden)
    // ═════════════════════════════════════════════════════════════════════════
    if (topicRatingImg) {
        doc.addPage();
        currentPage++;

        doc.setFillColor(...COLORS.bgLight);
        doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

        let y2 = addSectionTitle(doc, 'Topic-Bewertungen', PAGE.marginTop + 5,
            'Durchschnittliche Bewertung der verschiedenen Themenbereiche');

        // Filter-Box
        if (topicRatingFilters) {
            const statsEntries = [];
            if (topicRatingFilters.stats?.dataPoints) {
                statsEntries.push(['Datenpunkte', String(topicRatingFilters.stats.dataPoints)]);
            }
            if (topicRatingFilters.stats?.topicsCount) {
                statsEntries.push(['Topics', String(topicRatingFilters.stats.topicsCount)]);
            }
            y2 = drawFilterBox(doc, y2, topicRatingFilters, statsEntries);
        }

        // Chart einfügen – gesamten Platz nutzen
        const maxH2 = PAGE.height - PAGE.marginBottom - 10 - y2;
        addChartImage(doc, topicRatingImg, y2, maxH2);
    }


    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 4+: TOPIC-ÜBERSICHT (Tabelle)
    // ═════════════════════════════════════════════════════════════════════════
    if (topicOverviewData?.topics?.length > 0) {
        doc.addPage();
        currentPage++;

        doc.setFillColor(...COLORS.bgLight);
        doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

        let yT = addSectionTitle(doc, 'Topic-\u00dcbersicht', PAGE.marginTop + 5,
            'Detaillierte Aufstellung aller identifizierten Themenbereiche');

        // Datenquellen-Info
        const sourceL = topicOverviewData.sourceFilter === 'employee' ? 'Mitarbeiter'
            : topicOverviewData.sourceFilter === 'candidates' ? 'Bewerber' : 'Alle';
        const statsInfo = topicOverviewData.stats;

        doc.setFillColor(...COLORS.white);
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(PAGE.marginLeft, yT, PAGE.contentWidth, 14, 2, 2, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.textMuted);
        doc.text('Datenquelle:', PAGE.marginLeft + 5, yT + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(sourceL, PAGE.marginLeft + 30, yT + 5);

        if (statsInfo) {
            doc.setFont('helvetica', 'bold');
            doc.text('Topics:', PAGE.marginLeft + 65, yT + 5);
            doc.setFont('helvetica', 'normal');
            doc.text(String(statsInfo.totalTopics || '\u2013'), PAGE.marginLeft + 82, yT + 5);

            doc.setFont('helvetica', 'bold');
            doc.text('\u00d8 Rating:', PAGE.marginLeft + 100, yT + 5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...COLORS.primary);
            doc.text(String(statsInfo.avgRating || '\u2013'), PAGE.marginLeft + 120, yT + 5);
            doc.setTextColor(...COLORS.textMuted);

            if (statsInfo.totalMentions) {
                doc.setFont('helvetica', 'bold');
                doc.text('Erw\u00e4hnungen:', PAGE.marginLeft + 135, yT + 5);
                doc.setFont('helvetica', 'normal');
                doc.text(String(statsInfo.totalMentions), PAGE.marginLeft + 160, yT + 5);
            }
        }

        // Zweite Zeile
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textLight);
        doc.text(`${topicOverviewData.topics.length} Themen identifiziert`, PAGE.marginLeft + 5, yT + 11);

        yT += 20;

        // ─── Tabelle ────────────────────────────────────────────────────
        const cols = [
            { key: 'topic',     label: 'Thema',         x: PAGE.marginLeft + 2,  w: 60 },
            { key: 'sentiment', label: 'Sentiment',      x: PAGE.marginLeft + 64, w: 30 },
            { key: 'rating',    label: 'Bewertung',      x: PAGE.marginLeft + 96, w: 22 },
            { key: 'frequency', label: 'Anzahl',         x: PAGE.marginLeft + 120,w: 20 },
            { key: 'quality',   label: 'Datenqualit\u00e4t', x: PAGE.marginLeft + 142,w: 32 },
        ];
        const rowH = 7.5;

        // Tabellen-Header zeichnen
        const drawTableHeader = (atY) => {
            doc.setFillColor(...COLORS.dark);
            doc.roundedRect(PAGE.marginLeft, atY - 4.5, PAGE.contentWidth, rowH + 1, 1.5, 1.5, 'F');

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.white);
            cols.forEach(c => doc.text(c.label, c.x, atY));

            return atY + rowH + 2;
        };

        yT = drawTableHeader(yT);

        // Tabellen-Zeilen
        const topics = topicOverviewData.topics;
        topics.forEach((topic, idx) => {
            // Neue Seite wenn nötig
            if (yT > PAGE.height - PAGE.marginBottom - 10) {
                doc.addPage();
                currentPage++;
                doc.setFillColor(...COLORS.bgLight);
                doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
                yT = PAGE.marginTop;
                yT = drawTableHeader(yT);
            }

            // Zeilen-Hintergrund
            if (idx % 2 === 0) {
                doc.setFillColor(...COLORS.white);
            } else {
                doc.setFillColor(241, 245, 249); // slate-100
            }
            doc.rect(PAGE.marginLeft, yT - 4.5, PAGE.contentWidth, rowH, 'F');

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');

            // Topic-Name
            doc.setTextColor(...COLORS.text);
            const tName = topic.topic.length > 35 ? topic.topic.substring(0, 35) + '\u2026' : topic.topic;
            doc.setFont('helvetica', 'bold');
            doc.text(tName, cols[0].x, yT);

            // Sentiment mit farbigem Punkt
            doc.setFont('helvetica', 'normal');
            const rawSentiment = String(topic.sentiment || 'Neutral').replace(/[^\w\s\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df-]/g, '').trim();
            let sentColor = COLORS.textMuted;
            let sentDotColor = COLORS.textMuted;
            if (rawSentiment === 'Positiv') { sentColor = COLORS.green; sentDotColor = COLORS.green; }
            else if (rawSentiment === 'Negativ') { sentColor = COLORS.red; sentDotColor = COLORS.red; }

            doc.setFillColor(...sentDotColor);
            doc.circle(cols[1].x + 1, yT - 1.5, 1.2, 'F');
            doc.setTextColor(...sentColor);
            doc.text(rawSentiment || 'Neutral', cols[1].x + 4, yT);

            // Rating mit Farbe
            const rating = topic.avgRating ? topic.avgRating.toFixed(1) : '\u2013';
            let ratingColor = COLORS.text;
            if (topic.avgRating >= 4) ratingColor = COLORS.green;
            else if (topic.avgRating && topic.avgRating < 3) ratingColor = COLORS.red;
            doc.setTextColor(...ratingColor);
            doc.setFont('helvetica', 'bold');
            doc.text(rating, cols[2].x, yT);

            // Anzahl
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...COLORS.text);
            doc.text(String(topic.frequency || 0), cols[3].x, yT);

            // Datenqualität
            const riskLevel = topic.statistical_meta?.risk_level;
            let qualText = '\u2013';
            let qualColor = COLORS.textLight;
            let qualBg = null;
            switch (riskLevel) {
                case 'limited':     qualText = 'Begrenzt';       qualColor = COLORS.red;    qualBg = COLORS.redLight;    break;
                case 'constrained': qualText = 'Eingeschr\u00e4nkt';  qualColor = COLORS.orange; qualBg = COLORS.orangeLight; break;
                case 'acceptable':  qualText = 'Akzeptabel';     qualColor = COLORS.yellow; qualBg = COLORS.yellowLight; break;
                case 'solid':       qualText = 'Solide';         qualColor = COLORS.green;  qualBg = COLORS.greenLight;  break;
            }

            // Badge-Hintergrund für Qualität
            if (qualBg) {
                const badgeW = doc.getTextWidth(qualText) + 4;
                doc.setFillColor(...qualBg);
                doc.roundedRect(cols[4].x - 1, yT - 3.5, badgeW, 5, 1, 1, 'F');
            }
            doc.setTextColor(...qualColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text(qualText, cols[4].x, yT);

            yT += rowH;
        });

        // Tabellen-Abschluss-Linie
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.3);
        doc.line(PAGE.marginLeft, yT - 3, PAGE.contentRight, yT - 3);
    }


    // ═════════════════════════════════════════════════════════════════════════
    // FUSSZEILEN auf allen Seiten (außer Titelseite)
    // ═════════════════════════════════════════════════════════════════════════
    const totalPages = doc.internal.pages.length - 1;

    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages, companyName);
    }

    // ─── PDF speichern ──────────────────────────────────────────────────
    const fileName = `Analytics_Report_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    console.log(`\u2705 PDF gespeichert: ${fileName} (${totalPages} Seiten)`);
};


// ═══════════════════════════════════════════════════════════════════════════════
// ─── FIRMENVERGLEICH PDF-EXPORT ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const COMPARE_COLORS_DEFAULT = [
    [59, 130, 246],   // blue-500
    [245, 158, 11],   // amber-500
    [16, 185, 129],   // emerald-500
];

export const exportCompareAsPDF = async (compareData) => {
    const {
        companies = [],       // [{ name, id, score, trend, mostCritical, negativeTopic, categoryRatings }]
        radarChartElement = null,
        barChartElement = null,
        timelineChartElement = null,
        categoryData = [],    // [{ category, ...companyValues }]
        companyColors = null,  // Optional: [hex strings] - custom colors per company
    } = compareData;

    // Use custom colors or fall back to defaults
    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };
    const COMPARE_COLORS = companyColors
        ? companyColors.map(hex => hexToRgb(hex))
        : COMPARE_COLORS_DEFAULT;

    const companyNames = companies.map(c => c.name || 'Unbekannt');
    const titleLabel = companyNames.join(' vs. ');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let currentPage = 1;

    // ─── Chart-Bilder vorab extrahieren (sequentiell) ────────────────────
    console.log('📸 Extrahiere Vergleichs-Charts...');

    let radarImg = null;
    let barImg = null;
    let timelineImg = null;

    try { radarImg = await extractChartImage(radarChartElement); }
    catch (e) { console.warn('Radar-Chart Extraktion fehlgeschlagen:', e); }

    try { barImg = await extractChartImage(barChartElement); }
    catch (e) { console.warn('Bar-Chart Extraktion fehlgeschlagen:', e); }

    try { timelineImg = await extractChartImage(timelineChartElement); }
    catch (e) { console.warn('Timeline-Chart Extraktion fehlgeschlagen:', e); }

    console.log('✅ Charts extrahiert:', { radar: !!radarImg, bar: !!barImg, timeline: !!timelineImg });

    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 1: TITELSEITE
    // ═════════════════════════════════════════════════════════════════════════

    // Dunkler Header-Bereich
    const headerH = 125;
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, PAGE.width, headerH, 'F');
    doc.setFillColor(...COLORS.darkAlt);
    doc.rect(0, headerH - 25, PAGE.width, 25, 'F');

    // Akzentlinie oben
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE.width, 2.5, 'F');

    // Logo-Icon (Vergleichs-Pfeile)
    const logoX = PAGE.width / 2;
    const logoY = 38;
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(logoX - 16, logoY, 5, 18, 1, 1, 'F');
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(logoX - 8, logoY + 4, 5, 14, 1, 1, 'F');
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(logoX + 0, logoY + 8, 5, 10, 1, 1, 'F');
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(logoX + 8, logoY + 2, 5, 16, 1, 1, 'F');

    // Titel
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text('Firmenvergleich', PAGE.width / 2, 78, { align: 'center' });

    // Untertitel mit Firmennamen
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.accent);
    const subtitle = companyNames.length <= 3
        ? companyNames.join('  ·  ')
        : companyNames.slice(0, 3).join('  ·  ');
    doc.text(subtitle, PAGE.width / 2, 90, { align: 'center' });

    // Trennlinie
    doc.setDrawColor(255, 255, 255, 0.2);
    doc.setLineWidth(0.3);
    doc.line(PAGE.width / 2 - 40, 96, PAGE.width / 2 + 40, 96);

    // Datum
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    const dateStr = new Date().toLocaleDateString('de-DE', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.text(dateStr, PAGE.width / 2, 103, { align: 'center' });

    // Executive Summary Box
    const execY = headerH + 15;
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.4);
    doc.roundedRect(PAGE.marginLeft, execY, PAGE.contentWidth, 40, 3, 3, 'FD');

    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(PAGE.marginLeft, execY, PAGE.contentWidth, 3, 3, 3, 'F');
    doc.setFillColor(...COLORS.white);
    doc.rect(PAGE.marginLeft, execY + 2, PAGE.contentWidth, 2, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Zusammenfassung', PAGE.marginLeft + 8, execY + 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`Vergleich von ${companies.length} Unternehmen anhand von Bewertungen,`, PAGE.marginLeft + 8, execY + 20);
    doc.text('Kategorien, Trends und Themenbereichen.', PAGE.marginLeft + 8, execY + 26);

    // Firmen-Übersicht mit Farbcodierung
    let summaryY = execY + 35;
    doc.setFontSize(9);
    companies.forEach((comp, i) => {
        const col = COMPARE_COLORS[i] || COLORS.textMuted;
        doc.setFillColor(...col);
        doc.circle(PAGE.marginLeft + 12, summaryY + 7, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(comp.name || 'Unbekannt', PAGE.marginLeft + 18, summaryY + 8);
        summaryY += 8;
    });

    // Inhaltsverzeichnis
    let tocY = summaryY + 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Inhalt', PAGE.marginLeft, tocY);
    tocY += 8;

    const tocItems = [];
    let pageCounter = 1;
    pageCounter++; tocItems.push(['KPI-Vergleich', pageCounter]);
    if (radarImg || barImg) { pageCounter++; tocItems.push(['Kategorievergleich', pageCounter]); }
    if (timelineImg) { pageCounter++; tocItems.push(['Bewertungsverlauf', pageCounter]); }
    if (categoryData.length > 0) { pageCounter++; tocItems.push(['Detailvergleich', pageCounter]); }

    tocItems.forEach(([label, pg]) => {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        doc.text(label, PAGE.marginLeft + 4, tocY);
        doc.setTextColor(...COLORS.textLight);

        const dotX = PAGE.marginLeft + 4 + doc.getTextWidth(label) + 2;
        const pageX = PAGE.contentRight - 4;
        const dots = '.'.repeat(Math.max(1, Math.floor((pageX - dotX - 10) / 1.5)));
        doc.text(dots, dotX, tocY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.primary);
        doc.text(String(pg), pageX, tocY, { align: 'right' });
        tocY += 6;
    });

    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 2: KPI-VERGLEICH
    // ═════════════════════════════════════════════════════════════════════════
    doc.addPage();
    currentPage++;

    doc.setFillColor(...COLORS.bgLight);
    doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

    let y = addSectionTitle(doc, 'KPI-Vergleich', PAGE.marginTop + 5,
        'Gegenüberstellung der wichtigsten Kennzahlen');

    // Firmen-Legende
    companies.forEach((comp, i) => {
        const col = COMPARE_COLORS[i] || COLORS.textMuted;
        doc.setFillColor(...col);
        doc.circle(PAGE.marginLeft + 4 + i * 60, y, 2, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...col);
        const shortName = comp.name.length > 18 ? comp.name.substring(0, 18) + '…' : comp.name;
        doc.text(shortName, PAGE.marginLeft + 9 + i * 60, y + 0.5);
    });
    y += 10;

    // ─── KPI-Vergleichskarten (Ø Score, Trend, Most Critical, Neg. Topic) ─

    const drawCompareKPISection = (title, yPos, getValue) => {
        const boxW = PAGE.contentWidth;
        const rowH = 8;
        const boxH = 10 + companies.length * rowH + 4;

        doc.setFillColor(...COLORS.white);
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(PAGE.marginLeft, yPos, boxW, boxH, 2, 2, 'FD');

        // Titel
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(title, PAGE.marginLeft + 6, yPos + 7);

        // Zeilen pro Firma
        let rowY = yPos + 14;
        companies.forEach((comp, i) => {
            const col = COMPARE_COLORS[i] || COLORS.textMuted;
            const { value, valueColor } = getValue(comp, i);

            // Farbpunkt
            doc.setFillColor(...col);
            doc.circle(PAGE.marginLeft + 10, rowY - 1, 1.5, 'F');

            // Name
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...COLORS.text);
            const name = comp.name.length > 30 ? comp.name.substring(0, 30) + '…' : comp.name;
            doc.text(name, PAGE.marginLeft + 15, rowY);

            // Wert (rechts ausgerichtet)
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...(valueColor || COLORS.dark));
            doc.text(String(value), PAGE.contentRight - 6, rowY, { align: 'right' });

            rowY += rowH;
        });

        return yPos + boxH + 6;
    };

    // Ø Score
    y = drawCompareKPISection('Ø Score', y, (comp) => {
        const score = comp.score;
        const val = score != null ? String(score) : '–';
        const col = score > 3 ? COLORS.green : score >= 2 ? COLORS.dark : score != null ? COLORS.red : COLORS.textLight;
        return { value: val, valueColor: col };
    });

    // Trend
    y = drawCompareKPISection('Trend', y, (comp) => {
        if (!comp.trend) return { value: '–', valueColor: COLORS.textLight };
        const tv = parseFloat(comp.trend.avgDelta);
        const val = `${tv > 0 ? '+' : ''}${comp.trend.avgDelta}`;
        const col = tv > 0.05 ? COLORS.green : tv < -0.05 ? COLORS.red : COLORS.textMuted;
        return { value: val, valueColor: col };
    });

    // Most Critical
    y = drawCompareKPISection('Most Critical', y, (comp) => {
        if (!comp.mostCritical) return { value: '–', valueColor: COLORS.textLight };
        const val = `${comp.mostCritical.topicName} (${comp.mostCritical.score})`;
        return { value: val, valueColor: COLORS.red };
    });

    // Negative Topic
    y = drawCompareKPISection('Negative Topic', y, (comp) => {
        const nt = comp.negativeTopic;
        if (!nt) return { value: '–', valueColor: COLORS.textLight };
        const label = nt.topic_label || nt.topic_text || nt.topic || '–';
        const val = label.length > 30 ? label.substring(0, 30) + '…' : label;
        return { value: val, valueColor: COLORS.orange };
    });


    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 3: KATEGORIEVERGLEICH (Radar + Bar)
    // ═════════════════════════════════════════════════════════════════════════
    if (radarImg || barImg) {
        doc.addPage();
        currentPage++;

        doc.setFillColor(...COLORS.bgLight);
        doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

        let y3 = addSectionTitle(doc, 'Kategorievergleich', PAGE.marginTop + 5,
            'Bewertung der Firmen in den einzelnen Kategorien');

        if (radarImg) {
            // Radar-Chart Untertitel
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.text);
            doc.text('Radar-Ansicht', PAGE.marginLeft + 8, y3);
            y3 += 4;

            const maxRadarH = barImg ? 110 : (PAGE.height - PAGE.marginBottom - 10 - y3);
            y3 = addChartImage(doc, radarImg, y3, maxRadarH);
            y3 += 4;
        }

        if (barImg) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.text);
            doc.text('Balken-Ansicht', PAGE.marginLeft + 8, y3);
            y3 += 4;

            const maxBarH = PAGE.height - PAGE.marginBottom - 10 - y3;
            y3 = addChartImage(doc, barImg, y3, maxBarH);
        }
    }


    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 4: BEWERTUNGSVERLAUF
    // ═════════════════════════════════════════════════════════════════════════
    if (timelineImg) {
        doc.addPage();
        currentPage++;

        doc.setFillColor(...COLORS.bgLight);
        doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

        let y4 = addSectionTitle(doc, 'Bewertungsverlauf', PAGE.marginTop + 5,
            'Historische Entwicklung der Bewertungen im Vergleich');

        const maxTimelineH = PAGE.height - PAGE.marginBottom - 10 - y4;
        addChartImage(doc, timelineImg, y4, maxTimelineH);
    }


    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 5+: DETAILVERGLEICH TABELLE
    // ═════════════════════════════════════════════════════════════════════════
    if (categoryData.length > 0) {
        doc.addPage();
        currentPage++;

        doc.setFillColor(...COLORS.bgLight);
        doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

        let yT = addSectionTitle(doc, 'Detailvergleich', PAGE.marginTop + 5,
            'Bewertungen nach Kategorien mit Differenzanalyse');

        // Tabellen-Spalten berechnen
        const catColW = 55;
        const compColW = companies.length >= 3 ? 30 : 38;
        const diffColW = 25;
        const rowH = 7;

        // Tabellenkopf
        const drawTableHeader = (atY) => {
            doc.setFillColor(...COLORS.dark);
            doc.roundedRect(PAGE.marginLeft, atY - 5, PAGE.contentWidth, rowH + 3, 1, 1, 'F');
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.white);

            doc.text('Kategorie', PAGE.marginLeft + 4, atY);
            companies.forEach((comp, i) => {
                const x = PAGE.marginLeft + catColW + i * compColW;
                const name = comp.name.length > 12 ? comp.name.substring(0, 12) + '…' : comp.name;
                doc.text(name, x, atY, { align: 'left' });
            });
            doc.text('Diff.', PAGE.contentRight - 4, atY, { align: 'right' });

            return atY + rowH + 2;
        };

        yT = drawTableHeader(yT);

        // Zeilen
        categoryData.forEach((row, idx) => {
            if (yT > PAGE.height - PAGE.marginBottom - 10) {
                doc.addPage();
                currentPage++;
                doc.setFillColor(...COLORS.bgLight);
                doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
                yT = PAGE.marginTop;
                yT = drawTableHeader(yT);
            }

            // Zeilen-Hintergrund
            if (idx % 2 === 0) {
                doc.setFillColor(...COLORS.white);
            } else {
                doc.setFillColor(241, 245, 249);
            }
            doc.rect(PAGE.marginLeft, yT - 4.5, PAGE.contentWidth, rowH, 'F');

            // Kategorie-Name
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.text);
            const catName = row.category.length > 28 ? row.category.substring(0, 28) + '…' : row.category;
            doc.text(catName, PAGE.marginLeft + 4, yT);

            // Werte pro Firma
            const values = companies.map((comp) => {
                const val = row[comp.name];
                return val != null ? Number(val) : null;
            });
            const validValues = values.filter(v => v != null);
            const maxVal = validValues.length ? Math.max(...validValues) : null;
            const minVal = validValues.length ? Math.min(...validValues) : null;

            companies.forEach((comp, i) => {
                const x = PAGE.marginLeft + catColW + i * compColW;
                const val = values[i];

                if (val == null) {
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...COLORS.textLight);
                    doc.text('–', x, yT);
                } else {
                    const isBest = validValues.length >= 2 && val === maxVal;
                    const isWorst = validValues.length >= 2 && val === minVal && maxVal !== minVal;
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...(isBest ? COLORS.green : isWorst ? COLORS.red : COLORS.text));
                    doc.text(val.toFixed(2), x, yT);
                }
            });

            // Differenz
            if (validValues.length >= 2) {
                const diff = (maxVal - minVal).toFixed(2);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...COLORS.textMuted);
                doc.text(`±${diff}`, PAGE.contentRight - 4, yT, { align: 'right' });
            }

            yT += rowH;
        });

        // Tabellen-Abschluss-Linie
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.3);
        doc.line(PAGE.marginLeft, yT - 3, PAGE.contentRight, yT - 3);
    }


    // ═════════════════════════════════════════════════════════════════════════
    // FUSSZEILEN auf allen Seiten (außer Titelseite)
    // ═════════════════════════════════════════════════════════════════════════
    const totalPages = doc.internal.pages.length - 1;

    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages, titleLabel);
    }

    // ─── PDF speichern ──────────────────────────────────────────────────
    const fileName = `Firmenvergleich_${companyNames.map(n => n.replace(/\s+/g, '_')).join('_vs_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    console.log(`✅ Firmenvergleich PDF gespeichert: ${fileName} (${totalPages} Seiten)`);
};