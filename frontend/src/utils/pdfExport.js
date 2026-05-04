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

// ─── Design-System Farb-Palette (deckt sich mit AGB-Analysis UI) ────────────
// Slate-Skala + tonale Akzente — gleich wie im Dashboard.
const COLORS = {
    // Slate (neutrale Skala)
    slate0:    [255, 255, 255],
    slate50:   [248, 250, 252],
    slate100:  [241, 245, 249],
    slate150:  [233, 238, 244],
    slate200:  [226, 232, 240],
    slate300:  [203, 213, 225],
    slate400:  [148, 163, 184],
    slate500:  [100, 116, 139],
    slate600:  [71, 85, 105],
    slate700:  [51, 65, 85],
    slate800:  [30, 41, 59],
    slate900:  [15, 23, 42],

    // Tonale Akzente (gleich wie KPI-Tile-Tones)
    emerald50:  [236, 253, 245],
    emerald500: [16, 185, 129],
    emerald600: [5, 150, 105],
    emerald700: [4, 120, 87],
    rose50:     [255, 241, 242],
    rose500:    [244, 63, 94],
    rose600:    [225, 29, 72],
    rose700:    [190, 18, 60],
    amber50:    [255, 251, 235],
    amber500:   [245, 158, 11],
    amber600:   [217, 119, 6],
    amber700:   [180, 83, 9],
    blue50:     [239, 246, 255],
    blue500:    [59, 130, 246],
    blue600:    [37, 99, 235],
    blue700:    [29, 78, 216],
    indigo500:  [99, 102, 241],
    indigo600:  [79, 70, 229],

    // Legacy aliases (rückwärtskompatibel mit altem Code)
    get primary()      { return this.indigo500; },
    get primaryDark()  { return this.indigo600; },
    get primaryLight() { return this.blue50; },
    get accent()       { return this.blue500; },
    get dark()         { return this.slate900; },
    get darkAlt()      { return this.slate800; },
    get text()         { return this.slate700; },
    get textMuted()    { return this.slate500; },
    get textLight()    { return this.slate400; },
    get border()       { return this.slate200; },
    get bgLight()      { return this.slate50; },
    get white()        { return this.slate0; },
    get green()        { return this.emerald600; },
    get greenLight()   { return this.emerald50; },
    get red()          { return this.rose600; },
    get redLight()     { return this.rose50; },
    get orange()       { return this.amber600; },
    get orangeLight()  { return this.amber50; },
    get yellow()       { return this.amber500; },
    get yellowLight()  { return this.amber50; },
};

// ─── Tonale Logik (gleich wie KPIGrid.jsx) ──────────────────────────────────
const scoreTone = (score) => {
    const n = Number(score);
    if (!Number.isFinite(n)) return 'neutral';
    if (n >= 3.5) return 'good';
    if (n >= 2.5) return 'warn';
    return 'bad';
};

const TONE_PALETTE = {
    good:    { accent: COLORS.emerald500, bg: COLORS.emerald50, text: COLORS.emerald700, value: COLORS.emerald600 },
    warn:    { accent: COLORS.amber500,   bg: COLORS.amber50,   text: COLORS.amber700,   value: COLORS.amber600 },
    bad:     { accent: COLORS.rose500,    bg: COLORS.rose50,    text: COLORS.rose700,    value: COLORS.rose600 },
    info:    { accent: COLORS.blue500,    bg: COLORS.blue50,    text: COLORS.blue700,    value: COLORS.blue600 },
    neutral: { accent: COLORS.slate300,   bg: COLORS.slate50,   text: COLORS.slate600,   value: COLORS.slate900 },
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

// ─── Helper: Abschnittstitel (mit optionalem Eyebrow) ──────────────────────
const addSectionTitle = (doc, title, yPos, subtitle = null, eyebrow = null) => {
    let curY = yPos;

    // Eyebrow (mono, uppercase, slate-500)
    if (eyebrow) {
        doc.setFontSize(7);
        doc.setFont('courier', 'bold');
        doc.setTextColor(...COLORS.slate500);
        doc.text(String(eyebrow).toUpperCase(), PAGE.marginLeft, curY);
        curY += 4;
    }

    // Titel — slate-900, semibold
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate900);
    doc.text(title, PAGE.marginLeft, curY + 1);

    let nextY = curY + 7;

    if (subtitle) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.slate500);
        doc.text(subtitle, PAGE.marginLeft, nextY);
        nextY += 4;
    }

    // Feine Trennlinie unter dem Titel
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginLeft, nextY + 1, PAGE.contentRight, nextY + 1);

    return nextY + 6;
};

