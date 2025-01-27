import os
from langdetect import detect
from deep_translator import GoogleTranslator
from markdown_crawler import md_crawl
from helpers.text_standardize import standardize_text, remove_repeat_content
from crawler.crawl import crawl_and_convert

def split_text_intelligently(text, max_length=4000):
    """
    Split text into chunks while preserving meaningful text segments.

    Strategy:
    1. First, try to split at empty lines or paragraph breaks
    2. If that doesn't work, split at sentence boundaries
    3. As a last resort, split at the max_length

    Args:
        text (str): Input text to be split
        max_length (int): Maximum length of each chunk

    Returns:
        list: List of text chunks
    """
    # First, try splitting at paragraph breaks
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""

    for paragraph in paragraphs:
        # If adding this paragraph would exceed max length, start a new chunk
        if len(current_chunk) + len(paragraph) > max_length:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = ""

        current_chunk += paragraph + '\n\n'

    # Add the last chunk if not empty
    if current_chunk:
        chunks.append(current_chunk.strip())

    # If no chunks or chunks are still too long, use more aggressive splitting
    if not chunks or any(len(chunk) > max_length for chunk in chunks):
        # Split by sentences
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk) + len(sentence) > max_length:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""

            current_chunk += sentence + ' '

        # Add the last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())

    return chunks

def crawl_url_content(url: str, md_dir: str = "markdown") -> dict:
    """
    Crawl the content of a URL, detect language,
    translate to English if needed, and return the text content.

    Ensures that text is split into manageable chunks for translation.
    """
    try:
        os.makedirs(md_dir, exist_ok=True)
        is_content = crawl_and_convert(start_url=url, depth=0)
        if not is_content:
            md_crawl(url, max_depth=1, num_threads=20)

        full_content = ""
        for filename in os.listdir(md_dir):
            if filename.endswith(".md"):
                with open(os.path.join(md_dir, filename), "r", encoding='utf-8') as file:
                    file_content = file.read()

                    # Standardize the content first
                    standardized_content = standardize_text(file_content)

                    # Split content into manageable chunks
                    content_chunks = split_text_intelligently(standardized_content)

                    for chunk in content_chunks:
                        # Detect language
                        try:
                            detected_lang = detect(chunk)
                        except:
                            # If language detection fails, assume original language (likely non-English)
                            detected_lang = 'vi'

                        print("Detected language:", detected_lang)
                        # Translate to English if not already in English
                        if detected_lang != 'en':
                            try:
                                translated_chunk = GoogleTranslator(
                                    source=detected_lang,
                                    target='en'
                                ).translate(chunk)
                                full_content += translated_chunk + "\n\n"
                            except Exception as e:
                                # Fallback to original content if translation fails
                                print(f"Translation error: {e}")
                                full_content += chunk + "\n\n"
                        else:
                            full_content += chunk + "\n\n"

        full_content = remove_repeat_content(full_content)

        # Write full content to file
        with open(os.path.join(md_dir, "full_content.md"), "w", encoding='utf-8') as file:
            file.write(full_content)

        print("Saved full content in path", os.path.join(md_dir, "full_content.md"))
        return full_content

    except Exception as e:
        print(f"Error crawling URL content: {e}")
        return None