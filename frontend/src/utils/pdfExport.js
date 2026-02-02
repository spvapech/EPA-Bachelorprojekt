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
    
    // Hintergrundfarbe (slate-50)
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Header - Firmenname
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(companyName, 20, 20);
    
    // Datum
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    const currentDate = new Date().toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Exportiert am: ${currentDate}`, 20, 35);
    
    // KPI Cards Grid (2x2 Layout wie im Dashboard)
    const cardWidth = 75;
    const cardHeight = 42;
    const gap = 8;
    const startX = 25;
    const startY = 50;
    
    // Helper function to draw a card (ähnlich zu den Dashboard Cards)
    const drawCard = (x, y, title, content, contentColor = [15, 23, 42], subtitle = null, subtitleColor = null) => {
        // Card Background (weiß mit Schatten-Effekt durch grauen Rand)
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
    
    drawCard(startX, startY, 'Ø Score', scoreValue, scoreColor);
    
    // 2. Trend Card (oben rechts)
    let trendContent, trendColor;
    if (trend?.avgDelta) {
        const trendValue = parseFloat(trend.avgDelta);
        const trendText = `${trendValue > 0 ? '+' : ''}${trend.avgDelta}`;
        
        // Farbe basiert auf dem tatsächlichen Wert (nicht dem Sign)
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
    
    drawCard(startX + cardWidth + gap, startY, 'Trend', trendContent, trendColor);
    
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
            [220, 38, 38]  // red-600
        );
    } else {
        drawCard(startX, startY + cardHeight + gap, 'Most Critical', '-', [148, 163, 184]);
    }
    
    // 4. Negative Topic Card (unten rechts)
    const negativeTopicText = negativeTopic || '-';
    
    drawCard(
        startX + cardWidth + gap, 
        startY + cardHeight + gap, 
        'Negative Topic', 
        negativeTopicText, 
        [251, 146, 60] // orange-400
    );
    
    // Footer auf der ersten Seite
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Generiert von Dashboard Export', 105, 287, { align: 'center' });
    
    // Timeline Chart hinzufügen (falls vorhanden)
    if (timelineChartElement) {
        try {
            console.log('Timeline Chart Element gefunden:', timelineChartElement);
            
            // Neue Seite für den Timeline Chart
            doc.addPage();
            
            // Hintergrundfarbe für neue Seite
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            
            // Timeline Überschrift
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text('Timeline', 20, 20);
            
            // Filter-Informationen anzeigen (falls vorhanden)
            let filterYPos = 28;
            if (timelineFilters) {
                const { metric, source, granularity, selectedYear, stats } = timelineFilters;
                
                // Linke Spalte: Filter
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(71, 85, 105); // slate-600
                doc.text('Ausgewählte Filter:', 20, filterYPos);
                
                filterYPos += 7;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139); // slate-500
                
                // Metrik
                doc.setFont('helvetica', 'bold');
                doc.text('Metrik:', 25, filterYPos);
                doc.setFont('helvetica', 'normal');
                doc.text(metric || 'Ø Score', 45, filterYPos);
                
                // Quelle
                filterYPos += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Quelle:', 25, filterYPos);
                doc.setFont('helvetica', 'normal');
                const sourceLabel = source === 'employee' ? 'Mitarbeiter' : source === 'candidates' ? 'Bewerber' : source;
                doc.text(sourceLabel, 45, filterYPos);
                
                // Zeitraum/Granularität
                filterYPos += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Zeitraum:', 25, filterYPos);
                doc.setFont('helvetica', 'normal');
                const granularityLabel = granularity === 'overall' ? 'Gesamter Zeitraum' : granularity === 'year' ? 'Jahresansicht' : granularity;
                doc.text(granularityLabel, 45, filterYPos);
                
                // Jahr (falls ausgewählt)
                if (granularity === 'year' && selectedYear) {
                    filterYPos += 5;
                    doc.setFont('helvetica', 'bold');
                    doc.text('Jahr:', 25, filterYPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(String(selectedYear), 45, filterYPos);
                }
                
                // Rechte Spalte: Statistiken (falls vorhanden)
                if (stats && stats.dataPoints) {
                    const statsX = 110; // X-Position für rechte Spalte
                    let statsYPos = 28;
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(71, 85, 105);
                    doc.text('Statistiken:', statsX, statsYPos);
                    
                    statsYPos += 7;
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 116, 139);
                    
                    // Datenpunkte (immer vorhanden)
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
                        
                        statsYPos += 5;
                        doc.setFont('helvetica', 'bold');
                        doc.text('Max Anzahl:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        doc.text(String(stats.maxCount || '-'), statsX + 35, statsYPos);
                    } else if (metric === "Trend") {
                        statsYPos += 5;
                        doc.setFont('helvetica', 'bold');
                        doc.text('Ø Trend:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        const avgTrend = parseFloat(stats.avgTrend || 0);
                        doc.setTextColor(avgTrend >= 0 ? 22 : 220, avgTrend >= 0 ? 163 : 38, avgTrend >= 0 ? 74 : 38);
                        doc.text((avgTrend >= 0 ? '+' : '') + stats.avgTrend, statsX + 35, statsYPos);
                        doc.setTextColor(100, 116, 139);
                        
                        statsYPos += 5;
                        doc.setFont('helvetica', 'bold');
                        doc.text('Max/Min:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        const maxTrend = parseFloat(stats.maxTrend || 0);
                        doc.text((maxTrend >= 0 ? '+' : '') + stats.maxTrend + ' / ' + stats.minTrend, statsX + 35, statsYPos);
                    } else {
                        // Ø Score
                        statsYPos += 5;
                        doc.setFont('helvetica', 'bold');
                        doc.text('Ø Historisch:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(37, 99, 235); // blue-600
                        doc.text(String(stats.avgHistorical || '-'), statsX + 35, statsYPos);
                        doc.setTextColor(100, 116, 139);
                        
                        if (stats.avgForecast) {
                            statsYPos += 5;
                            doc.setFont('helvetica', 'bold');
                            doc.text('Ø Prognose:', statsX + 5, statsYPos);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(249, 115, 22); // orange-500
                            doc.text(String(stats.avgForecast), statsX + 35, statsYPos);
                            doc.setTextColor(100, 116, 139);
                        }
                    }
                }
                
                filterYPos += 8;
            }
            
            console.log('Starte html2canvas...');
            
            // Chart als Bild rendern mit vollständiger oklch-Bereinigung
            const canvas = await html2canvas(timelineChartElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: false,
                width: timelineChartElement.offsetWidth,
                height: timelineChartElement.offsetHeight,
                onclone: (clonedDoc) => {
                    // Finde das geklonte Chart-Element
                    const clonedChart = clonedDoc.getElementById('timeline-chart-export');
                    if (!clonedChart) return;
                    
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
            const yPos = filterYPos + 5; // Position nach den Filtern
            
            doc.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);
            console.log('Bild zum PDF hinzugefügt');
            
            // Fußzeile auf zweiter Seite
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.setFont('helvetica', 'italic');
            doc.text('Dashboard Analytics System', 105, 280, { align: 'center' });
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Timeline Charts:', error);
            
            // Zeige Fehlermeldung im PDF
            doc.addPage();
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 38, 38);
            doc.text('Timeline Chart konnte nicht geladen werden', 105, 100, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(error.message || 'Unbekannter Fehler', 105, 110, { align: 'center' });
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
            
            // Hintergrundfarbe für neue Seite
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            
            // Topic Rating Überschrift
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text('Topic Bewertungen', 20, 20, { charSpace: 0 });
            
            // Filter-Informationen anzeigen (falls vorhanden)
            let filterYPos = 28;
            let maxYPos = filterYPos; // Track maximum Y position from both columns
            
            if (topicRatingFilters) {
                const { source, granularity, selectedYear, visibleTopics, stats } = topicRatingFilters;
                
                // Linke Spalte: Filter
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(71, 85, 105); // slate-600
                doc.text('Ausgewählte Filter:', 20, filterYPos);
                
                filterYPos += 7;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139); // slate-500
                
                // Quelle
                doc.setFont('helvetica', 'bold');
                doc.text('Quelle:', 25, filterYPos);
                doc.setFont('helvetica', 'normal');
                const sourceLabel = source === 'employee' ? 'Mitarbeiter' : source === 'candidates' ? 'Bewerber' : source;
                doc.text(sourceLabel, 45, filterYPos);
                
                // Zeitraum/Granularität
                filterYPos += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Zeitraum:', 25, filterYPos);
                doc.setFont('helvetica', 'normal');
                const granularityLabel = granularity === 'overall' ? 'Gesamter Zeitraum' : granularity === 'year' ? 'Jahresansicht' : granularity;
                doc.text(granularityLabel, 45, filterYPos);
                
                // Jahr (falls ausgewählt)
                if (granularity === 'year' && selectedYear) {
                    filterYPos += 5;
                    doc.setFont('helvetica', 'bold');
                    doc.text('Jahr:', 25, filterYPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(String(selectedYear), 45, filterYPos);
                }
                
                maxYPos = Math.max(maxYPos, filterYPos); // Update max Y position
                
                // Rechte Spalte: Statistiken (falls vorhanden)
                if (stats) {
                    const statsX = 110; // X-Position für rechte Spalte
                    let statsYPos = 28;
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(71, 85, 105);
                    doc.text('Statistiken:', statsX, statsYPos);
                    
                    statsYPos += 7;
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 116, 139);
                    
                    // Datenpunkte
                    if (stats.dataPoints) {
                        doc.setFont('helvetica', 'bold');
                        doc.text('Datenpunkte:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        doc.text(String(stats.dataPoints), statsX + 35, statsYPos);
                        statsYPos += 5;
                    }
                    
                    // Anzahl sichtbarer Topics
                    if (stats.topicsCount) {
                        doc.setFont('helvetica', 'bold');
                        doc.text('Sichtbare Topics:', statsX + 5, statsYPos);
                        doc.setFont('helvetica', 'normal');
                        doc.text(String(stats.topicsCount), statsX + 35, statsYPos);
                        statsYPos += 5;
                    }
                    
                    // Top 3 Topics anzeigen
                    if (stats.topTopics && stats.topTopics.length > 0) {
                        doc.setFont('helvetica', 'bold');
                        doc.text('Top Topics:', statsX + 5, statsYPos);
                        statsYPos += 5;
                        
                        doc.setFont('helvetica', 'normal');
                        stats.topTopics.slice(0, 3).forEach((topic, idx) => {
                            const shortTopic = topic.length > 20 ? topic.substring(0, 20) + '...' : topic;
                            doc.text(`${idx + 1}. ${shortTopic}`, statsX + 5, statsYPos);
                            statsYPos += 4;
                        });
                    }
                    
                    maxYPos = Math.max(maxYPos, statsYPos); // Update max Y position from stats
                }
                
                filterYPos = maxYPos + 8; // Use max Y position from both columns
            }
            
            console.log('Starte html2canvas für Topic Rating...');
            
            // Chart als Bild rendern mit vollständiger oklch-Bereinigung
            const canvas = await html2canvas(topicRatingChartElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: false,
                width: topicRatingChartElement.offsetWidth,
                height: topicRatingChartElement.offsetHeight,
                onclone: (clonedDoc) => {
                    // Finde das geklonte Chart-Element
                    const clonedChart = clonedDoc.getElementById('topic-rating-chart-export');
                    if (!clonedChart) return;
                    
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
            const yPos = filterYPos + 5; // Position nach den Filtern
            
            doc.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);
            console.log('Topic Rating Bild zum PDF hinzugefügt');
            
            // Fußzeile auf dritter Seite
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.setFont('helvetica', 'italic');
            doc.text('Dashboard Analytics System', 105, 280, { align: 'center' });
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Topic Rating Charts:', error);
            
            // Zeige Fehlermeldung im PDF
            doc.addPage();
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 38, 38);
            doc.text('Topic Rating Chart konnte nicht geladen werden', 105, 100, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(error.message || 'Unbekannter Fehler', 105, 110, { align: 'center' });
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
            
            // Hintergrundfarbe
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 297, 'F');
            
            // Überschrift
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text('Topic Übersicht', 20, 20, { charSpace: 0 });
            
            let yPos = 28;
            
            // Filter-Information
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(71, 85, 105); // slate-600
            doc.text('Datenquelle:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            const sourceLabel = topicOverviewData.sourceFilter === 'employee' 
                ? 'Mitarbeiter' 
                : topicOverviewData.sourceFilter === 'candidates' 
                ? 'Bewerber' 
                : 'Alle';
            doc.text(sourceLabel, 50, yPos);
            
            yPos += 10;
            
            // Statistiken
            if (topicOverviewData.stats) {
                const { totalTopics, avgRating, totalMentions } = topicOverviewData.stats;
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text(`Total Topics: ${totalTopics}`, 20, yPos);
                doc.text(`Ø Rating: ${avgRating}`, 70, yPos);
                doc.text(`Total Mentions: ${totalMentions}`, 120, yPos);
                
                yPos += 8;
            }
            
            // Tabellen-Header
            const colX = {
                topic: 20,
                sentiment: 90,
                rating: 125,
                frequency: 160
            };
            
            const rowHeight = 7;
            const headerY = yPos;
            
            // Header-Hintergrund
            doc.setFillColor(226, 232, 240); // slate-200
            doc.rect(15, headerY - 5, 180, rowHeight + 2, 'F');
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text('Topic', colX.topic, headerY);
            doc.text('Sentiment', colX.sentiment, headerY);
            doc.text('Rating', colX.rating, headerY);
            doc.text('Häufigkeit', colX.frequency, headerY);
            
            yPos = headerY + rowHeight + 2;
            
            // Tabellen-Zeilen (limitiert auf Top 20 Topics)
            const topics = topicOverviewData.topics.slice(0, 20);
            
            topics.forEach((topic, index) => {
                // Prüfe ob neue Seite nötig ist
                if (yPos > 270) {
                    doc.addPage();
                    doc.setFillColor(248, 250, 252);
                    doc.rect(0, 0, 210, 297, 'F');
                    yPos = 20;
                    
                    // Header wiederholen
                    doc.setFillColor(226, 232, 240);
                    doc.rect(15, yPos - 5, 180, rowHeight + 2, 'F');
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(30, 41, 59);
                    doc.text('Topic', colX.topic, yPos);
                    doc.text('Sentiment', colX.sentiment, yPos);
                    doc.text('Rating', colX.rating, yPos);
                    doc.text('Häufigkeit', colX.frequency, yPos);
                    yPos += rowHeight + 2;
                }
                
                // Zeilen-Hintergrund (alternierende Farben)
                if (index % 2 === 0) {
                    doc.setFillColor(248, 250, 252); // slate-50
                    doc.rect(15, yPos - 5, 180, rowHeight, 'F');
                }
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(51, 65, 85); // slate-700
                
                // Topic Name (kürzen falls zu lang)
                const topicName = topic.topic.length > 30 
                    ? topic.topic.substring(0, 30) + '...' 
                    : topic.topic;
                doc.text(topicName, colX.topic, yPos);
                
                // Sentiment mit Farbe
                const sentiment = topic.sentiment || 'Neutral';
                if (sentiment === 'Positiv') {
                    doc.setTextColor(22, 163, 74); // green-600
                } else if (sentiment === 'Negativ') {
                    doc.setTextColor(220, 38, 38); // red-600
                } else {
                    doc.setTextColor(100, 116, 139); // slate-500
                }
                doc.text(sentiment, colX.sentiment, yPos);
                
                // Rating
                doc.setTextColor(51, 65, 85);
                doc.text(topic.avgRating ? topic.avgRating.toFixed(1) : '-', colX.rating, yPos);
                
                // Frequency
                doc.text(String(topic.frequency || 0), colX.frequency, yPos);
                
                yPos += rowHeight;
            });
            
            // Hinweis falls mehr als 20 Topics
            if (topicOverviewData.topics.length > 20) {
                yPos += 5;
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 116, 139);
                doc.text(`Hinweis: Es werden nur die ersten 20 von ${topicOverviewData.topics.length} Topics angezeigt`, 105, yPos, { align: 'center' });
            }
            
            // Fußzeile
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.setFont('helvetica', 'italic');
            doc.text('Dashboard Analytics System', 105, 280, { align: 'center' });
            
            console.log('Topic Overview zur PDF hinzugefügt');
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Topic Übersicht:', error);
        }
    } else {
        console.warn('Topic Overview Daten nicht verfügbar');
    }
    
    // Speichere das PDF
    const fileName = `Dashboard_KPIs_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