// ─── Helper: KPI-Karte zeichnen — Adaptive Layout für PDF ─────────────────
// Layout (von oben nach unten):
//   ┌────────────────────────┐
//   │▎ Ø Score                │  ← Label (tonal, links)
//   │                          │
//   │  4,0                     │  ← Big Value (volle Breite)
//   │  ┌───┐                   │  ← Badge-Pill UNTER dem Wert (eigene Zeile)
//   │  │/5 │                   │
//   │  └───┘                   │
//   │                          │
//   │  alle Quellen            │  ← Footer
//   └────────────────────────┘
//
// • Kein "Details →" mehr (Print, nicht klickbar)
// • Badge unter Wert → kein Platz-Konflikt bei langen Topic-Namen
// • Step-Down-Schriftgröße + Hart-Kürzen für absolute Sicherheit
// tone: 'good' | 'warn' | 'bad' | 'neutral' | 'info'
const drawKPICard = (doc, x, y, width, height, {
    label, value, footer = null, badge = null, tone = 'neutral',
    valueColor, badgeColor,
}) => {
    const t = TONE_PALETTE[tone] ?? TONE_PALETTE.neutral;
    const innerX = x + 6;
    const innerR = x + width - 6;
    const innerW = innerR - innerX;

    // ── Karten-Hintergrund (subtiler tonaler Bg) ──
    doc.setFillColor(...t.bg);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, width, height, 3, 3, 'FD');

    // Tonaler Akzentbalken links
    doc.setFillColor(...t.accent);
    doc.rect(x, y, 2, height, 'F');

    // Helper: text → ggf. mit Ellipsis kürzen
    const fitText = (text, maxW) => {
        if (doc.getTextWidth(text) <= maxW) return text;
        let trunc = text;
        while (trunc.length > 1 && doc.getTextWidth(trunc + '\u2026') > maxW) {
            trunc = trunc.slice(0, -1);
        }
        return trunc + '\u2026';
    };

    // ── Label (oben, tonal) ──
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...t.text);
    doc.text(fitText(String(label), innerW), innerX, y + 7);

    // ── Big Value: nutzt volle Karten-Breite ──
    const rawValue = String(value);
    let valueFontSize = 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(valueFontSize);
    while (valueFontSize > 9 && doc.getTextWidth(rawValue) > innerW) {
        valueFontSize -= 1;
        doc.setFontSize(valueFontSize);
    }
    const displayValue = fitText(rawValue, innerW);

    const valueBaselineY = y + height * 0.42 + valueFontSize * 0.18;
    doc.setTextColor(...t.value);
    doc.text(displayValue, innerX, valueBaselineY);

    // ── Badge-Pill UNTER dem Wert (eigene Zeile) ──
    if (badge) {
        const badgeText = String(badge);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        const badgeDisplay = fitText(badgeText, innerW - 6);

        const padX = 3.5;
        const bW = doc.getTextWidth(badgeDisplay) + padX * 2;
        const bH = 5.4;
        const bX = innerX;
        const bY = valueBaselineY + 3;

        doc.setFillColor(...t.bg);
        doc.setDrawColor(...t.accent);
        doc.setLineWidth(0.3);
        doc.roundedRect(bX, bY, bW, bH, 2.7, 2.7, 'FD');

        doc.setTextColor(...t.text);
        doc.text(badgeDisplay, bX + bW / 2, bY + 3.8, { align: 'center' });
    }

    // ── Footer (klein, slate-500, am unteren Rand) ──
    if (footer) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.slate500);
        doc.text(fitText(String(footer), innerW), innerX, y + height - 5);
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

    // Linke Spalte: Filter (eyebrow in mono)
    let leftY = yPos + 6;
    doc.setFontSize(7);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...COLORS.slate500);
    doc.text('FILTER', boxX + 6, leftY);
    leftY += lineH + 1;

    filterEntries.forEach(([label, value]) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.slate500);
        doc.text(`${label}`, boxX + 8, leftY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.slate900);
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
        doc.setFontSize(7);
        doc.setFont('courier', 'bold');
        doc.setTextColor(...COLORS.slate500);
        doc.text('STATISTIKEN', midX + 6, rightY);
        rightY += lineH + 1;

        statsEntries.forEach(([label, value, color]) => {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...COLORS.slate500);
            doc.text(`${label}`, midX + 8, rightY);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...(color || COLORS.slate900));
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
    // SEITE 1: TITELSEITE — Dark Hero + Executive Summary (2×2)
    // ═════════════════════════════════════════════════════════════════════════

    // Dark Hero-Bereich (obere ~38% der Seite)
    const heroH = 110;
    doc.setFillColor(...COLORS.slate900);
    doc.rect(0, 0, PAGE.width, heroH, 'F');

    // Tonaler Akzentbalken oben (indigo)
    doc.setFillColor(...COLORS.indigo500);
    doc.rect(0, 0, PAGE.width, 3, 'F');

    // Brand-Mark (weißes Quadrat mit "A" — wie im Dashboard-Rail)
    const brandY = 22;
    const brandX = PAGE.width / 2;
    doc.setFillColor(...COLORS.slate0);
    doc.roundedRect(brandX - 9, brandY, 18, 18, 3, 3, 'F');
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate900);
    doc.text('A', brandX, brandY + 13, { align: 'center' });

    // Eyebrow (mono, hell)
    doc.setFontSize(8);
    doc.setFont('courier', 'bold');
    doc.setTextColor(150, 163, 184); // slate-400 hellaufgehellt für Dark-Bg
    doc.text('AGB-ANALYSIS · ANALYTICS REPORT', PAGE.width / 2, brandY + 28, { align: 'center' });

    // Haupttitel — Firmenname (groß, weiß)
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate0);
    let titleDisplay = String(companyName);
    while (titleDisplay.length > 1 && doc.getTextWidth(titleDisplay) > PAGE.contentWidth - 20) {
        titleDisplay = titleDisplay.slice(0, -1);
    }
    if (titleDisplay !== String(companyName)) titleDisplay = titleDisplay.slice(0, -1) + '\u2026';
    doc.text(titleDisplay, PAGE.width / 2, brandY + 47, { align: 'center' });

    // Subtitle — leicht heller blau-grau
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(190, 200, 220);
    doc.text('Übersicht aller Bewertungen, Topics und Trends', PAGE.width / 2, brandY + 56, { align: 'center' });

    // Dünne Trennlinie unter dem Titel
    doc.setDrawColor(...COLORS.indigo500);
    doc.setLineWidth(0.5);
    doc.line(PAGE.width / 2 - 18, brandY + 62, PAGE.width / 2 + 18, brandY + 62);

    // Datum (mono, hell)
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.setTextColor(150, 163, 184);
    doc.text(`${dateStr.toUpperCase()} · ${timeStr} UHR`, PAGE.width / 2, brandY + 70, { align: 'center' });

    // ─── Executive Summary — 4 horizontale Karten (gleich wie Dashboard) ──
    const exY = heroH + 14;

    // Eyebrow + Titel
    doc.setFontSize(7);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...COLORS.slate500);
    doc.text('EXECUTIVE SUMMARY', PAGE.marginLeft, exY);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate900);
    doc.text('Kennzahlen', PAGE.marginLeft, exY + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate500);
    doc.text('Karte anklicken öffnet Detailansicht', PAGE.contentRight, exY + 7, { align: 'right' });

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginLeft, exY + 10, PAGE.contentRight, exY + 10);

    // 4 horizontale Karten — größere Höhe (52mm) für lange Topic-Namen
    const exGridY = exY + 16;
    const exGap = 4;
    const exCardW = (PAGE.contentWidth - 3 * exGap) / 4;
    const exCardH = 52;

    // 1. Ø Score
    const _scoreNumT = avgScore !== '-' ? Number(avgScore) : NaN;
    drawKPICard(doc, PAGE.marginLeft, exGridY, exCardW, exCardH, {
        label: 'Ø Score', value: avgScore !== '-' ? String(avgScore).replace('.', ',') : '\u2013',
        badge: '/ 5', tone: Number.isFinite(_scoreNumT) ? scoreTone(_scoreNumT) : 'neutral',
        footer: 'alle Quellen',
    });

    // 2. Trend 12M
    let _tValT = '\u2013', _tToneT = 'neutral', _tFootT = 'vs. Vorjahr', _tBadgeT = null;
    if (trend?.avgDelta) {
        const tv = parseFloat(trend.avgDelta);
        _tValT = `${tv > 0 ? '+' : ''}${trend.avgDelta.replace('.', ',')}`;
        _tToneT = tv > 0.05 ? 'good' : tv < -0.05 ? 'bad' : 'neutral';
        _tBadgeT = tv > 0.05 ? 'steigend' : tv < -0.05 ? 'sinkend' : 'stabil';
    }
    drawKPICard(doc, PAGE.marginLeft + (exCardW + exGap), exGridY, exCardW, exCardH, {
        label: 'Trend 12M', value: _tValT, badge: _tBadgeT, tone: _tToneT, footer: _tFootT,
    });

    // 3. Most Critical
    const _critValT = mostCritical?.topicName && mostCritical.topicName !== '-'
        ? mostCritical.topicName : '\u2013';
    const _critBadgeT = mostCritical?.score ? `${String(mostCritical.score).replace('.', ',')} / 5` : null;
    const _critToneT = mostCritical
        ? (Number(mostCritical.score) >= 3.5 ? 'good' : Number(mostCritical.score) >= 2.5 ? 'warn' : 'bad')
        : 'neutral';
    drawKPICard(doc, PAGE.marginLeft + 2 * (exCardW + exGap), exGridY, exCardW, exCardH, {
        label: 'Most Critical', value: _critValT, badge: _critBadgeT, tone: _critToneT,
        footer: 'niedrigster Topic-Score',
    });

    // 4. Negative Topic
    const _negValT = (negativeTopic && negativeTopic !== '-') ? negativeTopic : '\u2013';
    drawKPICard(doc, PAGE.marginLeft + 3 * (exCardW + exGap), exGridY, exCardW, exCardH, {
        label: 'Negative Topic', value: _negValT,
        tone: (negativeTopic && negativeTopic !== '-') ? 'bad' : 'neutral',
        footer: 'höchste Negativrate',
    });

    // ─── Inhaltsverzeichnis (am unteren Rand) ──────────────────────────
    const tocY = exGridY + exCardH + 22;

    // Eyebrow
    doc.setFontSize(7);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...COLORS.slate500);
    doc.text('INHALT', PAGE.marginLeft, tocY);

    // Titel
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate900);
    doc.text('Auf den folgenden Seiten', PAGE.marginLeft, tocY + 7);

    // Trennlinie
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginLeft, tocY + 10, PAGE.contentRight, tocY + 10);

    let tocItemY = tocY + 18;
    let pageCounter = 2;
    const tocItems = [];

    tocItems.push(['KPI-Übersicht & Timeline', pageCounter]);
    if (topicRatingImg) { pageCounter++; tocItems.push(['Topic-Bewertungen', pageCounter]); }
    if (topicOverviewData?.topics?.length) { pageCounter++; tocItems.push(['Topic-Übersicht (Tabelle)', pageCounter]); }

    tocItems.forEach(([title, page], idx) => {
        // Index in mono
        doc.setFontSize(9);
        doc.setFont('courier', 'normal');
        doc.setTextColor(...COLORS.slate400);
        doc.text(String(idx + 1).padStart(2, '0'), PAGE.marginLeft, tocItemY);

        // Titel
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.slate800);
        doc.text(title, PAGE.marginLeft + 11, tocItemY);

        // Gepunktete Linie
        doc.setDrawColor(...COLORS.slate300);
        doc.setLineWidth(0.15);
        doc.setLineDashPattern([0.5, 1.5], 0);
        const textW = doc.getTextWidth(title);
        doc.line(PAGE.marginLeft + 13 + textW, tocItemY - 1, PAGE.contentRight - 14, tocItemY - 1);
        doc.setLineDashPattern([], 0);

        // Seitenzahl
        doc.setFont('courier', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.indigo600);
        doc.text(String(page).padStart(2, '0'), PAGE.contentRight, tocItemY, { align: 'right' });

        tocItemY += 9;
    });


    // ═════════════════════════════════════════════════════════════════════════
    // SEITE 2: KPI-ÜBERSICHT + TIMELINE
    // ═════════════════════════════════════════════════════════════════════════
    doc.addPage();
    currentPage++;

    // Seitenhintergrund
    doc.setFillColor(...COLORS.bgLight);
    doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

    let y = addSectionTitle(
        doc,
        'Kennzahlen',
        PAGE.marginTop + 5,
        'Score, Trend und kritische Themen auf einen Blick',
        'Übersicht'
    );

    // 4 KPI-Karten in einer Reihe — gleiche Höhe wie auf der Titelseite (52mm)
    const cardGap = 4;
    const cardCount = 4;
    const cardW = (PAGE.contentWidth - (cardCount - 1) * cardGap) / cardCount;
    const cardH = 52;
    const cardStartX = PAGE.marginLeft;

    // Ø Score — tonal nach Wert
    const scoreNum = avgScore !== '-' ? Number(avgScore) : NaN;
    const scoreVal = avgScore !== '-' ? String(avgScore).replace('.', ',') : '\u2013';
    const scoreCardTone = Number.isFinite(scoreNum) ? scoreTone(scoreNum) : 'neutral';
    drawKPICard(doc, cardStartX, y, cardW, cardH, {
        label: '\u00d8 Score', value: scoreVal, badge: '/ 5',
        tone: scoreCardTone, footer: 'alle Quellen',
    });

    // Trend
    let trendVal = '\u2013', trendCardTone = 'neutral', trendFooter = 'vs. Vorjahr', trendBadge = null;
    if (trend?.avgDelta) {
        const tv = parseFloat(trend.avgDelta);
        trendVal = `${tv > 0 ? '+' : ''}${trend.avgDelta.replace('.', ',')}`;
        trendCardTone = tv > 0.05 ? 'good' : tv < -0.05 ? 'bad' : 'neutral';
        trendBadge = tv > 0.05 ? 'steigend' : tv < -0.05 ? 'sinkend' : 'stabil';
    }
    drawKPICard(doc, cardStartX + cardW + cardGap, y, cardW, cardH, {
        label: 'Trend 12M', value: trendVal, badge: trendBadge,
        tone: trendCardTone, footer: trendFooter,
    });

    // Most Critical — Tone nach Score
    const critVal = (mostCritical && mostCritical.topicName !== '-') ? mostCritical.topicName : '\u2013';
    const critBadge = (mostCritical && mostCritical.score) ? `${String(mostCritical.score).replace('.', ',')} / 5` : null;
    const critCardTone = mostCritical
        ? (Number(mostCritical.score) >= 3.5 ? 'good' : Number(mostCritical.score) >= 2.5 ? 'warn' : 'bad')
        : 'neutral';
    drawKPICard(doc, cardStartX + 2 * (cardW + cardGap), y, cardW, cardH, {
        label: 'Most Critical', value: critVal, badge: critBadge,
        tone: critCardTone, footer: 'niedrigster Topic-Score',
    });

    // Negative Topic
    const negVal = (negativeTopic && negativeTopic !== '-') ? negativeTopic : '\u2013';
    drawKPICard(doc, cardStartX + 3 * (cardW + cardGap), y, cardW, cardH, {
        label: 'Negative Topic', value: negVal,
        tone: (negativeTopic && negativeTopic !== '-') ? 'bad' : 'neutral',
        footer: 'höchste Negativrate',
    });

    y += cardH + 10;

    // ─── Timeline-Chart direkt auf der KPI-Seite ────────────────────────
    if (timelineImg) {
        y = addSectionTitle(doc, 'Timeline', y, 'Historische Bewertungen + Prognose der nächsten Monate', 'Zeitreihe · Historie & Prognose');

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

        let y2 = addSectionTitle(doc, 'Topics im Detail', PAGE.marginTop + 5,
            'Durchschnittliche Bewertung pro Themen-Cluster über Zeit', 'Topic-Bewertungen');

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

        let yT = addSectionTitle(doc, 'Topic-Übersicht', PAGE.marginTop + 5,
            'Alle identifizierten Topics mit Sentiment, Rating und Datenqualität', 'Topic-Cluster · Tabelle');

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

        // Tabellen-Header zeichnen — Linear-style: helle Slate-Background, kleine mono uppercase
        const drawTableHeader = (atY) => {
            doc.setFillColor(...COLORS.slate50);
            doc.rect(PAGE.marginLeft, atY - 4.5, PAGE.contentWidth, rowH + 1, 'F');

            // Untere Trennlinie
            doc.setDrawColor(...COLORS.border);
            doc.setLineWidth(0.3);
            doc.line(PAGE.marginLeft, atY + rowH - 3.5, PAGE.contentRight, atY + rowH - 3.5);

            doc.setFontSize(7);
            doc.setFont('courier', 'bold');
            doc.setTextColor(...COLORS.slate500);
            cols.forEach(c => doc.text(String(c.label).toUpperCase(), c.x, atY));

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

            // Zeilen-Hintergrund \u2014 nur dezente Trennlinie, kein Zebra
            doc.setFillColor(...COLORS.white);
            doc.rect(PAGE.marginLeft, yT - 4.5, PAGE.contentWidth, rowH, 'F');
            doc.setDrawColor(...COLORS.slate100);
            doc.setLineWidth(0.15);
            doc.line(PAGE.marginLeft, yT + rowH - 4.5, PAGE.contentRight, yT + rowH - 4.5);

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');

            // Topic-Name
            doc.setTextColor(...COLORS.slate900);
            const tName = topic.topic.length > 35 ? topic.topic.substring(0, 35) + '\u2026' : topic.topic;
            doc.setFont('helvetica', 'bold');
            doc.text(tName, cols[0].x, yT);

            // Sentiment als tonales Pill-Badge (wie im Dashboard)
            doc.setFont('helvetica', 'bold');
            const rawSentiment = String(topic.sentiment || 'Neutral').replace(/[^\w\s\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df-]/g, '').trim();
            let sentBg = COLORS.slate100;
            let sentText = COLORS.slate600;
            let sentDot = COLORS.slate400;
            if (rawSentiment === 'Positiv') { sentBg = COLORS.emerald50; sentText = COLORS.emerald700; sentDot = COLORS.emerald500; }
            else if (rawSentiment === 'Negativ') { sentBg = COLORS.rose50; sentText = COLORS.rose700; sentDot = COLORS.rose500; }
            else if (rawSentiment === 'Gemischt') { sentBg = COLORS.amber50; sentText = COLORS.amber700; sentDot = COLORS.amber500; }

            const sentLabel = rawSentiment || 'Neutral';
            const sentBadgeW = doc.getTextWidth(sentLabel) + 8;
            doc.setFillColor(...sentBg);
            doc.roundedRect(cols[1].x - 1, yT - 3.5, sentBadgeW, 5, 2.5, 2.5, 'F');
            doc.setFillColor(...sentDot);
            doc.circle(cols[1].x + 2, yT - 1, 0.9, 'F');
            doc.setTextColor(...sentText);
            doc.setFontSize(7);
            doc.text(sentLabel, cols[1].x + 4.5, yT);
            doc.setFontSize(7.5);

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

            // Datenqualität — tonale Badge wie im Dashboard
            const riskLevel = topic.statistical_meta?.risk_level;
            let qualText = '\u2013';
            let qualText_color = COLORS.slate500;
            let qualBg = null;
            switch (riskLevel) {
                case 'limited':     qualText = 'Begrenzt';        qualText_color = COLORS.rose700;    qualBg = COLORS.rose50;    break;
                case 'constrained': qualText = 'Eingeschr\u00e4nkt';   qualText_color = COLORS.amber700;   qualBg = COLORS.amber50;   break;
                case 'acceptable':  qualText = 'Akzeptabel';      qualText_color = COLORS.amber700;   qualBg = COLORS.amber50;   break;
                case 'solid':       qualText = 'Solide';          qualText_color = COLORS.emerald700; qualBg = COLORS.emerald50; break;
            }

            // Badge-Hintergrund (pill, rounded-full)
            if (qualBg) {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                const badgeW = doc.getTextWidth(qualText) + 4.5;
                doc.setFillColor(...qualBg);
                doc.roundedRect(cols[4].x - 1, yT - 3.5, badgeW, 5, 2.5, 2.5, 'F');
            }
            doc.setTextColor(...qualText_color);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text(qualText, cols[4].x + 1.25, yT);

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
        summaryData = null,    // Summary insights from Compare.jsx
        categoryChartView = 'radar',  // 'radar' or 'bar' - which chart view is active
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

    // Nur das ausgewählte Category-Chart extrahieren
    if (categoryChartView === 'radar') {
        try { radarImg = await extractChartImage(radarChartElement); }
        catch (e) { console.warn('Radar-Chart Extraktion fehlgeschlagen:', e); }
    } else if (categoryChartView === 'bar') {
        try { barImg = await extractChartImage(barChartElement); }
        catch (e) { console.warn('Bar-Chart Extraktion fehlgeschlagen:', e); }
    }

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
    // SEITE 1.5: DETAILLIERTE ZUSAMMENFASSUNG (wenn summaryData vorhanden)
    // ═════════════════════════════════════════════════════════════════════════
    if (summaryData) {
        doc.addPage();
        currentPage++;

        doc.setFillColor(...COLORS.bgLight);
        doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

        let summaryPageY = addSectionTitle(doc, 'Detaillierte Zusammenfassung', PAGE.marginTop + 5,
            'Kernerkenntnisse aus dem Firmenvergleich');

        // Grid-Layout: 2 Spalten
        const numCols = 2;
        const colGap = 5;
        const rowGap = 6;
        const colWidth = (PAGE.contentWidth - (numCols - 1) * colGap) / numCols;

        // Helper zum Zeichnen einer Zusammenfassungsbox
        const drawSummaryBox = (xPos, yPos, width, title, iconColor, content) => {
            const boxPadding = 6;
            const lineHeight = 4.5;
            const titleHeight = 8;
            
            // Inhaltshöhe berechnen
            const contentLines = content.split('\n').length;
            const contentHeight = contentLines * lineHeight + boxPadding;
            const totalHeight = titleHeight + contentHeight;

            // Box zeichnen
            doc.setFillColor(...COLORS.white);
            doc.setDrawColor(...COLORS.border);
            doc.setLineWidth(0.3);
            doc.roundedRect(xPos, yPos, width, totalHeight, 2, 2, 'FD');

            // Icon-Bereich (farbiger Akzent links)
            doc.setFillColor(...iconColor);
            doc.roundedRect(xPos, yPos, 4, totalHeight, 2, 2, 'F');

            // Titel
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.dark);
            doc.text(title, xPos + 8, yPos + 5);

            // Content
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...COLORS.text);
            const contentY = yPos + titleHeight + 2;
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                // Text umbrechen wenn zu lang
                const maxWidth = width - 16;
                const wrappedLines = doc.splitTextToSize(line, maxWidth);
                wrappedLines.forEach((wrappedLine, wIdx) => {
                    doc.text(wrappedLine, xPos + 8, contentY + (idx * lineHeight) + (wIdx * lineHeight));
                });
            });

            return totalHeight;
        };

        // Sammle alle Boxen-Daten
        const boxes = [];

        // 1. Gesamtführer
        let leaderContent = '';
        if (summaryData.leader) {
            if (summaryData.leader.isTied) {
                leaderContent = `Mehrere Firmen gleichauf (Ø ${Number(summaryData.leader.score).toFixed(2)})`;
            } else {
                leaderContent = `${summaryData.leader.name}: ${Number(summaryData.leader.score).toFixed(2)}`;
            }
        } else {
            leaderContent = 'Keine Daten verfügbar';
        }
        boxes.push({ title: 'Gesamtführer', color: [245, 158, 11], content: leaderContent });

        // 2. Stärken-Profil
        let strengthsContent = '';
        if (summaryData.strengths && summaryData.strengths.length > 0) {
            strengthsContent = summaryData.strengths
                .map(({ slot, label, score }) => 
                    `• ${slot.name}: ${label || '–'}${score != null ? ` (${score.toFixed(2)})` : ''}`
                )
                .join('\n');
        } else {
            strengthsContent = 'Keine Daten verfügbar';
        }
        boxes.push({ title: 'Stärken-Profil', color: [16, 185, 129], content: strengthsContent });

        // 3. Größte Unterschiede
        let gapsContent = '';
        if (summaryData.biggestGaps && summaryData.biggestGaps.length > 0) {
            gapsContent = summaryData.biggestGaps
                .map(g => `• ${g.label}: Differenz ${g.spread.toFixed(2)} Punkte`)
                .join('\n');
        } else {
            gapsContent = 'Keine nennenswerten Unterschiede';
        }
        boxes.push({ title: 'Größte Unterschiede', color: [59, 130, 246], content: gapsContent });

        // 4. Gemeinsame Schwächen
        let weaknessesContent = '';
        if (summaryData.sharedWeaknesses && summaryData.sharedWeaknesses.length > 0) {
            weaknessesContent = summaryData.sharedWeaknesses.join(', ') + ' (alle unter 3,0)';
        } else {
            weaknessesContent = 'Keine – keine Kategorie bei allen unter 3,0';
        }
        boxes.push({ title: 'Gemeinsame Schwächen', color: [239, 68, 68], content: weaknessesContent });

        // 5. Trend-Ausblick
        let trendsContent = '';
        if (summaryData.trends && summaryData.trends.length > 0) {
            trendsContent = summaryData.trends
                .map(({ slot, trend }) => {
                    if (!trend) return `• ${slot.name}: –`;
                    const delta = parseFloat(trend.avgDelta) > 0 ? `+${trend.avgDelta}` : trend.avgDelta;
                    return `• ${slot.name}: ${delta} (12 Mon.)`;
                })
                .join('\n');
        } else {
            trendsContent = 'Keine Trenddaten verfügbar';
        }
        boxes.push({ title: 'Trend-Ausblick', color: [100, 116, 139], content: trendsContent });

        // 6. Chart-Ansicht Information (nur wenn relevant)
        if (radarImg || barImg) {
            const chartViewText = categoryChartView === 'radar' ? 'Radar-Ansicht' : 'Balken-Ansicht';
            boxes.push({ 
                title: 'Diagramm-Ansicht', 
                color: [139, 92, 246], 
                content: `Kategorievergleich wird als ${chartViewText} dargestellt`
            });
        }

        // Zeichne Boxen in Grid-Layout
        let currentRow = 0;
        let currentCol = 0;
        let rowHeights = [0]; // Track max height per row

        boxes.forEach((box, idx) => {
            const xPos = PAGE.marginLeft + currentCol * (colWidth + colGap);
            const yPos = summaryPageY + rowHeights.slice(0, currentRow).reduce((sum, h) => sum + h + rowGap, 0);
            
            const boxHeight = drawSummaryBox(xPos, yPos, colWidth, box.title, box.color, box.content);
            
            // Track max height in this row
            rowHeights[currentRow] = Math.max(rowHeights[currentRow] || 0, boxHeight);
            
            currentCol++;
            if (currentCol >= numCols) {
                currentCol = 0;
                currentRow++;
                rowHeights[currentRow] = 0;
            }
        });

        // Update summaryPageY für nachfolgende Inhalte
        summaryPageY += rowHeights.reduce((sum, h) => sum + h, 0) + (rowHeights.length - 1) * rowGap;
    }

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