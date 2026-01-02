#!/usr/bin/env python3
"""
Extract legitimate content from Golden Compasses Research Lodge HTML pages.
This script extracts text content while avoiding spam sections.
"""

from bs4 import BeautifulSoup
import html
import re
import os
import json

# Spam indicators - if content contains these, skip it
SPAM_KEYWORDS = [
    'casino', 'gambling', 'betting', 'slot', 'poker', 'roulette',
    'mostbet', 'parimatch', '1xbet', 'melbet', 'pinup',
    '포커', '카지노', '베팅', '도박',  # Korean gambling terms
    'tragamonedas', 'apuestas', 'casino',  # Spanish gambling terms
    'seo', 'backlink', 'slot algorithm logic'
]

def is_spam(text):
    """Check if text contains spam keywords"""
    text_lower = text.lower()
    for keyword in SPAM_KEYWORDS:
        if keyword in text_lower:
            return True
    return False

def extract_page_content(filepath, page_name):
    """Extract legitimate content from a page"""
    with open(filepath, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    content = {
        'page': page_name,
        'title': '',
        'banner_text': '',
        'content_sections': [],
        'footer_text': '',
        'forms': [],
        'images': [],
        'links': [],
        'youtube_embeds': []
    }
    
    # Extract page title
    title_tag = soup.find('title')
    if title_tag:
        content['title'] = title_tag.get_text().strip()
    
    # Extract banner text
    banner = soup.find('div', id='banner')
    if banner:
        h2_tags = banner.find_all('h2', class_='wsite-content-title')
        content['banner_text'] = '\n'.join([h.get_text().strip() for h in h2_tags])
    
    # Extract main content from wsite-content
    main_content = soup.find('div', id='wsite-content')
    if main_content:
        # Find all paragraphs
        paragraphs = main_content.find_all('div', class_='paragraph')
        for p in paragraphs:
            text = p.get_text().strip()
            # Skip if it's just footer content
            if 'Golden Compasses Research Lodge' in text and 'All rights reserved' in text:
                continue
            # Skip spam
            if not is_spam(text) and len(text) > 10:
                content['content_sections'].append(text)
        
        # Find all headings
        headings = main_content.find_all('h2', class_='wsite-content-title')
        for h in headings:
            text = h.get_text().strip()
            if not is_spam(text) and len(text) > 3 and text not in content['content_sections']:
                content['content_sections'].append(text)
    
    # Extract footer content
    footer = soup.find('div', id='footer')
    if footer:
        footer_text = footer.get_text().strip()
        if 'Golden Compasses' in footer_text:
            content['footer_text'] = footer_text
    
    # Extract forms
    forms = soup.find_all('form')
    for form in forms:
        form_data = {
            'action': form.get('action', ''),
            'method': form.get('method', 'POST'),
            'fields': []
        }
        # Extract form fields
        inputs = form.find_all(['input', 'textarea', 'select'])
        for inp in inputs:
            field = {
                'type': inp.get('type', inp.name),
                'name': inp.get('name', ''),
                'label': '',
                'required': inp.get('required', False) is not None
            }
            # Try to find label
            label = inp.find_previous('label')
            if label:
                field['label'] = label.get_text().strip()
            form_data['fields'].append(field)
        if form_data['fields']:
            content['forms'].append(form_data)
    
    # Extract images (only legitimate ones)
    images = soup.find_all('img')
    for img in images:
        src = img.get('src', '')
        alt = img.get('alt', '')
        # Skip spam images
        if not any(spam in src.lower() for spam in ['spam', 'bet', 'casino']):
            content['images'].append({
                'src': src,
                'alt': alt
            })
    
    # Extract YouTube embeds
    iframes = soup.find_all('iframe')
    for iframe in iframes:
        src = iframe.get('src', '')
        if 'youtube.com' in src or 'youtu.be' in src:
            content['youtube_embeds'].append(src)
    
    # Extract navigation links
    nav = soup.find('ul', class_='wsite-menu-default')
    if nav:
        links = nav.find_all('a', class_='wsite-menu-item')
        for link in links:
            href = link.get('href', '')
            text = link.get_text().strip()
            if href and not href.startswith('#'):
                content['links'].append({
                    'text': text,
                    'href': href
                })
    
    return content

def save_markdown(content, output_dir):
    """Save extracted content as markdown"""
    filename = os.path.join(output_dir, f"{content['page'].replace('-', '_')}.md")
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# {content['title']}\n\n")
        
        if content['banner_text']:
            f.write(f"## Banner\n\n{content['banner_text']}\n\n")
        
        if content['content_sections']:
            f.write("## Content\n\n")
            for section in content['content_sections']:
                f.write(f"{section}\n\n")
        
        if content['forms']:
            f.write("## Forms\n\n")
            for i, form in enumerate(content['forms'], 1):
                f.write(f"### Form {i}\n\n")
                f(f"Action: {form['action']}\n")
                f.write(f"Method: {form['method']}\n\n")
                f.write("**Fields:**\n\n")
                for field in form['fields']:
                    req = " (required)" if field['required'] else ""
                    f.write(f"- {field['name']}: {field['type']}{req}\n")
                    if field['label']:
                        f.write(f"  Label: {field['label']}\n")
                f.write("\n")
        
        if content['images']:
            f.write("## Images\n\n")
            for img in content['images']:
                f.write(f"- `{img['src']}`")
                if img['alt']:
                    f.write(f" - {img['alt']}")
                f.write("\n")
        
        if content['youtube_embeds']:
            f.write("## YouTube Videos\n\n")
            for embed in content['youtube_embeds']:
                f.write(f"- {embed}\n")
        
        if content['links']:
            f.write("## Navigation Links\n\n")
            for link in content['links']:
                f.write(f"- [{link['text']}]({link['href']})\n")
        
        if content['footer_text']:
            f.write(f"\n## Footer\n\n{content['footer_text']}\n")
    
    return filename

def main():
    pages_dir = '/Users/lawrencealtomare/Downloads/goldencompasses-content/pages'
    content_dir = '/Users/lawrencealtomare/Downloads/goldencompasses-content/content'
    
    os.makedirs(content_dir, exist_ok=True)
    
    pages = [
        ('about.html', 'about'),
        ('library.html', 'library'),
        ('members.html', 'members'),
        ('news.html', 'news'),
        ('calendar.html', 'calendar'),
        ('contact.html', 'contact'),
        ('officers.html', 'officers'),
        ('grand-master.html', 'grand-master'),
        ('links.html', 'links')
    ]
    
    summary = []
    
    for html_file, page_name in pages:
        filepath = os.path.join(pages_dir, html_file)
        if os.path.exists(filepath):
            print(f"Extracting content from {html_file}...")
            try:
                content = extract_page_content(filepath, page_name)
                
                # Save as markdown
                md_file = save_markdown(content, content_dir)
                
                # Save as JSON for machine processing
                json_file = os.path.join(content_dir, f"{page_name.replace('-', '_')}.json")
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(content, f, indent=2, ensure_ascii=False)
                
                summary.append({
                    'page': page_name,
                    'markdown': md_file,
                    'json': json_file,
                    'content_sections': len(content['content_sections']),
                    'images': len(content['images']),
                    'forms': len(content['forms']),
                    'youtube': len(content['youtube_embeds']),
                    'links': len(content['links'])
                })
                
                print(f"  ✓ Extracted {len(content['content_sections'])} content sections")
                print(f"  ✓ Found {len(content['images'])} images")
                print(f"  ✓ Found {len(content['forms'])} forms")
                
            except Exception as e:
                print(f"  ✗ Error: {e}")
    
    # Create summary index
    with open(os.path.join(content_dir, 'INDEX.md'), 'w', encoding='utf-8') as f:
        f.write("# Golden Compasses Research Lodge - Content Repository\n\n")
        f.write(f"This directory contains all legitimate content extracted from the website for recreation on Cloudflare Workers.\n\n")
        f.write("## Extracted Pages\n\n")
        
        for item in summary:
            f.write(f"### {item['page'].replace('-', ' ').title()}\n\n")
            f.write(f"- **Markdown:** `{os.path.basename(item['markdown'])}`\n")
            f.write(f"- **JSON:** `{os.path.basename(item['json'])}`\n")
            f.write(f"- **Content Sections:** {item['content_sections']}\n")
            f.write(f"- **Images:** {item['images']}\n")
            f.write(f"- **Forms:** {item['forms']}\n")
            f.write(f"- **YouTube Videos:** {item['youtube']}\n")
            f.write(f"- **Navigation Links:** {item['links']}\n\n")
    
    print(f"\n✓ Content extraction complete!")
    print(f"✓ Check {content_dir} for all extracted content")
    print(f"✓ See {content_dir}/INDEX.md for summary")

if __name__ == '__main__':
    main()
