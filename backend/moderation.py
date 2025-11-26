"""
Content Moderation Module
Uses GPT-4o-mini to classify search queries as appropriate or harmful
"""

import os
import json
from typing import Dict
from openai import OpenAI

# Configuration
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
DISABLE_MODERATION = os.environ.get("DISABLE_MODERATION", "false").lower() == "true"

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

MODERATION_PROMPT = """
You are a content moderator for a college face search app at Yale University. 
Classify search queries as ALLOW or BLOCK based on whether they are appropriate for a college social context.

ALLOW - Playful, fun, and appropriate queries:

Physical Appearance (positive or neutral):
- Attractiveness: "most attractive person", "sexiest girl/guy", "hottest person on campus", "prettiest eyes"
- Descriptive: "tall athletic build", "curly red hair", "person with glasses", "big smile"
- Style: "best dressed", "coolest style", "person who looks put together"

Ethnic/Racial Descriptors (neutral, for face search - ALWAYS ALLOW):
- Simple descriptors: "asian man", "asian young man", "hispanic girl", "black guy", "white woman", "indian person"
- Skin tone: "dark skin", "light skin", "brown skin", "tan", "pale"
- Combined with other features: "asian with glasses", "black woman with curly hair", "hispanic guy tall"
- These are normal descriptive terms for finding people by appearance - ALLOW them
- ONLY block actual slurs or outdated offensive terms (see BLOCK section)

Celebrity/Character Comparisons (lookalikes):
- Attractive celebrities: "looks like Zendaya", "Timothée Chalamet doppelganger"
- Non-attractive but notable figures: "looks like Donald Trump", "Bernie Sanders lookalike", "Elon Musk twin"
- Historical/political figures: "young Abraham Lincoln", "looks like AOC"
- Fictional characters: "Harry Potter lookalike", "looks like Captain America"
- ONLY BLOCK criminal celebrities: Jeffrey Epstein, Harvey Weinstein, OJ Simpson, Hitler, Stalin, etc.

Personality/Vibe (positive):
- "person who gives warm hugs", "looks approachable", "friendly face"
- "main character energy", "looks like they're always laughing"
- "person who seems really smart", "looks artistic"

Fun Superlatives (aspirational):
- "most likely to be president", "future Supreme Court justice", "next unicorn founder"
- "person who seems like they'd help you move", "looks like a great study partner"
- "most school spirit", "future Nobel Prize winner"

Playful College-Specific:
- "person who looks like they live in the library", "definitely does crew"
- "secret society member vibes", "looks like they're in an a cappella group"
- "person who always has the best party stories"

BLOCK - Harmful, derogatory, or inappropriate queries:

Derogatory Appearance:
- "ugliest person", "most unattractive", "weird looking", "grossest"
- "fattest", "skinniest" (body shaming)

Sexual/Explicit (beyond simple attractiveness):
- "sluttiest", "most promiscuous", "easiest hookup", "DTF"
- Explicit sexual acts or body parts in crude terms

Disability/Neurodivergence (mocking):
- "most autistic", "looks neurodivergent" (as insult)
- "most retarded", "dumbest looking", "looks brain damaged"

Animal Comparisons:
- "looks like a dog/pig/rat/monkey" or any animal comparison

Criminal/Harmful Implications:
- "most likely to commit a crime", "school shooter vibes", "looks like a drug dealer"
- "most likely to drop out", "future convict"

Racial/Ethnic (ONLY actual slurs and negative stereotypes):
- Actual racial slurs (n-word, c-word for asians, etc.)
- Negative stereotypes: "terrorist looking", "thug looking", "gang member"
- Outdated offensive terms: "oriental", "colored", "yellow skin", "redskin"
- DO NOT block neutral descriptors: "asian", "black", "white", "hispanic", "indian", "middle eastern" are ALLOWED
- Simple ethnic descriptors + appearance features are for face search and should be ALLOWED

Celebrity Criminals (comparison):
- "looks like Jeffrey Epstein", "Harvey Weinstein doppelganger", "OJ Simpson twin"
- Historical villains: "looks like Hitler", "looks like Stalin"

Context Matters:
- "hottest" → ALLOW (playful attractiveness)
- "sluttiest" → BLOCK (derogatory sexual)
- "looks like Trump" → ALLOW (public figure)
- "looks like Epstein" → BLOCK (criminal)
- "most attractive" → ALLOW (positive)
- "ugliest" → BLOCK (derogatory)
- "asian young man" → ALLOW (neutral ethnic descriptor)
- "black girl with braids" → ALLOW (neutral descriptor)
- "hispanic guy" → ALLOW (neutral descriptor)
- "yellow skin" → BLOCK (outdated offensive term)

Return your response as JSON with this format: {"decision": "ALLOW" or "BLOCK", "reason": "1-2 sentence explanation"}

Be lenient with college fun/playful queries. Block only genuinely harmful, derogatory, or dangerous content.
"""


def moderate_query(query: str) -> Dict[str, str]:
    """
    Check if a search query is appropriate.
    
    Args:
        query: The search query to moderate
        
    Returns:
        Dict with 'decision' (ALLOW/BLOCK) and 'reason'
    """
    # DEV MODE: Skip moderation
    if DISABLE_MODERATION:
        return {"decision": "ALLOW", "reason": "Moderation disabled (dev mode)"}
    
    # If no API key, allow by default (fail open)
    if not client:
        print("WARNING: No OpenAI API key configured, moderation disabled")
        return {"decision": "ALLOW", "reason": "Moderation unavailable"}
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": MODERATION_PROMPT},
                {"role": "user", "content": f'Query to moderate: "{query}"'}
            ],
            temperature=0,
            max_tokens=100,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return {
            "decision": result.get("decision", "BLOCK"),
            "reason": result.get("reason", "Content policy check")
        }
        
    except Exception as e:
        print(f"Moderation error: {e}")
        # Fail open - allow query if moderation fails
        return {"decision": "ALLOW", "reason": "Moderation check failed"}


def is_query_allowed(query: str) -> tuple[bool, str]:
    """
    Simple wrapper that returns (allowed: bool, reason: str)
    """
    result = moderate_query(query)
    is_allowed = result["decision"] == "ALLOW"
    return is_allowed, result["reason"]

