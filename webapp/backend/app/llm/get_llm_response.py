import ollama


def generate_response(prompt: str, llm: str) -> str:
    """Generate response from the LLM model."""
    try:
        response = ollama.generate(model=llm, prompt=prompt)
        return response["response"].strip()
    except Exception as e:
        return f"An error occurred while generating the response: {str(e)}"


def translate_message_based_llm(message: str) -> str:
    """Translate message to English using the LLM model."""
    try:
        prompt = f"""Translate the following message to English:
        MESAGE: "{message}"

        Output only the translated message.
        If message is already in English, output the original message.
        """
        response = ollama.generate(model="gemma2:2b", prompt=prompt)
        return response["response"].strip()
    except Exception as e:
        return f"An error occurred while translating the message: {str(e)}"