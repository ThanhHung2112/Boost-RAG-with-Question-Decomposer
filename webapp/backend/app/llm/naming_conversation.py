import ollama


def get_conversation_name(message):
    prompt = f"""Given the following first message:
    MESAGE:
    "{message}"

    Generate a conversation title that:
    - Is relevant to the content.
    - Is shorter than 6 words.
    - Clearly reflects the main topic.
    - Name should make sense to the reader. Do not give trashy names.

    Output only the conversation title.
    """
    response = ollama.generate(model="gemma2:2b", prompt=prompt)
    return response["response"].strip()
