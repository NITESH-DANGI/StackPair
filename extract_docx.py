import zipfile
import xml.etree.ElementTree as ET

z = zipfile.ZipFile('StackPair_LandingPage_PRD.docx')
tree = ET.parse(z.open('word/document.xml'))
ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

lines = []
for p in tree.iter('{%s}p' % ns):
    texts = [t.text or '' for t in p.iter('{%s}t' % ns)]
    line = ''.join(texts)
    if line.strip():
        lines.append(line)

with open('landing_prd_text.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Done: {len(lines)} lines extracted')
