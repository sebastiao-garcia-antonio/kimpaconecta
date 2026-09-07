import zipfile
import xml.etree.ElementTree as ET

def docx_to_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespace for Word XML
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Find all text elements
            texts = []
            for p in root.findall('.//w:p', ns):
                p_text = []
                for t in p.findall('.//w:t', ns):
                    if t.text:
                        p_text.append(t.text)
                if p_text:
                    texts.append(''.join(p_text))
            
            return '\n'.join(texts)
    except Exception as e:
        return f"Error: {e}"

if __name__ == '__main__':
    doc_path = r'c:\kimpaConeta\SCRIPT PostgreSQL.docx'
    text = docx_to_text(doc_path)
    
    # Save the text to a txt file so we can view it easily
    with open(r'c:\kimpaConeta\script_sql.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Done! Extracted text saved to script_sql.txt")
