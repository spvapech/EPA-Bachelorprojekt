"""
LDA Topic Model Implementation using Gensim
Analyzes text data from candidates and employees to discover topics.

VERSION 2.0 - Optimiert für Arbeitsthemen
==========================================

Hauptverbesserungen:
-------------------
1. ✅ Erweiterte Stopwords (200+ deutsche + domain-spezifische)
2. ✅ Abkürzungsnormalisierung (MA→mitarbeiter, AG→arbeitgeber, etc.)
3. ✅ Bigram/Trigram Support (work_life_balance, home_office, etc.)
4. ✅ Optimierte LDA-Parameter (alpha='auto', eta='auto')
5. ✅ Verbesserte Modell-Persistenz (inkl. Bigram/Trigram-Modelle)
6. ✅ Zusätzliche Token-Filter (Rauschbegriffe, Artefakte)

Ergebnis:
---------
Topics fokussieren sich jetzt auf arbeitsrelevante Begriffe:
- gehalt, bezahlung, vergütung
- homeoffice, flexible_arbeitszeit, work_life_balance
- team, kollegen, zusammenarbeit
- führung, management, vorgesetzter
- entwicklung, weiterbildung, karriere

Dokumentation:
--------------
- Detailliert: TOPIC_MODELING_IMPROVEMENTS.md
- Quickstart: QUICKSTART_NEW_MODEL.md
- Changelog: CHANGELOG_TOPIC_MODELING.md
- API-Docs: docs/TOPIC_MODELING_API.md

Letzte Aktualisierung: 5. Januar 2026
"""

from gensim import corpora
from gensim.models import LdaModel, Phrases
from gensim.parsing.preprocessing import (
    preprocess_string,
    strip_punctuation,
    strip_numeric,
    remove_stopwords,
    strip_short,
    stem_text
)
from typing import List, Dict, Any, Tuple, Optional
import pickle
import os
from datetime import datetime
import re


