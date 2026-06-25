import instructor
from groq import Groq

_ai_client = None

def get_ai_client():
    global _ai_client
    if _ai_client is None:
        _ai_client = instructor.from_groq(Groq(), mode=instructor.Mode.JSON)
    return _ai_client