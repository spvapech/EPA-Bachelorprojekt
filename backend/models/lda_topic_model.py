"""
LDA Topic Model Implementation using Gensim
Analyzes text data from candidates and employees to discover topics.
"""

from gensim import corpora
from gensim.models import LdaModel
from gensim.parsing.preprocessing import (
    preprocess_string,
    strip_punctuation,
    strip_numeric,
    remove_stopwords,
    strip_short,
    stem_text
)
from typing import List, Dict, Any, Tuple
import pickle
import os
from datetime import datetime


class LDATopicAnalyzer:
    """
    LDA Topic Model for analyzing candidate and employee feedback.
    """
    
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
        
        # German stopwords (basic set)
        self.german_stopwords = set([
            'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'eines', 'einem', 'einen',
            'und', 'oder', 'aber', 'wenn', 'als', 'wie', 'bei', 'nach', 'von', 'zu', 'mit',
            'auf', 'für', 'an', 'am', 'im', 'um', 'ist', 'sind', 'war', 'waren', 'sein',
            'haben', 'hat', 'hatte', 'werden', 'wird', 'wurde', 'worden', 'können', 'kann',
            'könnte', 'müssen', 'muss', 'sollen', 'soll', 'wollen', 'will', 'dürfen', 'darf',
            'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'mir', 'sich', 'dass',
            'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes', 'welcher', 'welche', 'welches',
            'nicht', 'nur', 'noch', 'auch', 'sehr', 'mehr', 'weniger', 'gut', 'schlecht',
            'keine', 'kein', 'keines', 'keinem', 'keinen', 'alle', 'alles', 'allem', 'allen'
        ])
    
    def preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text using Gensim preprocessing utilities.
        
        Args:
            text: Input text to preprocess
            
        Returns:
            List of preprocessed tokens
        """
        if not text or not isinstance(text, str):
            return []
        
        # Basic preprocessing
        custom_filters = [
            lambda x: x.lower(),
            strip_punctuation,
            strip_numeric,
            remove_stopwords,
            strip_short,
        ]
        
        tokens = preprocess_string(text, custom_filters)
        
        # Remove German stopwords
        tokens = [token for token in tokens if token not in self.german_stopwords]
        
        # Filter out very short tokens
        tokens = [token for token in tokens if len(token) >= 3]
        
        return tokens
    
    def prepare_documents(self, texts: List[str]) -> Tuple[corpora.Dictionary, List[List[Tuple[int, int]]]]:
        """
        Prepare documents for LDA training.
        
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
        
        # Create dictionary
        self.dictionary = corpora.Dictionary(self.documents)
        
        # Filter extremes (remove words that appear in less than 2 documents or more than 50% of documents)
        self.dictionary.filter_extremes(no_below=2, no_above=0.5)
        
        # Create corpus (bag of words)
        self.corpus = [self.dictionary.doc2bow(doc) for doc in self.documents]
        
        return self.dictionary, self.corpus
    
    def train_model(self, texts: List[str]) -> Dict[str, Any]:
        """
        Train the LDA model on the provided texts.
        
        Args:
            texts: List of text documents to train on
            
        Returns:
            Dictionary with training results and topics
        """
        if not texts:
            raise ValueError("No texts provided for training")
        
        # Prepare documents
        self.prepare_documents(texts)
        
        # Train LDA model
        self.lda_model = LdaModel(
            corpus=self.corpus,
            id2word=self.dictionary,
            num_topics=self.num_topics,
            random_state=42,
            passes=self.passes,
            iterations=self.iterations,
            per_word_topics=True
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
    
    def predict_topics(self, text: str, threshold: float = 0.1) -> List[Dict[str, Any]]:
        """
        Predict topics for a given text.
        
        Args:
            text: Input text to analyze
            threshold: Minimum probability threshold for topics
            
        Returns:
            List of topics with probabilities
        """
        if not self.lda_model or not self.dictionary:
            raise ValueError("Model not trained yet")
        
        # Preprocess text
        tokens = self.preprocess_text(text)
        
        if not tokens:
            return []
        
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
        
        # Sort by probability
        results.sort(key=lambda x: x["probability"], reverse=True)
        
        return results
    
    def save_model(self, model_dir: str = "models") -> str:
        """
        Save the trained model to disk.
        
        Args:
            model_dir: Directory to save the model
            
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
        
        # Save metadata
        metadata = {
            "num_topics": self.num_topics,
            "passes": self.passes,
            "iterations": self.iterations,
            "vocabulary_size": len(self.dictionary),
            "num_documents": len(self.documents),
            "trained_at": timestamp
        }
        
        with open(f"{model_path}.meta", "wb") as f:
            pickle.dump(metadata, f)
        
        return model_path
    
    def load_model(self, model_path: str) -> Dict[str, Any]:
        """
        Load a previously trained model from disk.
        
        Args:
            model_path: Path to the saved model (without extension)
            
        Returns:
            Metadata about the loaded model
        """
        # Load LDA model
        self.lda_model = LdaModel.load(f"{model_path}.model")
        
        # Load dictionary
        self.dictionary = corpora.Dictionary.load(f"{model_path}.dict")
        
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
