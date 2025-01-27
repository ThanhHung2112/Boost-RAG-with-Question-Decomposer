import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from urllib.parse import urljoin
import os

def fetch_and_parse(url):
    """Fetch and parse the HTML content of a URL."""
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Failed to fetch {url}. Status code: {response.status_code}")
            return None
        return BeautifulSoup(response.text, 'html.parser')
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

def crawl_and_convert(start_url, depth):
    """
    Crawl links up to a specified depth and save content as Markdown.

    Args:
        start_url (str): The initial URL to crawl
        depth (int): Maximum depth of link traversal
            - 0 means only crawl the start URL
            - 1 means crawl the start URL and its direct links
            - and so on...

    Returns:
        bool: True if at least one page with content was processed, False otherwise
    """
    # Ensure the markdown directory exists
    os.makedirs('markdown', exist_ok=True)

    visited = set()
    to_visit = [(start_url, 0)]  # (URL, current depth)
    content_found = False

    while to_visit:
        current_url, current_depth = to_visit.pop(0)

        # Stop crawling if we've exceeded the specified depth
        if current_depth > depth:
            break

        if current_url in visited:
            continue

        print(f"Crawling: {current_url}")
        visited.add(current_url)

        # Fetch and parse the content
        soup = fetch_and_parse(current_url)
        if not soup:
            continue

        # Extract relevant sections (e.g., main content)
        selectors = ['div.main-content', 'main', 'div.content', 'div#main']
        main_content = None
        for selector in selectors:
            main_content = soup.select_one(selector)
            if main_content:
                break

        # If no content found, skip this page
        if not main_content:
            print(f"No main content found for {current_url}")
            continue

        # Mark that content was found
        content_found = True

        # Convert to Markdown format
        markdown_content = md(str(main_content))

        # Save content to a file
        filename = f"markdown/output_{len(visited)}.md"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        print(f"Content saved to {filename}")

        # Only find and enqueue links if depth allows
        if current_depth < depth:
            for link in soup.find_all('a', href=True):
                full_url = urljoin(current_url, link['href'])
                if full_url not in visited:
                    to_visit.append((full_url, current_depth + 1))

    return content_found