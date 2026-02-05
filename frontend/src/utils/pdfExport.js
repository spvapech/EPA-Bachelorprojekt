import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exportiert Dashboard-KPIs und Charts als PDF
 * @param {Object} kpiData - Die KPI-Daten zum Exportieren
 * @param {string} kpiData.companyName - Name der Firma
 * @param {number} kpiData.avgScore - Durchschnittlicher Score
 * @param {Object} kpiData.trend - Trend-Daten {avgDelta, sign}
 * @param {Object} kpiData.mostCritical - Most Critical Topic {topicName, score}
 * @param {string} kpiData.negativeTopic - Name des negativen Topics
 * @param {HTMLElement} kpiData.timelineChartElement - Timeline Chart DOM Element (optional)
 * @param {Object} kpiData.timelineFilters - Timeline Filter-Einstellungen {metric, source, granularity, selectedYear}
 * @param {HTMLElement} kpiData.topicRatingChartElement - Topic Rating Chart DOM Element (optional)
 * @param {Object} kpiData.topicRatingFilters - Topic Rating Filter-Einstellungen {source, granularity, selectedYear, visibleTopics}
 * @param {Object} kpiData.topicOverviewData - Topic Overview Daten {topics, sourceFilter, stats}
 */

// Helper Funktion für Seitenzahlen
const addPageNumber = (doc, pageNum, totalPages) => {
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    doc.text(`Seite ${pageNum} von ${totalPages}`, 195, 290, { align: 'right' });
};

// Helper Funktion für konsistente Fußzeilen
const addFooter = (doc, pageNum, totalPages) => {
    // Trennlinie
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(20, 282, 190, 282);
    
    // Links: Generiert von
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('helvetica', 'italic');
    doc.text('Dashboard Analytics System', 20, 287);
    
    // Mitte: Datum
    const currentDate = new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    doc.text(currentDate, 105, 287, { align: 'center' });
    
    // Rechts: Seitenzahl
    addPageNumber(doc, pageNum, totalPages);
};

