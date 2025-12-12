from supabase import create_client, Client
from config import get_settings

# Global Supabase client instance
_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Get or create the Supabase client instance (singleton pattern).
    
    Returns:
        Client: Initialized Supabase client
        
    Raises:
        ValueError: If Supabase configuration is invalid
    """
    global _supabase_client
    
    if _supabase_client is None:
        settings = get_settings()
        try:
            _supabase_client = create_client(
                settings.supabase_url,
                settings.supabase_key
            )
        except Exception as e:
            raise ValueError(f"Failed to initialize Supabase client: {str(e)}")
    
    return _supabase_client

