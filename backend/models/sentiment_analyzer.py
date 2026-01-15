"""
Sentiment Analysis for German Text
Analyzes sentiment (positive, neutral, negative) of text data.
Supports both lexicon-based and transformer-based approaches.
"""

from typing import Dict, Any, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """
    Sentiment analyzer for German text supporting multiple approaches:
    - lexicon: Rule-based approach with predefined word lists (fast, no dependencies)
    - transformer: ML-based approach using German BERT models (accurate, requires transformers)
    """
    
    def __init__(self, mode: str = "lexicon"):
        """
        Initialize the sentiment analyzer.
        
        Args:
            mode: Analysis mode - either "lexicon" (default) or "transformer"
        """
        self.mode = mode
        self._transformer_pipeline = None
        self._transformer_available = False
        
        # Initialize lexicon-based components
        self._init_lexicon()
        
        # Initialize transformer if requested
        if mode == "transformer":
            try:
                self._init_transformer()
                self._transformer_available = True
            except Exception as e:
                logger.warning(
                    f"Could not initialize transformer mode: {e}. "
                    "Falling back to lexicon mode."
                )
                self.mode = "lexicon"
    
    def _init_lexicon(self):
        """Initialize lexicon-based sentiment analysis components."""
        # Positive German words
        self.positive_words = {
            'gut', 'super', 'toll', 'ausgezeichnet', 'hervorragend', 'wunderbar',
            'großartig', 'perfekt', 'prima', 'klasse', 'spitze', 'fantastisch',
            'exzellent', 'positiv', 'freundlich', 'hilfsbereit', 'nett', 'angenehm',
            'zufrieden', 'glücklich', 'erfreut', 'begeistert', 'motiviert',
            'professionell', 'kompetent', 'effizient', 'flexibel', 'modern',
            'innovativ', 'kreativ', 'dynamisch', 'fair', 'transparent', 'offen',
            'wertschätzend', 'respektvoll', 'unterstützend', 'fördernd',
            'beste', 'besten', 'besser', 'hervorragend', 'empfehlenswert',
            'liebe', 'mögen', 'gefällt', 'schätzen', 'loben', 'dankbar'
        }
        
        # Negative German words
        self.negative_words = {
            'schlecht', 'schlechtes', 'schlechte', 'mies', 'katastrophal', 
            'furchtbar', 'schrecklich', 'grausam', 'schlimm', 'übel', 'negativ',
            'unzufrieden', 'enttäuscht', 'frustriert', 'ärgerlich', 'stressig',
            'chaotisch', 'unprofessionell', 'inkompetent', 'ineffizient',
            'unfreundlich', 'unhöflich', 'respektlos', 'unfair', 'intransparent',
            'mangelhaft', 'ungenügend', 'unzureichend', 'problematisch',
            'schwierig', 'kompliziert', 'langsam', 'veraltet', 'altmodisch',
            'niedrig', 'gering', 'wenig', 'kaum', 'nicht', 'nie', 'kein',
            'fehlt', 'fehlen', 'vermissen', 'mangel', 'problem', 'probleme',
            'kritik', 'kritisch', 'beschwerde', 'ärger', 'hassen', 'hasse'
        }
        
        # Intensifiers
        self.intensifiers = {
            'sehr': 1.5,
            'extrem': 2.0,
            'total': 1.8,
            'absolut': 1.8,
            'wirklich': 1.3,
            'ziemlich': 1.2,
            'besonders': 1.5,
            'außerordentlich': 2.0,
            'unglaublich': 1.8
        }
        
        # Negations
        self.negations = {
            'nicht', 'kein', 'keine', 'keiner', 'keines', 'nie', 'niemals',
            'nimmer', 'nirgends', 'nichts', 'kaum', 'wenig'
        }
    
    def _init_transformer(self):
        """Initialize transformer-based sentiment analysis."""
        try:
            from transformers import pipeline
            logger.info("Loading German sentiment analysis model...")
            
            # Use a German BERT model fine-tuned for sentiment analysis
            # Options:
            # 1. oliverguhr/german-sentiment-bert - specialized for German sentiment
            # 2. cardiffnlp/twitter-xlm-roberta-base-sentiment - multilingual
            self._transformer_pipeline = pipeline(
                "sentiment-analysis",
                model="oliverguhr/german-sentiment-bert",
                top_k=None  # Return all label scores
            )
            logger.info("Transformer model loaded successfully")
            
        except ImportError:
            logger.error(
                "transformers library not found. "
                "Install with: pip install transformers torch"
            )
            raise ImportError(
                "Please install transformers: pip install transformers torch"
            )
        except Exception as e:
            logger.error(f"Error loading transformer model: {e}")
            raise
    
    def _analyze_with_transformer(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment using transformer model.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Sentiment analysis results
        """
        if not self._transformer_pipeline:
            raise RuntimeError("Transformer model not initialized")
        
        if not text or not isinstance(text, str) or not text.strip():
            return {
                "polarity": 0.0,
                "sentiment": "neutral",
                "subjectivity": 0.0,
                "confidence": 0.0
            }
        
        try:
            # Get predictions from model
            results = self._transformer_pipeline(text[:512])[0]  # Limit to 512 chars
            
            # Model returns: [{'label': 'positive', 'score': 0.99}, {...}]
            # Find the label with highest score
            best_result = max(results, key=lambda x: x['score'])
            label = best_result['label'].lower()
            confidence = best_result['score']
            
            # Map to our format
            sentiment_map = {
                'positive': ('positive', 1.0),
                'neutral': ('neutral', 0.0),
                'negative': ('negative', -1.0)
            }
            
            sentiment, polarity_base = sentiment_map.get(
                label, 
                ('neutral', 0.0)
            )
            
            # Polarity is scaled by confidence
            polarity = polarity_base * confidence
            
            # Subjectivity: higher confidence = more subjective
            subjectivity = confidence
            
            return {
                "polarity": float(polarity),
                "sentiment": sentiment,
                "subjectivity": float(subjectivity),
                "confidence": float(confidence),
                "raw_results": results
            }
            
        except Exception as e:
            logger.error(f"Error in transformer analysis: {e}")
            return {
                "polarity": 0.0,
                "sentiment": "neutral",
                "subjectivity": 0.0,
                "confidence": 0.0,
                "error": str(e)
            }
    
    def _analyze_with_lexicon(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment using lexicon-based approach.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Sentiment analysis results
        """
        if not text or not isinstance(text, str) or not text.strip():
            return {
                "polarity": 0.0,
                "sentiment": "neutral",
                "subjectivity": 0.0,
                "confidence": 0.0
            }
        
        try:
            # Tokenize and lowercase
            words = text.lower().split()
            
            if not words:
                return {
                    "polarity": 0.0,
                    "sentiment": "neutral",
                    "subjectivity": 0.0,
                    "confidence": 0.0
                }
            
            positive_score = 0.0
            negative_score = 0.0
            sentiment_word_count = 0
            
            # Analyze each word with context
            for i, word in enumerate(words):
                # Check for intensifier
                multiplier = 1.0
                if i > 0 and words[i-1] in self.intensifiers:
                    multiplier = self.intensifiers[words[i-1]]
                
                # Check for negation
                is_negated = False
                if i > 0 and words[i-1] in self.negations:
                    is_negated = True
                if i > 1 and words[i-2] in self.negations:
                    is_negated = True
                
                # Score the word
                if word in self.positive_words:
                    sentiment_word_count += 1
                    score = 1.0 * multiplier
                    if is_negated:
                        negative_score += score
                    else:
                        positive_score += score
                        
                elif word in self.negative_words:
                    sentiment_word_count += 1
                    score = 1.0 * multiplier
                    if is_negated:
                        positive_score += score
                    else:
                        negative_score += score
            
            # Calculate polarity
            if positive_score + negative_score > 0:
                polarity = (positive_score - negative_score) / (positive_score + negative_score)
            else:
                polarity = 0.0
            
            # Calculate subjectivity (ratio of sentiment words to total words)
            subjectivity = min(sentiment_word_count / len(words), 1.0)
            
            # Classify sentiment
            if polarity > 0.1:
                sentiment = "positive"
            elif polarity < -0.1:
                sentiment = "negative"
            else:
                sentiment = "neutral"
            
            # Calculate confidence
            confidence = min(abs(polarity) + (subjectivity * 0.5), 1.0)
            
            return {
                "polarity": float(polarity),
                "sentiment": sentiment,
                "subjectivity": float(subjectivity),
                "confidence": float(confidence)
            }
            
        except Exception as e:
            # Fallback on error
            return {
                "polarity": 0.0,
                "sentiment": "neutral",
                "subjectivity": 0.0,
                "confidence": 0.0,
                "error": str(e)
            }
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of a single text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with sentiment analysis results:
            - polarity: float between -1 (negative) and 1 (positive)
            - sentiment: 'positive', 'neutral', or 'negative'
            - subjectivity: float between 0 (objective) and 1 (subjective)
            - confidence: float representing confidence in the classification
        """
        if self.mode == "transformer" and self._transformer_available:
            return self._analyze_with_transformer(text)
        else:
            return self._analyze_with_lexicon(text)
    
    def set_mode(self, mode: str):
        """
        Switch between analysis modes.
        
        Args:
            mode: Either "lexicon" or "transformer"
        """
        if mode not in ["lexicon", "transformer"]:
            raise ValueError("Mode must be 'lexicon' or 'transformer'")
        
        if mode == "transformer" and not self._transformer_pipeline:
            try:
                self._init_transformer()
                self._transformer_available = True
            except Exception as e:
                logger.warning(
                    f"Could not initialize transformer mode: {e}. "
                    "Staying in lexicon mode."
                )
                return
        
        self.mode = mode
        logger.info(f"Switched to {mode} mode")
    
    def analyze_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Analyze sentiment for multiple texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of sentiment analysis results
        """
        return [self.analyze_sentiment(text) for text in texts]
    
    def get_sentiment_summary(self, sentiments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get summary statistics for a list of sentiment analyses.
        
        Args:
            sentiments: List of sentiment analysis results
            
        Returns:
            Summary statistics
        """
        if not sentiments:
            return {
                "count": 0,
                "avg_polarity": 0.0,
                "avg_subjectivity": 0.0,
                "positive_count": 0,
                "neutral_count": 0,
                "negative_count": 0,
                "positive_percentage": 0.0,
                "neutral_percentage": 0.0,
                "negative_percentage": 0.0
            }
        
        count = len(sentiments)
        avg_polarity = sum(s["polarity"] for s in sentiments) / count
        avg_subjectivity = sum(s["subjectivity"] for s in sentiments) / count
        
        positive_count = sum(1 for s in sentiments if s["sentiment"] == "positive")
        neutral_count = sum(1 for s in sentiments if s["sentiment"] == "neutral")
        negative_count = sum(1 for s in sentiments if s["sentiment"] == "negative")
        
        return {
            "count": count,
            "avg_polarity": float(avg_polarity),
            "avg_subjectivity": float(avg_subjectivity),
            "positive_count": positive_count,
            "neutral_count": neutral_count,
            "negative_count": negative_count,
            "positive_percentage": float(positive_count / count * 100),
            "neutral_percentage": float(neutral_count / count * 100),
            "negative_percentage": float(negative_count / count * 100)
        }
    
    def categorize_by_sentiment(
        self, 
        items: List[Dict[str, Any]], 
        sentiment_key: str = "sentiment_analysis"
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Categorize items by their sentiment.
        
        Args:
            items: List of items with sentiment analysis
            sentiment_key: Key in items that contains sentiment analysis
            
        Returns:
            Dictionary with items grouped by sentiment
        """
        categorized = {
            "positive": [],
            "neutral": [],
            "negative": []
        }
        
        for item in items:
            sentiment = item.get(sentiment_key, {}).get("sentiment", "neutral")
            categorized[sentiment].append(item)
        
        return categorized