// Helper Funktion für Titel-Header
const addSectionHeader = (doc, title, yPos = 20, withUnderline = true) => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, 20, yPos);
    
    if (withUnderline) {
        // Dekorative Linie unter dem Titel
        doc.setDrawColor(59, 130, 246); // blue-500
        doc.setLineWidth(1);
        doc.line(20, yPos + 3, 50, yPos + 3);
    }
    
    return yPos + 12; // Rückgabe der neuen Y-Position
};

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
        topicOverviewData = null
    } = kpiData;

    // Erstelle neues PDF-Dokument (A4-Format)
    const doc = new jsPDF();
    
    let currentPage = 1;
    // totalPages wird am Ende berechnet, wenn alle Seiten erstellt sind
    let totalPages = 0;
    
    // ===== TITELSEITE =====
    // Gradient-ähnlicher Hintergrund mit mehreren Rechtecken
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 120, 'F');
    
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 80, 210, 40, 'F');
    
    // Rest der Seite in hellem Grau
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 120, 210, 177, 'F');
    
    // Logo/Icon Bereich (verbessertes Design mit Chart-Symbol)
    // Äußerer Kreis
    doc.setFillColor(59, 130, 246); // blue-500
    doc.circle(105, 50, 20, 'F');
    
    // Innerer weißer Kreis
    doc.setFillColor(255, 255, 255);
    doc.circle(105, 50, 16, 'F');
    
    // Chart/Analytics Symbol (stilisierte Balken)
    doc.setFillColor(59, 130, 246); // blue-500
    // Balken 1 (kurz)
    doc.rect(95, 55, 4, 8, 'F');
    // Balken 2 (mittel)
    doc.rect(101, 50, 4, 13, 'F');
    // Balken 3 (lang)
    doc.rect(107, 45, 4, 18, 'F');
    // Balken 4 (mittel)
    doc.rect(113, 52, 4, 11, 'F');
    
    // Haupttitel
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Analytics Report', 105, 95, { align: 'center' });
    
    // Firmenname
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(companyName, 105, 110, { align: 'center' });
    
    // Dekorative Linie
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1.5);
    doc.line(70, 115, 140, 115);
    
    // Datum und Uhrzeit
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = currentDate.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Erstellt am ${dateStr}`, 105, 140, { align: 'center' });
    doc.text(`um ${timeStr} Uhr`, 105, 148, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Erstellt am ${dateStr}`, 105, 140, { align: 'center' });
    doc.text(`um ${timeStr} Uhr`, 105, 148, { align: 'center' });
    
    // Executive Summary Box
    const summaryY = 165;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(30, summaryY, 150, 70, 5, 5, 'FD');
    
    // Summary Titel
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Executive Summary', 105, summaryY + 10, { align: 'center' });
    
    // Summary Content - Quick Stats
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    let summaryTextY = summaryY + 22;
    const lineHeight = 8;
    
    // Durchschnittlicher Score
    doc.setFont('helvetica', 'bold');
    doc.text('Gesamtbewertung:', 40, summaryTextY);
    doc.setFont('helvetica', 'normal');
    const scoreText = avgScore !== '-' ? `${avgScore} / 5.0` : 'Keine Daten';
    const summaryScoreColor = avgScore > 3 ? [34, 197, 94] : avgScore >= 2 ? [71, 85, 105] : [239, 68, 68];
    doc.setTextColor(...summaryScoreColor);
    doc.text(scoreText, 90, summaryTextY);
    doc.setTextColor(71, 85, 105);
    
    summaryTextY += lineHeight;
    
    // Trend
    if (trend?.avgDelta) {
        doc.setFont('helvetica', 'bold');
        doc.text('Entwicklung:', 40, summaryTextY);
        doc.setFont('helvetica', 'normal');
        const trendValue = parseFloat(trend.avgDelta);
        const trendText = `${trendValue > 0 ? '+' : ''}${trend.avgDelta}`;
        const trendColor = trendValue > 0.05 ? [22, 163, 74] : trendValue < -0.05 ? [220, 38, 38] : [71, 85, 105];
        doc.setTextColor(...trendColor);
        doc.text(trendText, 90, summaryTextY);
        doc.setTextColor(71, 85, 105);
        summaryTextY += lineHeight;
    }
    
    // Most Critical
    if (mostCritical && mostCritical.topicName !== '-') {
        doc.setFont('helvetica', 'bold');
        doc.text('Kritischer Bereich:', 40, summaryTextY);
        doc.setFont('helvetica', 'normal');
        const criticalText = mostCritical.topicName.length > 25 
            ? mostCritical.topicName.substring(0, 25) + '...' 
            : mostCritical.topicName;
        doc.setTextColor(220, 38, 38);
        doc.text(criticalText, 90, summaryTextY);
        doc.setTextColor(71, 85, 105);
        summaryTextY += lineHeight;
    }
    
    // Negative Topic
    if (negativeTopic && negativeTopic !== '-') {
        doc.setFont('helvetica', 'bold');
        doc.text('Verbesserungspotenzial:', 40, summaryTextY);
        doc.setFont('helvetica', 'normal');
        const negText = negativeTopic.length > 20 ? negativeTopic.substring(0, 20) + '...' : negativeTopic;
        doc.setTextColor(251, 146, 60);
        doc.text(negText, 90, summaryTextY);
    }
    
    // Inhaltsverzeichnis
    const tocY = 250;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Inhaltsverzeichnis', 105, tocY, { align: 'center' });
    
    let tocItemY = tocY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    let pageCounter = 2;
    doc.text(`1. KPI-Übersicht ............................................. Seite ${pageCounter}`, 105, tocItemY, { align: 'center' });
    tocItemY += 6;
    
    if (timelineChartElement) {
        pageCounter++;
        doc.text(`2. Timeline-Analyse ........................................ Seite ${pageCounter}`, 105, tocItemY, { align: 'center' });
        tocItemY += 6;
    }
    
    if (topicRatingChartElement) {
        pageCounter++;
        doc.text(`3. Topic-Bewertungen ..................................... Seite ${pageCounter}`, 105, tocItemY, { align: 'center' });
        tocItemY += 6;
    }
    
    if (topicOverviewData) {
        pageCounter++;
        doc.text(`4. Topic-Übersicht .......................................... Seite ${pageCounter}`, 105, tocItemY, { align: 'center' });
    }
    
    // Titelseite hat keine Fußzeile (wird am Ende hinzugefügt)
    
    // ===== SEITE 2: KPI DASHBOARD =====
    doc.addPage();
    currentPage++;
    
    // Hintergrundfarbe
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, 'F');
    
    const startYPos = addSectionHeader(doc, 'KPI-Übersicht', 20);
    
    // Beschreibungstext
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Zentrale Kennzahlen zur Bewertung des Unternehmens', 20, startYPos);
    
    // KPI Cards Grid (2x2 Layout wie im Dashboard)
    const cardWidth = 75;
    const cardHeight = 42;
    const gap = 8;
    const startX = 25;
    const startY = 55;
    
    // Helper function to draw a card
    const drawCard = (x, y, title, content, contentColor = [15, 23, 42], subtitle = null, subtitleColor = null, icon = null) => {
        // Card Background mit Schatten-Effekt
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, cardWidth, cardHeight, 5, 5, 'FD');
        
        // Card Title
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(title, x + 6, y + 8);
        
        // Card Content (zentriert)
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...contentColor);
        
        // Berechne Zentrierung
        const contentX = x + cardWidth / 2;
        const contentY = y + cardHeight / 2 + 3;
        
        if (Array.isArray(content)) {
            // Für Trend mit Symbol und Wert
            doc.setFontSize(16);
            doc.text(content[0], contentX, contentY - 5, { align: 'center' }); // Symbol
            doc.setFontSize(14);
            doc.text(content[1], contentX, contentY + 5, { align: 'center' }); // Wert
        } else {
            // Text mit automatischem Umbruch für lange Namen
            doc.setFontSize(11);
            const maxWidth = cardWidth - 8;
            const lines = doc.splitTextToSize(content, maxWidth);
            
            // Startposition basierend auf Anzahl der Zeilen
            const lineHeight = 4.5;
            const totalHeight = lines.length * lineHeight;
            const startY = contentY - (totalHeight / 2) + 2;
            
            lines.forEach((line, index) => {
                doc.text(line, contentX, startY + (index * lineHeight), { align: 'center' });
            });
        }
        
        // Subtitle (z.B. Score bei Most Critical)
        if (subtitle) {
            doc.setFontSize(10);
            if (subtitleColor) {
                doc.setTextColor(...subtitleColor);
            }
            doc.text(subtitle, contentX, y + cardHeight - 7, { align: 'center' });
        }
    };
    
    // 1. Ø Score Card (oben links)
    const scoreValue = avgScore !== '-' ? avgScore.toString() : '-';
    const scoreColor = avgScore > 3 
        ? [34, 197, 94]    // green-500
        : avgScore >= 2 
        ? [30, 41, 59]     // slate-800
        : [239, 68, 68];   // red-500
    
    drawCard(startX, startY, 'Ø Score', scoreValue, scoreColor, null, null, null);
    
    // 2. Trend Card (oben rechts)
    let trendContent, trendColor;
    if (trend?.avgDelta) {
        const trendValue = parseFloat(trend.avgDelta);
        const trendText = `${trendValue > 0 ? '+' : ''}${trend.avgDelta}`;
        
        // Farbe basiert auf dem tatsächlichen Wert
        trendColor = trendValue > 0.05
            ? [22, 163, 74]    // green-600
            : trendValue < -0.05
            ? [220, 38, 38]    // red-600
            : [71, 85, 105];   // slate-600
        
        trendContent = trendText;
    } else {
        trendContent = '—';
        trendColor = [148, 163, 184]; // slate-400
    }
    
    drawCard(startX + cardWidth + gap, startY, 'Trend', trendContent, trendColor, null, null, null);
    
    // 3. Most Critical Card (unten links)
    if (mostCritical && mostCritical.topicName !== '-') {
        const topicName = mostCritical.topicName || '-';
        
        drawCard(
            startX, 
            startY + cardHeight + gap, 
            'Most Critical', 
            topicName, 
            [220, 38, 38], // red-600
            mostCritical.score,
            [220, 38, 38],  // red-600
            null
        );
    } else {
        drawCard(startX, startY + cardHeight + gap, 'Most Critical', '-', [148, 163, 184], null, null, null);
    }
    
    // 4. Negative Topic Card (unten rechts)
    const negativeTopicText = negativeTopic || '-';
    
    drawCard(
        startX + cardWidth + gap, 
        startY + cardHeight + gap, 
        'Negative Topic', 
        negativeTopicText, 
        [251, 146, 60], // orange-400
        null,
        null,
        null
    );
    
    // Footer wird am Ende hinzugefügt
    
    // Timeline Chart hinzufügen (falls vorhanden)
    if (timelineChartElement) {
        try {
            console.log('Timeline Chart Element gefunden:', timelineChartElement);
            
            // Neue Seite für den Timeline Chart
            doc.addPage();
            currentPage++;
            
            // Hintergrundfarbe für neue Seite
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            
            // Timeline Überschrift mit Section Header
            const filterYPos = addSectionHeader(doc, 'Timeline-Analyse', 20);
            
            // Beschreibungstext
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('Entwicklung der Bewertungen über die Zeit', 20, filterYPos);
            
            let currentYPos = filterYPos + 8;
            
            // Filter-Informationen anzeigen (falls vorhanden)
            if (timelineFilters) {
                const { metric, source, granularity, selectedYear, stats } = timelineFilters;
                
                // Filter-Box mit Hintergrund
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.5);
                doc.roundedRect(20, currentYPos, 170, (stats ? 28 : 22), 3, 3, 'FD');
                
                currentYPos += 5;
                
                // Linke Spalte: Filter
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(71, 85, 105); // slate-600
                doc.text('Filter:', 25, currentYPos);
                
                currentYPos += 6;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139); // slate-500
                
                // Metrik
                doc.setFont('helvetica', 'bold');
                doc.text('Metrik:', 30, currentYPos);
                doc.setFont('helvetica', 'normal');
                doc.text(metric || 'Ø Score', 50, currentYPos);
                
                // Quelle
                currentYPos += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Quelle:', 30, currentYPos);
                doc.setFont('helvetica', 'normal');
                const sourceLabel = source === 'employee' ? 'Mitarbeiter' : source === 'candidates' ? 'Bewerber' : source;
                doc.text(sourceLabel, 50, currentYPos);
                
                // Zeitraum/Granularität
                currentYPos += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Zeitraum:', 30, currentYPos);
                doc.setFont('helvetica', 'normal');
                const granularityLabel = granularity === 'overall' ? 'Gesamter Zeitraum' : granularity === 'year' ? 'Jahresansicht' : granularity;
                doc.text(granularityLabel, 50, currentYPos);
                
                // Jahr (falls ausgewählt)
                if (granularity === 'year' && selectedYear) {
                    currentYPos += 5;
                    doc.setFont('helvetica', 'bold');
                    doc.text('Jahr:', 30, currentYPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(String(selectedYear), 50, currentYPos);
                }
                
                // Rechte Spalte: Statistiken (falls vorhanden)
                if (stats && stats.dataPoints) {
                    const statsX = 115; // X-Position für rechte Spalte
                    let statsYPos = currentYPos - (granularity === 'year' && selectedYear ? 15 : 10);
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(71, 85, 105);
                    doc.text('Statistiken:', statsX, statsYPos);
                    
                    statsYPos += 6;
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 116, 139);
                    
                    // Datenpunkte
                    doc.setFont('helvetica', 'bold');
                    doc.text('Datenpunkte:', statsX + 5, statsYPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(String(stats.dataPoints), statsX + 35, statsYPos);
                    
                    // Metrik-spezifische Statistiken
                    if (metric === "Anzahl") {
                        statsYPos += 5;
                        doc.setFont('helvetica', 'bold');
                        doc.text('Ø Anzahl:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        doc.text(String(stats.avgCount || '-'), statsX + 35, statsYPos);
                    } else if (metric === "Trend") {
                        statsYPos += 5;
                        doc.setFont('helvetica', 'bold');
                        doc.text('Ø Trend:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        const avgTrend = parseFloat(stats.avgTrend || 0);
                        doc.setTextColor(avgTrend >= 0 ? 22 : 220, avgTrend >= 0 ? 163 : 38, avgTrend >= 0 ? 74 : 38);
                        doc.text((avgTrend >= 0 ? '+' : '') + stats.avgTrend, statsX + 35, statsYPos);
                        doc.setTextColor(100, 116, 139);
                    } else {
                        // Ø Score
                        statsYPos += 5;
                        doc.setFont('helvetica', 'bold');
                        doc.text('Ø Historisch:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(37, 99, 235); // blue-600
                        doc.text(String(stats.avgHistorical || '-'), statsX + 35, statsYPos);
                        doc.setTextColor(100, 116, 139);
                    }
                }
                
                currentYPos += 10;
            }
            
            console.log('Starte html2canvas für Timeline...');
            console.log('Timeline Element Größe:', timelineChartElement.offsetWidth, 'x', timelineChartElement.offsetHeight);
            
            // Chart als Bild rendern mit verbesserter Konfiguration
            const canvas = await html2canvas(timelineChartElement, {
                scale: 3, // Erhöhte Auflösung für bessere Qualität
                backgroundColor: '#ffffff',
                logging: true, // Aktiviere Logging für Debug
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: false,
                imageTimeout: 15000, // 15 Sekunden Timeout für Bilder
                removeContainer: false,
                width: timelineChartElement.offsetWidth,
                height: timelineChartElement.offsetHeight,
                windowWidth: timelineChartElement.scrollWidth,
                windowHeight: timelineChartElement.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    // Finde das geklonte Chart-Element
                    const clonedChart = clonedDoc.getElementById('timeline-chart-export');
                    if (!clonedChart) {
                        console.warn('Geklontes Chart-Element nicht gefunden');
                        return;
                    }
                    
                    console.log('Klone Chart für Rendering...');
                    
                    // Stelle sicher, dass das Element sichtbar und vollständig ist
                    clonedChart.style.visibility = 'visible';
                    clonedChart.style.display = 'block';
                    clonedChart.style.opacity = '1';
                    
                    // Entferne alle oklch-Styles rekursiv und aggressiver
                    const removeOklch = (element) => {
                        try {
                            // Computed styles holen
                            const computedStyle = window.getComputedStyle(element);
                            
                            // Alle Properties durchgehen
                            const cssProperties = [
                                'color', 'backgroundColor', 'borderColor', 
                                'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
                                'fill', 'stroke', 'outlineColor'
                            ];
                            
                            cssProperties.forEach(prop => {
                                const value = computedStyle.getPropertyValue(prop);
                                if (value && value.includes('oklch')) {
                                    // Setze auf transparent oder einen Fallback-Wert
                                    element.style.setProperty(prop, 'transparent', 'important');
                                }
                            });
                            
                            // Entferne alle inline styles mit oklch
                            if (element.style && element.style.cssText) {
                                element.style.cssText = element.style.cssText
                                    .replace(/oklch\([^)]*\)/gi, 'transparent')
                                    .replace(/color:\s*oklch[^;]*/gi, '')
                                    .replace(/background-color:\s*oklch[^;]*/gi, '');
                            }
                            
                            // Rekursiv für alle Kinder
                            Array.from(element.children).forEach(child => removeOklch(child));
                        } catch (e) {
                            // Ignoriere Fehler bei einzelnen Elementen
                            console.warn('Fehler beim Bereinigen eines Elements:', e);
                        }
                    };
                    
                    removeOklch(clonedChart);
                    
                    // Entferne auch alle Style-Tags die oklch enthalten
                    const styleTags = clonedDoc.getElementsByTagName('style');
                    Array.from(styleTags).forEach(style => {
                        if (style.textContent && style.textContent.includes('oklch')) {
                            style.textContent = style.textContent.replace(/oklch\([^)]*\)/gi, 'transparent');
                        }
                    });
                    
                    // Entferne auch Link-Tags zu CSS mit oklch (Tailwind v4)
                    const linkTags = clonedDoc.getElementsByTagName('link');
                    Array.from(linkTags).forEach(link => {
                        if (link.rel === 'stylesheet') {
                            link.remove();
                        }
                    });
                }
            });
            
            console.log('Canvas erstellt:', canvas.width, 'x', canvas.height);
            
            const imgData = canvas.toDataURL('image/png');
            console.log('Bild-Daten erstellt, Länge:', imgData.length);
            
            // Berechne Dimensionen für das PDF (A4-Seite mit Rand)
            const imgWidth = 170; // Breite in mm (A4 ist 210mm breit)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const maxHeight = 220; // Maximale Höhe
            
            const finalHeight = Math.min(imgHeight, maxHeight);
            const finalWidth = imgHeight > maxHeight ? (canvas.width * maxHeight) / canvas.height : imgWidth;
            
            console.log('Finale Dimensionen:', finalWidth, 'x', finalHeight);
            
            // Chart zentriert einfügen
            const xPos = (210 - finalWidth) / 2;
            const yPos = currentYPos + 5;
            
            doc.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);
            console.log('Bild zum PDF hinzugefügt');
            
            // Fußzeile wird am Ende hinzugefügt
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Timeline Charts:', error);
            
            // Zeige professionelle Fehlermeldung im PDF
            doc.addPage();
            currentPage++;
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            
            addSectionHeader(doc, 'Timeline-Analyse', 20);
            
            // Fehler-Box
            doc.setFillColor(254, 242, 242); // red-50
            doc.setDrawColor(252, 165, 165); // red-300
            doc.setLineWidth(1);
            doc.roundedRect(30, 60, 150, 40, 5, 5, 'FD');
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 38, 38);
            doc.text('Chart konnte nicht geladen werden', 105, 75, { align: 'center' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(127, 29, 29);
            const errorMsg = error.message || 'Unbekannter Fehler';
            const errorLines = doc.splitTextToSize(errorMsg, 130);
            let errorY = 85;
            errorLines.forEach(line => {
                doc.text(line, 105, errorY, { align: 'center' });
                errorY += 5;
            });
            
            // Fußzeile wird am Ende hinzugefügt
        }
    } else {
        console.warn('Timeline Chart Element nicht gefunden');
    }
    
    // Topic Rating Chart hinzufügen (falls vorhanden)
    if (topicRatingChartElement) {
        try {
            console.log('Topic Rating Chart Element gefunden:', topicRatingChartElement);
            
            // Neue Seite für den Topic Rating Chart
            doc.addPage();
            currentPage++;
            
            // Hintergrundfarbe für neue Seite
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            
            // Topic Rating Überschrift mit Section Header
            const headerYPos = addSectionHeader(doc, 'Topic-Bewertungen', 20);
            
            // Beschreibungstext
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('Durchschnittliche Bewertung der verschiedenen Themenbereiche', 20, headerYPos);
            
            let currentYPos = headerYPos + 8;
            
            // Filter-Informationen anzeigen (falls vorhanden)
            if (topicRatingFilters) {
                const { source, granularity, selectedYear, stats } = topicRatingFilters;
                
                // Berechne die benötigte Box-Höhe basierend auf Inhalt
                let filterLines = 2; // Quelle + Zeitraum
                if (granularity === 'year' && selectedYear) filterLines += 1;
                const boxHeight = 10 + (filterLines * 5) + 5; // Padding + Zeilen + Margin
                
                // Filter-Box mit Hintergrund
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.5);
                doc.roundedRect(20, currentYPos, 170, boxHeight, 3, 3, 'FD');
                
                const boxStartY = currentYPos;
                currentYPos += 6;
                const startFilterY = currentYPos;
                
                // Linke Spalte: Filter
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(71, 85, 105); // slate-600
                doc.text('Filter:', 25, currentYPos);
                
                currentYPos += 6;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139); // slate-500
                
                // Quelle
                doc.setFont('helvetica', 'bold');
                doc.text('Quelle:', 30, currentYPos);
                doc.setFont('helvetica', 'normal');
                const sourceLabel = source === 'employee' ? 'Mitarbeiter' : source === 'candidates' ? 'Bewerber' : source;
                doc.text(sourceLabel, 50, currentYPos);
                
                // Zeitraum/Granularität
                currentYPos += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Zeitraum:', 30, currentYPos);
                doc.setFont('helvetica', 'normal');
                const granularityLabel = granularity === 'overall' ? 'Gesamter Zeitraum' : granularity === 'year' ? 'Jahresansicht' : granularity;
                doc.text(granularityLabel, 50, currentYPos);
                
                // Jahr (falls ausgewählt)
                if (granularity === 'year' && selectedYear) {
                    currentYPos += 5;
                    doc.setFont('helvetica', 'bold');
                    doc.text('Jahr:', 30, currentYPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(String(selectedYear), 50, currentYPos);
                }
                
                // Rechte Spalte: Statistiken (falls vorhanden)
                if (stats) {
                    const statsX = 115; // X-Position für rechte Spalte
                    let statsYPos = startFilterY;
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(71, 85, 105);
                    doc.text('Statistiken:', statsX, statsYPos);
                    
                    statsYPos += 6;
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 116, 139);
                    
                    // Datenpunkte
                    if (stats.dataPoints) {
                        doc.setFont('helvetica', 'bold');
                        doc.text('Datenpunkte:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        doc.text(String(stats.dataPoints), statsX + 30, statsYPos);
                        statsYPos += 5;
                    }
                    
                    // Anzahl sichtbarer Topics
                    if (stats.topicsCount) {
                        doc.setFont('helvetica', 'bold');
                        doc.text('Topics:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        doc.text(String(stats.topicsCount), statsX + 30, statsYPos);
                    }
                }
                
                // Setze currentYPos auf das Ende der Box
                currentYPos = boxStartY + boxHeight + 8;
            }
            
            console.log('Starte html2canvas für Topic Rating...');
            console.log('Topic Rating Element Größe:', topicRatingChartElement.offsetWidth, 'x', topicRatingChartElement.offsetHeight);
            
            // Chart als Bild rendern mit verbesserter Konfiguration
            const canvas = await html2canvas(topicRatingChartElement, {
                scale: 3, // Erhöhte Auflösung für bessere Qualität
                backgroundColor: '#ffffff',
                logging: true, // Aktiviere Logging für Debug
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: false,
                imageTimeout: 15000, // 15 Sekunden Timeout für Bilder
                removeContainer: false,
                width: topicRatingChartElement.offsetWidth,
                height: topicRatingChartElement.offsetHeight,
                windowWidth: topicRatingChartElement.scrollWidth,
                windowHeight: topicRatingChartElement.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    // Finde das geklonte Chart-Element
                    const clonedChart = clonedDoc.getElementById('topic-rating-chart-export');
                    if (!clonedChart) {
                        console.warn('Geklontes Topic Rating Chart nicht gefunden');
                        return;
                    }
                    
                    console.log('Klone Topic Rating Chart für Rendering...');
                    
                    // Stelle sicher, dass das Element sichtbar und vollständig ist
                    clonedChart.style.visibility = 'visible';
                    clonedChart.style.display = 'block';
                    clonedChart.style.opacity = '1';
                    
                    // Entferne alle oklch-Styles rekursiv
                    const removeOklch = (element) => {
                        try {
                            const computedStyle = window.getComputedStyle(element);
                            const cssProperties = [
                                'color', 'backgroundColor', 'borderColor', 
                                'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
                                'fill', 'stroke', 'outlineColor'
                            ];
                            
                            cssProperties.forEach(prop => {
                                const value = computedStyle.getPropertyValue(prop);
                                if (value && value.includes('oklch')) {
                                    element.style.setProperty(prop, 'transparent', 'important');
                                }
                            });
                            
                            // Entferne alle inline styles mit oklch
                            if (element.style && element.style.cssText) {
                                element.style.cssText = element.style.cssText
                                    .replace(/oklch\([^)]*\)/gi, 'transparent')
                                    .replace(/color:\s*oklch[^;]*/gi, '')
                                    .replace(/background-color:\s*oklch[^;]*/gi, '');
                            }
                            
                            // Rekursiv für alle Kinder
                            Array.from(element.children).forEach(child => removeOklch(child));
                        } catch (e) {
                            console.warn('Fehler beim Bereinigen eines Elements:', e);
                        }
                    };
                    
                    removeOklch(clonedChart);
                    
                    // Entferne auch alle Style-Tags die oklch enthalten
                    const styleTags = clonedDoc.getElementsByTagName('style');
                    Array.from(styleTags).forEach(style => {
                        if (style.textContent && style.textContent.includes('oklch')) {
                            style.textContent = style.textContent.replace(/oklch\([^)]*\)/gi, 'transparent');
                        }
                    });
                    
                    // Entferne auch Link-Tags zu CSS mit oklch (Tailwind v4)
                    const linkTags = clonedDoc.getElementsByTagName('link');
                    Array.from(linkTags).forEach(link => {
                        if (link.rel === 'stylesheet') {
                            link.remove();
                        }
                    });
                }
            });
            
            console.log('Canvas erstellt:', canvas.width, 'x', canvas.height);
            
            const imgData = canvas.toDataURL('image/png');
            console.log('Bild-Daten erstellt, Länge:', imgData.length);
            
            // Berechne Dimensionen für das PDF (A4-Seite mit Rand)
            const imgWidth = 170; // Breite in mm (A4 ist 210mm breit)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const maxHeight = 220; // Maximale Höhe
            
            const finalHeight = Math.min(imgHeight, maxHeight);
            const finalWidth = imgHeight > maxHeight ? (canvas.width * maxHeight) / canvas.height : imgWidth;
            
            console.log('Finale Dimensionen:', finalWidth, 'x', finalHeight);
            
            // Chart zentriert einfügen
            const xPos = (210 - finalWidth) / 2;
            const yPos = currentYPos + 5;
            
            doc.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);
            console.log('Topic Rating Bild zum PDF hinzugefügt');
            
            // Fußzeile wird am Ende hinzugefügt
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Topic Rating Charts:', error);
            
            // Zeige professionelle Fehlermeldung im PDF
            doc.addPage();
            currentPage++;
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            
            addSectionHeader(doc, 'Topic-Bewertungen', 20);
            
            // Fehler-Box
            doc.setFillColor(254, 242, 242); // red-50
            doc.setDrawColor(252, 165, 165); // red-300
            doc.setLineWidth(1);
            doc.roundedRect(30, 60, 150, 40, 5, 5, 'FD');
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 38, 38);
            doc.text('Chart konnte nicht geladen werden', 105, 75, { align: 'center' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(127, 29, 29);
            const errorMsg = error.message || 'Unbekannter Fehler';
            const errorLines = doc.splitTextToSize(errorMsg, 130);
            let errorY = 85;
            errorLines.forEach(line => {
                doc.text(line, 105, errorY, { align: 'center' });
                errorY += 5;
            });
            
            // Fußzeile wird am Ende hinzugefügt
        }
    } else {
        console.warn('Topic Rating Chart Element nicht gefunden');
    }
    
    // Topic Übersicht hinzufügen (falls vorhanden)
    if (topicOverviewData && topicOverviewData.topics && topicOverviewData.topics.length > 0) {
        try {
            console.log('Topic Overview Daten gefunden:', topicOverviewData);
            
            // Neue Seite für die Topic Übersicht
            doc.addPage();
            currentPage++;
            
            // Hintergrundfarbe
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            
            // Überschrift mit Section Header
            let yPos = addSectionHeader(doc, 'Topic-Übersicht', 20);
            
            // Beschreibungstext
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('Detaillierte Aufstellung aller identifizierten Themenbereiche', 20, yPos);
            
            yPos += 10;
            
            // Filter-Information in Box
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.roundedRect(20, yPos, 170, 20, 3, 3, 'FD');
            
            yPos += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(71, 85, 105); // slate-600
            doc.text('Datenquelle:', 25, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            const sourceLabel = topicOverviewData.sourceFilter === 'employee' 
                ? 'Mitarbeiter' 
                : topicOverviewData.sourceFilter === 'candidates' 
                ? 'Bewerber' 
                : 'Alle';
            doc.text(sourceLabel, 55, yPos);
            
            // Statistiken auf der gleichen Zeile
            if (topicOverviewData.stats) {
                const { totalTopics, avgRating, totalMentions } = topicOverviewData.stats;
                
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(71, 85, 105);
                doc.text('Total Topics:', 95, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(String(totalTopics), 123, yPos);
                
                doc.setFont('helvetica', 'bold');
                doc.text('Ø Rating:', 140, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(String(avgRating), 158, yPos);
            }
            
            yPos += 18;
            
            // Tabellen-Header
            const colX = {
                topic: 20,
                sentiment: 85,
                rating: 120,
                frequency: 150,
                quality: 175
            };
            
            const rowHeight = 7;
            const headerY = yPos;
            
            // Header-Hintergrund mit Farbverlauf-Effekt
            doc.setFillColor(59, 130, 246); // blue-500
            doc.roundedRect(15, headerY - 5, 180, rowHeight + 2, 2, 2, 'F');
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255); // weiß
            doc.text('Topic', colX.topic, headerY);
            doc.text('Sentiment', colX.sentiment, headerY);
            doc.text('Rating', colX.rating, headerY);
            doc.text('Anzahl', colX.frequency, headerY);
            doc.text('Qualität', colX.quality, headerY);
            
            yPos = headerY + rowHeight + 4;
            
            // Tabellen-Zeilen (alle Topics)
            const topics = topicOverviewData.topics;
            
            topics.forEach((topic, index) => {
                // Prüfe ob neue Seite nötig ist
                if (yPos > 270) {
                    // Neue Seite ohne Fußzeile (wird am Ende hinzugefügt)
                    
                    doc.addPage();
                    currentPage++;
                    doc.setFillColor(248, 250, 252);
                    doc.rect(0, 0, 210, 297, 'F');
                    yPos = 20;
                    
                    // Header wiederholen
                    doc.setFillColor(59, 130, 246);
                    doc.roundedRect(15, yPos - 5, 180, rowHeight + 2, 2, 2, 'F');
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(255, 255, 255);
                    doc.text('Topic', colX.topic, yPos);
                    doc.text('Sentiment', colX.sentiment, yPos);
                    doc.text('Rating', colX.rating, yPos);
                    doc.text('Anzahl', colX.frequency, yPos);
                    doc.text('Qualität', colX.quality, yPos);
                    yPos += rowHeight + 4;
                }
                
                // Zeilen-Hintergrund (alternierende Farben)
                if (index % 2 === 0) {
                    doc.setFillColor(255, 255, 255); // weiß
                } else {
                    doc.setFillColor(248, 250, 252); // slate-50
                }
                doc.rect(15, yPos - 5, 180, rowHeight, 'F');
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(51, 65, 85); // slate-700
                
                // Topic Name (kürzen falls zu lang)
                const topicName = topic.topic.length > 30 
                    ? topic.topic.substring(0, 30) + '...' 
                    : topic.topic;
                doc.text(topicName, colX.topic, yPos);
                
                // Sentiment mit Farbe und Badge-Style (korrigierte Positionierung)
                const sentiment = topic.sentiment || 'Neutral';
                // Entferne fehlerhafte Zeichen
                const cleanSentiment = String(sentiment).replace(/[^\w\säöüÄÖÜß-]/g, '').trim();
                
                if (cleanSentiment === 'Positiv') {
                    doc.setTextColor(22, 163, 74); // green-600
                    // Verwende gefüllten Kreis statt Unicode
                    doc.setFillColor(22, 163, 74);
                    doc.circle(colX.sentiment - 2, yPos - 2, 1.5, 'F');
                    doc.setFontSize(8);
                    doc.text(cleanSentiment, colX.sentiment + 2, yPos);
                } else if (cleanSentiment === 'Negativ') {
                    doc.setTextColor(220, 38, 38); // red-600
                    doc.setFillColor(220, 38, 38);
                    doc.circle(colX.sentiment - 2, yPos - 2, 1.5, 'F');
                    doc.setFontSize(8);
                    doc.text(cleanSentiment, colX.sentiment + 2, yPos);
                } else {
                    doc.setTextColor(100, 116, 139); // slate-500
                    doc.setFillColor(100, 116, 139);
                    doc.circle(colX.sentiment - 2, yPos - 2, 1.5, 'F');
                    doc.setFontSize(8);
                    doc.text(cleanSentiment || 'Neutral', colX.sentiment + 2, yPos);
                }
                
                // Rating mit farblicher Hervorhebung
                doc.setTextColor(51, 65, 85);
                const rating = topic.avgRating ? topic.avgRating.toFixed(1) : '-';
                if (topic.avgRating) {
                    if (topic.avgRating >= 4) {
                        doc.setTextColor(22, 163, 74); // green-600
                    } else if (topic.avgRating < 3) {
                        doc.setTextColor(220, 38, 38); // red-600
                    }
                }
                doc.text(rating, colX.rating, yPos);
                
                // Frequency (Anzahl)
                doc.setTextColor(51, 65, 85);
                doc.text(String(topic.frequency || 0), colX.frequency, yPos);
                
                // Data Quality (Datenqualität) - basierend auf statistical_meta.risk_level
                const riskLevel = topic.statistical_meta?.risk_level;
                
                if (riskLevel) {
                    doc.setFontSize(8);
                    let qualityText = '';
                    let qualityColor = [51, 65, 85]; // default slate-700
                    
                    switch (riskLevel) {
                        case 'limited':
                            qualityText = 'Begrenzt';
                            qualityColor = [220, 38, 38]; // red-600
                            break;
                        case 'constrained':
                            qualityText = 'Eingeschränkt';
                            qualityColor = [251, 146, 60]; // orange-400
                            break;
                        case 'acceptable':
                            qualityText = 'Akzeptabel';
                            qualityColor = [234, 179, 8]; // yellow-600
                            break;
                        case 'solid':
                            qualityText = 'Solide';
                            qualityColor = [22, 163, 74]; // green-600
                            break;
                        default:
                            qualityText = 'N/A';
                            qualityColor = [100, 116, 139]; // slate-500
                    }
                    
                    doc.setTextColor(...qualityColor);
                    doc.text(qualityText, colX.quality, yPos);
                } else {
                    // Fallback wenn keine statistical_meta vorhanden
                    doc.setTextColor(100, 116, 139); // slate-500
                    doc.text('N/A', colX.quality, yPos);
                }
                
                yPos += rowHeight;
            });
            
            console.log('Topic Overview zur PDF hinzugefügt');
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Topic Übersicht:', error);
        }
    } else {
        console.warn('Topic Overview Daten nicht verfügbar');
    }
    
    // Berechne die tatsächliche Anzahl der Seiten
    totalPages = doc.internal.pages.length - 1; // -1 weil die erste Seite leer ist (jsPDF intern)
    
    // Füge Fußzeilen auf allen Seiten hinzu (außer der ersten Titelseite)
    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages);
    }
    
    // Speichere das PDF
    const fileName = `Dashboard_KPIs_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