class LDATopicAnalyzer:
    """
    LDA Topic Model for analyzing candidate and employee feedback.
    Optimized for work-related topics using database rating criteria.
    """
    
    @staticmethod
    def get_rating_criteria_keywords() -> set:
        """
        Extract rating criteria from database schema as important keywords.
        These are derived from the sternebewertung columns in candidates and employee tables.
        
        Returns:
            Set of work-related keywords from rating criteria
        """
        candidate_criteria = [
            'erklaerung_der_weiteren_schritte', 'zufriedenstellende_reaktion',
            'vollstaendigkeit_der_infos', 'zufriedenstellende_antworten',
            'angenehme_atmosphaere', 'professionalitaet_des_gespraechs',
            'wertschaetzende_behandlung', 'erwartbarkeit_des_prozesses',
            'zeitgerechte_zu_oder_absage', 'schnelle_antwort'
        ]
        
        employee_criteria = [
            'arbeitsatmosphaere', 'image', 'work_life_balance',
            'karriere_weiterbildung', 'gehalt_sozialleistungen',
            'kollegenzusammenhalt', 'umwelt_sozialbewusstsein',
            'vorgesetztenverhalten', 'kommunikation', 'interessante_aufgaben',
            'umgang_mit_aelteren_kollegen', 'arbeitsbedingungen',
            'gleichberechtigung'
        ]
        
        # Extrahiere Einzelbegriffe aus den zusammengesetzten Kriterien
        keywords = set()
        for criteria in candidate_criteria + employee_criteria:
            # Splitte an Unterstrichen und füge Einzelwörter hinzu
            parts = criteria.split('_')
            keywords.update(parts)
            # Füge auch das komplette Kriterium hinzu (mit Unterstrichen)
            keywords.add(criteria)
            # Füge auch ohne Unterstriche hinzu
            keywords.add(criteria.replace('_', ''))
        
        # Entferne zu kurze oder generische Begriffe
        keywords = {k for k in keywords if len(k) > 3 and k not in {'oder', 'der', 'des', 'mit'}}
        
        return keywords
    
    def __init__(self, num_topics: int = 5, passes: int = 15, iterations: int = 400):
        """
        Initialize the LDA Topic Analyzer.
        
        Args:
            num_topics: Number of topics to extract
            passes: Number of passes through the corpus during training
            iterations: Number of iterations for the model
        """
        self.num_topics = num_topics
        self.passes = passes
        self.iterations = iterations
        self.dictionary = None
        self.corpus = None
        self.lda_model = None
        self.documents = []
        self.bigram_model = None
        self.trigram_model = None
        
        # Erweiterte deutsche Stopwords für besseren Fokus auf Arbeitsthemen
        self.german_stopwords = set([
            # Artikel und Pronomen
            'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'eines', 'einem', 'einen',
            'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'mir', 'sich', 'uns', 'euch',
            'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes', 'welcher', 'welche', 'welches',
            'mein', 'dein', 'sein', 'unser', 'euer',
            
            # Konjunktionen und Präpositionen
            'und', 'oder', 'aber', 'wenn', 'als', 'wie', 'bei', 'nach', 'von', 'zu', 'mit',
            'auf', 'für', 'an', 'am', 'im', 'um', 'bis', 'gegen', 'ohne', 'durch', 'über',
            'unter', 'während', 'wegen', 'trotz', 'seit', 'vor', 'hinter', 'neben',
            
            # Hilfsverben und Modalverben
            'ist', 'sind', 'war', 'waren', 'sein', 'haben', 'hat', 'hatte', 'hatten',
            'werden', 'wird', 'wurde', 'wurden', 'worden', 'gewesen', 'geworden',
            'können', 'kann', 'konnte', 'konnten', 'könnte', 'könnten',
            'müssen', 'muss', 'musste', 'mussten', 'müsste', 'müssten',
            'sollen', 'soll', 'sollte', 'sollten',
            'wollen', 'will', 'wollte', 'wollten', 'würde', 'würden',
            'dürfen', 'darf', 'durfte', 'durften',
            'mögen', 'mag', 'mochte', 'mochten', 'möchte', 'möchten',
            
            # Negation und Quantifikatoren
            'nicht', 'kein', 'keine', 'keines', 'keinem', 'keinen', 'nie', 'niemals', 'nichts',
            'alle', 'alles', 'allem', 'allen', 'jeder', 'jede', 'jedes', 'jedem', 'jeden',
            'einige', 'einigen', 'manche', 'manchen', 'viele', 'vielen', 'wenige', 'wenigen',
            'mehrere', 'mehreren', 'etliche', 'etlichen',
            
            # Allgemeine Adjektive und Adverbien
            'nur', 'noch', 'auch', 'sehr', 'mehr', 'weniger', 'gut', 'schlecht', 'besser',
            'schlechter', 'beste', 'schlechteste', 'groß', 'klein', 'größer', 'kleiner',
            'neu', 'alt', 'jung', 'so', 'dann', 'dort', 'hier', 'da', 'heute', 'gestern',
            'morgen', 'immer', 'oft', 'manchmal', 'selten', 'ganz', 'halb', 'teil',
            
            # Relativpronomen und Fragewörter
            'dass', 'ob', 'wer', 'was', 'wo', 'wann', 'warum', 'weshalb', 'wieso', 'wohin',
            'woher', 'womit', 'wofür', 'worüber', 'wodurch',
            
            # Häufige Füllwörter und nicht-arbeitsspezifische Begriffe
            'eben', 'halt', 'eigentlich', 'irgendwie', 'sozusagen', 'quasi', 'praktisch',
            'echt', 'wirklich', 'ziemlich', 'eher', 'etwa', 'ungefähr', 'circa',
            'bzw', 'usw', 'etc', 'inkl', 'ggf', 'evtl',
            
            # Zeitbezogene Allgemeinbegriffe (nicht-spezifisch)
            'mal', 'schon', 'erst', 'nun', 'jetzt', 'gerade', 'bereits', 'bald',
            
            # Sonstige häufige nicht-relevante Wörter
            'gibt', 'geben', 'machen', 'macht', 'gemacht', 'tun', 'tut', 'getan',
            'lassen', 'lässt', 'ließ', 'gelassen', 'sagen', 'sagt', 'sagte', 'gesagt',
            'gehen', 'geht', 'ging', 'gegangen', 'kommen', 'kommt', 'kam', 'gekommen',
            'sehen', 'sieht', 'sah', 'gesehen', 'finden', 'findet', 'fand', 'gefunden',
            'denken', 'denkt', 'dachte', 'gedacht', 'wissen', 'weiß', 'wusste', 'gewusst',
            'nehmen', 'nimmt', 'nahm', 'genommen', 'geben', 'gibt', 'gab', 'gegeben',
            
            # Zusätzliche arbeitsfremde Begriffe
            'liegen', 'stehen', 'sitzen', 'etwas', 'nichts', 'alles', 'manches',
            'beide', 'beides', 'anderen', 'andere', 'anderer', 'weiteren', 'weitere',
            'vieles', 'weniges', 'meisten', 'meist', 'zwar', 'doch', 'jedoch', 'dennoch',
        ])
        
        # Domain-spezifische Stopwords (nicht arbeitsrelevante Begriffe)
        self.domain_stopwords = set([
            # Allgemeine Verben ohne Arbeitskontext
            'gehen', 'kommen', 'sein', 'haben', 'werden', 'machen', 'sehen', 'lassen',
            'stehen', 'liegen', 'sitzen', 'laufen', 'fahren', 'fliegen', 'essen', 'trinken',
            
            # Zu allgemeine Begriffe
            'ding', 'dinge', 'sache', 'sachen', 'fall', 'fälle', 'mal', 'zeit', 'tag', 'tage',
            'jahr', 'jahre', 'monat', 'monate', 'woche', 'wochen', 'stunde', 'stunden',
            'minute', 'minuten', 'moment', 'momente',
            
            # Zu generische Beschreibungen
            'art', 'weise', 'form', 'grund', 'gründe', 'zweck', 'ziel', 'ende', 'anfang',
            'mitte', 'teil', 'teile', 'seite', 'seiten', 'punkt', 'punkte',
            
            # Nicht-spezifische Personenbegriffe
            'mensch', 'menschen', 'person', 'personen', 'leute', 'mann', 'männer',
            'frau', 'frauen', 'kind', 'kinder', 'name', 'namen',
            
            # Zusätzliche problematische Begriffe aus Tests
            'man', 'viel', 'viele', 'vielen', 'wenig', 'wenige', 'wenigen',
            'dabei', 'damit', 'dadurch', 'dafür', 'dagegen', 'darauf', 'darin',
            'oben', 'unten', 'innen', 'außen', 'vorne', 'hinten', 'links', 'rechts',
            'zur', 'zum', 'beim', 'vom', 'zur', 'ans', 'ins', 'durchs', 'fürs',
            'habe', 'hatte', 'gehabt', 'bin', 'bist', 'war', 'warst', 'gewesen',
            'einfach', 'einfache', 'einfachen', 'einfacher', 'einfaches',
            'nett', 'nette', 'netten', 'netter', 'nettes',
            'okay', 'ok', 'super', 'toll', 'prima', 'klasse',
            'leider', 'bestimmt', 'sicher', 'wahrscheinlich', 'vielleicht',
            'meine', 'meinen', 'meiner', 'meines', 'deine', 'deinen', 'seiner', 'ihrer',
            'zwischen', 'neuen', 'neue', 'neuer', 'neues', 'alten', 'alte', 'alter', 'altes',
            'sondern', 'anstatt', 'statt', 'anstelle',
            'fuer', 'ueber', 'durch', 'ohne', 'gegen', 'seit', 'waehrend',
            'einer', 'eines', 'einem', 'denen', 'dessen', 'deren',
            'student', 'studenten',  # Zu allgemein, nicht arbeitsspezifisch
        ])
        
        # Alle Stopwords kombinieren
        self.all_stopwords = self.german_stopwords.union(self.domain_stopwords)
        
        # Bewertungskriterien aus der Datenbank (wichtige Arbeitsbegriffe)
        # Diese Begriffe sollen NICHT gefiltert werden, da sie zentrale Arbeitsthemen sind
        rating_keywords = self.get_rating_criteria_keywords()
        
        self.work_related_keywords = set([
            # Employee Bewertungskriterien
            'arbeitsatmosphäre', 'atmosphäre', 'betriebsklima', 'klima',
            'image', 'ruf', 'reputation', 'ansehen',
            'work_life_balance', 'worklifebalance', 'balance', 'work', 'life',
            'karriere', 'weiterbildung', 'entwicklung', 'aufstieg', 'aufstiegsmöglichkeiten',
            'gehalt', 'sozialleistungen', 'vergütung', 'bezahlung', 'lohn', 'entlohnung',
            'kollegenzusammenhalt', 'kollegen', 'zusammenhalt', 'team', 'teamwork',
            'umwelt', 'sozialbewusstsein', 'nachhaltigkeit', 'sozial',
            'vorgesetztenverhalten', 'vorgesetzter', 'vorgesetzte', 'führung', 'leitung', 'management',
            'kommunikation', 'information', 'austausch', 'feedback',
            'aufgaben', 'tätigkeiten', 'arbeit', 'arbeitsinhalt',
            'umgang', 'kollegen', 'älteren', 'aelteren',
            'arbeitsbedingungen', 'bedingungen', 'arbeitsumfeld', 'umfeld',
            'gleichberechtigung', 'fairness', 'gerechtigkeit', 'chancengleichheit',
            
            # Candidate Bewertungskriterien
            'schritte', 'prozess', 'ablauf', 'verfahren',
            'reaktion', 'rückmeldung', 'antwort', 'response',
            'vollständigkeit', 'vollstaendigkeit', 'informationen', 'infos',
            'antworten', 'erklärungen', 'erklaerungen',
            'atmosphäre', 'atmosphaere', 'stimmung',
            'professionalität', 'professionalitaet', 'professionell',
            'wertschätzung', 'wertschaetzung', 'respekt', 'behandlung',
            'erwartbarkeit', 'transparenz', 'klarheit',
            'zeitgerecht', 'pünktlich', 'puenktlich', 'zeitnah',
            'zusage', 'absage', 'rückmeldung', 'rueckmeldung',
            'schnell', 'schnelle', 'zügig', 'zuegig',
            
            # Zusätzliche wichtige Arbeitsbegriffe
            'homeoffice', 'remote', 'mobil', 'flexibel', 'flexible', 'flexibilität',
            'arbeitszeit', 'arbeitszeiten', 'gleitzeit', 'teilzeit', 'vollzeit',
            'urlaub', 'freizeit', 'erholung', 'pause', 'pausen',
            'projekt', 'projekte', 'aufgabe', 'aufgaben', 'verantwortung',
            'weiterbildung', 'schulung', 'training', 'fortbildung',
            'gehalt', 'bonus', 'prämie', 'praemie', 'benefits',
            'kultur', 'unternehmenskultur', 'werte', 'vision',
            'hierarchie', 'struktur', 'organisation', 'firma', 'unternehmen',
            'bewerbung', 'interview', 'gespräch', 'gespraech', 'vorstellung',
            'mitarbeiter', 'arbeitnehmer', 'arbeitgeber', 'angestellte',
            'stelle', 'position', 'job', 'beschäftigung', 'anstellung',
        ])
        
        # Füge die automatisch extrahierten Bewertungskriterien hinzu
        self.work_related_keywords.update(rating_keywords)
    
    def preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text using Gensim preprocessing utilities.
        Optimized for work-related topics with emphasis on rating criteria.
        
        Args:
            text: Input text to preprocess
            
        Returns:
            List of preprocessed tokens
        """
        if not text or not isinstance(text, str):
            return []
        
        # Text zu Kleinbuchstaben
        text = text.lower()
        
        # Normalisiere Umlaute für konsistente Begriffe
        text = text.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
        
        # Ersetze häufige Abkürzungen und Synonyme für konsistente Terms
        text = re.sub(r'\bma\b|\bm\.a\.\b', 'mitarbeiter', text)
        text = re.sub(r'\bag\b', 'arbeitgeber', text)
        text = re.sub(r'\ban\b', 'arbeitnehmer', text)
        text = re.sub(r'\bgf\b', 'geschaeftsfuehrung', text)
        text = re.sub(r'\bvl\b', 'vorgesetzter', text)
        text = re.sub(r'\bwlb\b', 'work_life_balance', text)
        text = re.sub(r'\bho\b', 'homeoffice', text)
        text = re.sub(r'\bhome.?office\b', 'homeoffice', text)
        
        # Normalisiere Bewertungskriterien zu konsistenten Begriffen
        text = re.sub(r'work.?life.?balance', 'work_life_balance', text)
        text = re.sub(r'arbeits.?atmosphaere|betriebsklima', 'arbeitsatmosphaere', text)
        text = re.sub(r'kollegenzusammenhalt|team.?work', 'teamzusammenhalt', text)
        text = re.sub(r'vorgesetztenverhalten|fuehrungskraft', 'fuehrungsverhalten', text)
        text = re.sub(r'gehalt.*sozialleistungen|verguetung', 'verguetung', text)
        text = re.sub(r'karriere.*weiterbildung|entwicklung', 'karriereentwicklung', text)
        text = re.sub(r'umwelt.*sozial|nachhaltigkeit', 'nachhaltigkeit', text)
        text = re.sub(r'arbeits.?bedingungen', 'arbeitsbedingungen', text)
        text = re.sub(r'umgang.*aelteren', 'umgang_aeltere', text)
        
        # Basic preprocessing
        custom_filters = [
            strip_punctuation,
            strip_numeric,
            remove_stopwords,
            strip_short,
        ]
        
        tokens = preprocess_string(text, custom_filters)
        
        # Entferne Stopwords, aber behalte arbeitsrelevante Keywords
        tokens = [
            token for token in tokens 
            if token not in self.all_stopwords or token in self.work_related_keywords
        ]
        
        # Filtere sehr kurze Tokens (< 3 Zeichen), außer wichtige Keywords
        tokens = [
            token for token in tokens 
            if len(token) >= 3 or token in self.work_related_keywords
        ]
        
        # Filtere Tokens die nur aus Sonderzeichen oder Zahlen bestehen
        tokens = [token for token in tokens if re.search(r'[a-z]', token)]
        
        # Filtere weitere unerwünschte Tokens, außer sie sind wichtige Keywords
        exclude_tokens = {'aus', 'amp', 'fast', 'abs', 'bzw', 'zzgl', 'inkl', 'ggf', 'evtl', 
                         'usw', 'etc', 'inkl', 'exkl', 'bzw', 'ggfs', 'bzw', 'uvm',
                         'fuer', 'ueber', 'durch', 'ohne', 'gegen', 'seit', 'waehrend',
                         'einer', 'eines', 'einem', 'denen', 'dessen', 'deren'}
        tokens = [
            token for token in tokens 
            if token not in exclude_tokens or token in self.work_related_keywords
        ]
        
        return tokens
    
    def prepare_documents(self, texts: List[str]) -> Tuple[corpora.Dictionary, List[List[Tuple[int, int]]]]:
        """
        Prepare documents for LDA training with bigram/trigram support.
        
        Args:
            texts: List of text documents
            
        Returns:
            Tuple of (dictionary, corpus)
        """
        # Preprocess all texts
        self.documents = [self.preprocess_text(text) for text in texts]
        
        # Filter out empty documents
        self.documents = [doc for doc in self.documents if doc]
        
        if not self.documents:
            raise ValueError("No valid documents found after preprocessing")
        
        # Build bigram model (z.B. "work_life", "home_office")
        bigram = Phrases(self.documents, min_count=3, threshold=10, delimiter='_')
        self.bigram_model = bigram
        
        # Apply bigrams
        bigram_docs = [bigram[doc] for doc in self.documents]
        
        # Build trigram model (z.B. "work_life_balance")
        trigram = Phrases(bigram_docs, min_count=2, threshold=10, delimiter='_')
        self.trigram_model = trigram
        
        # Apply trigrams
        self.documents = [trigram[bigram_doc] for bigram_doc in bigram_docs]
        
        # Create dictionary
        self.dictionary = corpora.Dictionary(self.documents)
        
        # Filter extremes:
        # - no_below: remove words appearing in less than 2 documents
        # - no_above: remove words appearing in more than 60% of documents (zu allgemein)
        # - keep_n: keep only the most frequent 2000 terms
        self.dictionary.filter_extremes(no_below=2, no_above=0.6, keep_n=2000)
        
        # Create corpus (bag of words)
        self.corpus = [self.dictionary.doc2bow(doc) for doc in self.documents]
        
        return self.dictionary, self.corpus
    
    def train_model(self, texts: List[str]) -> Dict[str, Any]:
        """
        Train the LDA model on the provided texts.
        Optimized for discovering work-related topics.
        
        Args:
            texts: List of text documents to train on
            
        Returns:
            Dictionary with training results and topics
        """
        if not texts:
            raise ValueError("No texts provided for training")
        
        # Prepare documents
        self.prepare_documents(texts)
        
        # Train LDA model with optimized parameters for work topics
        self.lda_model = LdaModel(
            corpus=self.corpus,
            id2word=self.dictionary,
            num_topics=self.num_topics,
            random_state=42,
            passes=self.passes,
            iterations=self.iterations,
            per_word_topics=True,
            alpha='auto',  # Learn document-topic distribution
            eta='auto',    # Learn topic-word distribution
            minimum_probability=0.01,  # Filter low probability topics
            chunksize=100,
            update_every=1,
            eval_every=10
        )
        
        # Extract topics
        topics = self.get_topics()
        
        return {
            "status": "success",
            "num_topics": self.num_topics,
            "num_documents": len(texts),
            "vocabulary_size": len(self.dictionary),
            "topics": topics,
            "trained_at": datetime.now().isoformat()
        }
    
    def get_topics(self, num_words: int = 10) -> List[Dict[str, Any]]:
        """
        Get the discovered topics with their top words.
        
        Args:
            num_words: Number of top words to return per topic
            
        Returns:
            List of topics with their top words and weights
        """
        if not self.lda_model:
            raise ValueError("Model not trained yet")
        
        topics = []
        for topic_id in range(self.num_topics):
            topic_words = self.lda_model.show_topic(topic_id, num_words)
            topics.append({
                "topic_id": topic_id,
                "words": [
                    {"word": word, "weight": float(weight)}
                    for word, weight in topic_words
                ]
            })
        
        return topics
    
    def predict_topics(self, text: str, threshold: float = 0.1, include_sentiment: bool = False) -> List[Dict[str, Any]]:
        """
        Predict topics for a given text.
        
        Args:
            text: Input text to analyze
            threshold: Minimum probability threshold for topics
            include_sentiment: Whether to include sentiment analysis
            
        Returns:
            List of topics with probabilities and optionally sentiment
        """
        if not self.lda_model or not self.dictionary:
            raise ValueError("Model not trained yet")
        
        # Preprocess text
        tokens = self.preprocess_text(text)
        
        if not tokens:
            return []
        
        # Apply bigrams and trigrams if models exist
        if self.bigram_model:
            tokens = self.bigram_model[tokens]
        if self.trigram_model:
            tokens = self.trigram_model[tokens]
        
        # Convert to bag of words
        bow = self.dictionary.doc2bow(tokens)
        
        # Get topic distribution
        topic_distribution = self.lda_model.get_document_topics(bow)
        
        # Filter by threshold and format results
        results = [
            {
                "topic_id": topic_id,
                "probability": float(prob)
            }
            for topic_id, prob in topic_distribution
            if prob >= threshold
        ]
        
        # Add sentiment analysis if requested
        if include_sentiment and text:
            from models.sentiment_analyzer import SentimentAnalyzer
            sentiment_analyzer = SentimentAnalyzer()
            sentiment = sentiment_analyzer.analyze_sentiment(text)
            for result in results:
                result["sentiment"] = sentiment
        
        # Sort by probability
        results.sort(key=lambda x: x["probability"], reverse=True)
        
        return results
    
    def analyze_topics_with_sentiment(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Analyze topics and sentiment for multiple texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of analyses with topics and sentiment per text
        """
        if not self.lda_model or not self.dictionary:
            raise ValueError("Model not trained yet")
        
        from models.sentiment_analyzer import SentimentAnalyzer
        sentiment_analyzer = SentimentAnalyzer()
        
        results = []
        for idx, text in enumerate(texts):
            if not text or not text.strip():
                continue
                
            # Get topics
            topics = self.predict_topics(text, threshold=0.1)
            
            # Get sentiment
            sentiment = sentiment_analyzer.analyze_sentiment(text)
            
            results.append({
                "text_index": idx,
                "text_preview": text[:100] + "..." if len(text) > 100 else text,
                "topics": topics,
                "sentiment": sentiment,
                "dominant_topic": topics[0]["topic_id"] if topics else None,
                "dominant_topic_probability": topics[0]["probability"] if topics else 0.0
            })
        
        return results
    
    def save_model(self, model_dir: str = "models/saved_models") -> str:
        """
        Save the trained model to disk including bigram/trigram models.
        
        Args:
            model_dir: Directory to save the model (default: models/saved_models)
            
        Returns:
            Path to the saved model
        """
        if not self.lda_model:
            raise ValueError("No model to save")
        
        os.makedirs(model_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_path = os.path.join(model_dir, f"lda_model_{timestamp}")
        
        # Save LDA model
        self.lda_model.save(f"{model_path}.model")
        
        # Save dictionary
        self.dictionary.save(f"{model_path}.dict")
        
        # Save bigram and trigram models if they exist
        if self.bigram_model:
            with open(f"{model_path}.bigram", "wb") as f:
                pickle.dump(self.bigram_model, f)
        
        if self.trigram_model:
            with open(f"{model_path}.trigram", "wb") as f:
                pickle.dump(self.trigram_model, f)
        
        # Save metadata
        metadata = {
            "num_topics": self.num_topics,
            "passes": self.passes,
            "iterations": self.iterations,
            "vocabulary_size": len(self.dictionary),
            "num_documents": len(self.documents),
            "has_bigrams": self.bigram_model is not None,
            "has_trigrams": self.trigram_model is not None,
            "trained_at": timestamp
        }
        
        with open(f"{model_path}.meta", "wb") as f:
            pickle.dump(metadata, f)
        
        return model_path
    
    def load_model(self, model_path: str) -> Dict[str, Any]:
        """
        Load a previously trained model from disk including bigram/trigram models.
        
        Args:
            model_path: Path to the saved model (without extension)
            
        Returns:
            Metadata about the loaded model
        """
        # Load LDA model
        self.lda_model = LdaModel.load(f"{model_path}.model")
        
        # Load dictionary
        self.dictionary = corpora.Dictionary.load(f"{model_path}.dict")
        
        # Load bigram model if exists
        bigram_path = f"{model_path}.bigram"
        if os.path.exists(bigram_path):
            with open(bigram_path, "rb") as f:
                self.bigram_model = pickle.load(f)
        
        # Load trigram model if exists
        trigram_path = f"{model_path}.trigram"
        if os.path.exists(trigram_path):
            with open(trigram_path, "rb") as f:
                self.trigram_model = pickle.load(f)
        
        # Load metadata
        with open(f"{model_path}.meta", "rb") as f:
            metadata = pickle.load(f)
        
        self.num_topics = metadata["num_topics"]
        self.passes = metadata["passes"]
        self.iterations = metadata["iterations"]
        
        return metadata
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model.
        
        Returns:
            Dictionary with model information
        """
        if not self.lda_model:
            return {"status": "not_trained", "message": "Model not trained yet"}
        
        return {
            "status": "trained",
            "num_topics": self.num_topics,
            "vocabulary_size": len(self.dictionary) if self.dictionary else 0,
            "num_documents": len(self.documents),
            "passes": self.passes,
            "iterations": self.iterations
        }
