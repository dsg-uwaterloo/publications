import json
import math
from typing import List, Dict
import html

def read_bibtex_json(file_path: str) -> List[Dict]:
    """Read BibTeX entries from a JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_html_entry(entry: Dict) -> str:
    """Generate HTML representation of a single BibTeX entry."""
    html_entry = f"<div class='publication {entry.get('type', 'unknown')}'>"
    
    # Title
    html_entry += f"<h3>{html.escape(entry.get('title', 'Untitled'))}</h3>"
    
    # Authors
    if 'authors' in entry:
        html_entry += f"<p class='authors'>{html.escape(', '.join(entry['authors']))}</p>"
    
    # Additional details
    details = []
    if 'year' in entry:
        details.append(f"Year: {entry['year']}")
    if 'venue' in entry:
        details.append(f"Venue: {html.escape(entry['venue'])}")
    if 'type' in entry:
        details.append(f"Type: {html.escape(entry['type'])}")
    
    if details:
        html_entry += f"<p class='details'>{' | '.join(details)}</p>"
    
    # DOI/URL if available
    if 'doi' in entry:
        html_entry += f"<a href='https://doi.org/{html.escape(entry['doi'])}'>DOI Link</a>"
    
    html_entry += "</div>"
    return html_entry

def generate_pagination_html(total_entries: int, current_page: int, entries_per_page: int) -> str:
    """Generate HTML pagination links."""
    total_pages = math.ceil(total_entries / entries_per_page)
    
    pagination_html = "<div class='pagination'>"
    for page in range(1, total_pages + 1):
        if page == current_page:
            pagination_html += f"<strong>{page}</strong>"
        else:
            pagination_html += f"<a href='publications_{page}.html'>{page}</a>"
    pagination_html += "</div>"
    
    return pagination_html

def generate_paginated_html(publications: List[Dict], entries_per_page: int = 100):
    """Generate paginated HTML files for publications."""
    total_entries = len(publications)
    total_pages = math.ceil(total_entries / entries_per_page)
    
    for page in range(1, total_pages + 1):
        start_index = (page - 1) * entries_per_page
        end_index = start_index + entries_per_page
        page_entries = publications[start_index:end_index]
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Publications - Page {page}</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }}
        .publication {{ margin-bottom: 20px; border-bottom: 1px solid #eee; }}
        .pagination {{ text-align: center; margin-top: 20px; }}
        .pagination a, .pagination strong {{ margin: 0 5px; }}
        .pagination strong {{ color: red; }}
    </style>
</head>
<body>
    <h1>Publications (Page {page} of {total_pages})</h1>
    {chr(10).join(generate_html_entry(entry) for entry in page_entries)}
    {generate_pagination_html(total_entries, page, entries_per_page)}
</body>
</html>
        """
        
        with open(f'publications_{page}.html', 'w', encoding='utf-8') as f:
            f.write(html_content)

def main(json_file_path: str):
    """Main function to process BibTeX JSON and generate HTML pages."""
    publications = read_bibtex_json(json_file_path)
    generate_paginated_html(publications)

if __name__ == '__main__':
    main('publications.json')
