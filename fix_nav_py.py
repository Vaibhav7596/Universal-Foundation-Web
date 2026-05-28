import os
import glob

files = ['index.html', 'about.html', 'work.html', 'events.html', 'blog.html', 'blog-post.html', 'contact.html', 'donate.html']
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    content = content.replace('\\n    <a href="donate.html"', '\n    <a href="donate.html"')
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print("Done")
