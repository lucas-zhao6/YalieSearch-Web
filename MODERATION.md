# Content Moderation System

Yalie Search uses AI-powered content moderation to ensure queries remain appropriate and respectful while allowing playful, college-appropriate searches.

## How It Works

The system uses **GPT-4o-mini** to classify each search query as either ALLOW or BLOCK based on context and intent.

### What's Allowed ✅

**Physical Descriptions:**
- "most attractive person", "sexiest girl/guy", "person with curly red hair"
- "tall athletic build", "person with glasses", "best dressed"

**Celebrity Lookalikes:**
- "looks like Timothée Chalamet", "Zendaya doppelganger"
- "looks like Donald Trump", "Bernie Sanders lookalike"
- Political/historical figures (except criminal figures like Hitler)

**Personality/Vibes:**
- "person who gives warm hugs", "looks approachable"
- "main character energy", "looks like they're always laughing"

**Fun Superlatives:**
- "most likely to be president", "future Supreme Court justice"
- "person who looks like they live in the library"
- "most school spirit", "next unicorn founder"

### What's Blocked ❌

**Derogatory Appearance:**
- "ugliest person", "weird looking", body shaming terms

**Sexual/Explicit:**
- "sluttiest", "most promiscuous", crude sexual terms
- (Note: "attractive" and "sexy" are OK, but explicit terms are not)

**Disability Mocking:**
- "most autistic" (as insult), "looks neurodivergent" (derogatory)
- "retarded", "dumbest looking"

**Animal Comparisons:**
- "looks like a dog/pig/rat" or any animal comparison

**Criminal Implications:**
- "school shooter vibes", "looks like a drug dealer"
- "most likely to commit a crime"

**Racial Slurs/Stereotypes:**
- Any racial slurs or negative ethnic stereotypes

**Criminal Celebrity Comparisons:**
- "looks like Jeffrey Epstein", "Harvey Weinstein lookalike"
- "looks like Hitler"

## Technical Details

### API

**Model:** GPT-4o-mini  
**Cost:** ~$0.0001 per query (~10,000 queries = $1)  
**Response Time:** <500ms  
**Failure Mode:** Fail-open (allows query if moderation service is down)

### Development Mode

For local testing, moderation can be disabled:

```bash
# backend/.env
DISABLE_MODERATION=true
```

This bypasses all content checks during development.

### Production Setup

1. Get OpenAI API key: https://platform.openai.com/api-keys
2. Add to Railway environment variables:
   ```
   OPENAI_API_KEY=your-key-here
   DISABLE_MODERATION=false
   ```

### Error Handling

When a query is blocked, users see:
> "Query not allowed: [reason from AI]"

The AI provides context-appropriate explanations like:
- "This query contains derogatory language"
- "Animal comparisons are not allowed"
- "This query could be harmful or offensive"

## Privacy

- Queries sent to OpenAI for moderation are not stored by OpenAI (zero retention)
- No user data or search results are sent, only the text query
- Moderation happens before the actual search

## Customization

To adjust moderation rules, edit the `MODERATION_PROMPT` in `backend/moderation.py`.

The system is designed to be lenient with playful college queries while blocking genuinely harmful content.

