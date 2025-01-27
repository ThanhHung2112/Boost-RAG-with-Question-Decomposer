import re
import json
from fastapi.responses import JSONResponse

def standardize_text(text: str) -> str:
  try:
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text)  # Remove URLs
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)


def remove_repeat_content(text: str) -> str:
  """Remove repeated content in a text."""
  lines = text.split('\n')
  seen = set()
  unique_lines = []

  for line in lines:
    if line not in seen:
      unique_lines.append(line)
      seen.add(line)

  return '\n'.join(unique_lines)

def format_conversation(chatID):
    # Open and load the JSON file
    with open(f"./app/json/history_{chatID}.json", "r") as file:
        history = json.load(file)

    # Take the last 10 entries from the history
    last_entries = list(history.items())[-20:]

    # Initialize an empty string for formatted conversation
    history_conversation = ""

    # Iterate over the last 10 entries to format the conversation
    for datetime, message_data in last_entries:
        if "user" in message_data:
            history_conversation += f"user: {message_data['user']}\n"
        if "bot" in message_data:
            history_conversation += f"bot: {message_data['bot']}\n"

    return history_conversation

def remove_duplicate_contexts(contexts):
    """
    Remove duplicate context sections while preserving order.

    Args:
        contexts (list): List of context sections

    Returns:
        list: Unique context sections
    """
    seen = set()
    unique_contexts = []
    for context in contexts:
        if context not in seen:
            unique_contexts.append(context)
            seen.add(context)
    return unique_contexts