import json
import re
import fitz

pdf_path = r"C:\Users\Parth Verma\.gemini\antigravity-ide\brain\f1d56986-7709-4a1f-a638-dfb01ae9b3a7\.user_uploaded\media_1791383619452.pdf"

doc = fitz.open(pdf_path)
pdf_text = ""
for page in doc:
    pdf_text += page.get_text()

# Extract answers from Answer Key
answers = {}
answer_key_match = re.search(r"Answer Key[\s\S]*?(1-[A-D].*)", pdf_text, re.DOTALL | re.IGNORECASE)
if answer_key_match:
    answer_text = answer_key_match.group(1)
    matches = re.findall(r"(\d+)-([A-D])", answer_text)
    for q_num, ans in matches:
        answers[q_num] = ans

# Parse Questions
questions = []
q_pattern = re.compile(r"Q(\d+)\.\s*(.*?)(?=\n\(A\))(.*?)(?=\nQ\d+\.|\nAnswer Key|\Z)", re.DOTALL)

categories = [
    "Grammar: Fill in the Blanks",
    "Error Spotting / Sentence Correction",
    "Synonyms",
    "Antonyms",
    "Idioms and Phrases",
    "One-Word Substitution",
    "Spelling and Confused Words",
    "Para Jumbles (Sentence Ordering)",
    "Voice, Narration, Tenses and Sentence Types",
    "Reading Comprehension"
]

category_spans = []
for cat in categories:
    for match in re.finditer(re.escape(cat), pdf_text):
        category_spans.append((match.start(), cat))

category_spans.sort(key=lambda x: x[0])

def get_category_for_pos(pos):
    current_cat = categories[0]
    for start_pos, cat in category_spans:
        if start_pos < pos:
            current_cat = cat
    return current_cat

for match in q_pattern.finditer(pdf_text):
    q_num = match.group(1)
    q_text = match.group(2).strip()
    options_text = match.group(3)
    
    q_text = re.sub(r'\s+', ' ', q_text).strip()
    
    opt_a = re.search(r"\(A\)\s*(.*?)(?=\n\(B\))", options_text, re.DOTALL)
    opt_b = re.search(r"\(B\)\s*(.*?)(?=\n\(C\))", options_text, re.DOTALL)
    opt_c = re.search(r"\(C\)\s*(.*?)(?=\n\(D\))", options_text, re.DOTALL)
    opt_d = re.search(r"\(D\)\s*(.*)", options_text, re.DOTALL)
    
    if not (opt_a and opt_b and opt_c and opt_d):
        continue
        
    options = [
        re.sub(r'\s+', ' ', opt_a.group(1)).strip(),
        re.sub(r'\s+', ' ', opt_b.group(1)).strip(),
        re.sub(r'\s+', ' ', opt_c.group(1)).strip(),
        re.sub(r'\s+', ' ', opt_d.group(1)).strip(),
    ]
    
    ans_letter = answers.get(q_num)
    ans_index = {"A": 0, "B": 1, "C": 2, "D": 3}.get(ans_letter)
    answer_text = options[ans_index] if ans_index is not None else options[0]
    
    cat = get_category_for_pos(match.start())
    for c in categories:
        if c in cat:
            cat = c
            break
            
    questions.append({
        "id": f"q{q_num}",
        "category": cat,
        "question": q_text,
        "options": options,
        "answer": answer_text
    })

print(f"Parsed {len(questions)} questions.")

ts_content = '''export interface CapgeminiQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export const capgeminiQuestions: CapgeminiQuestion[] = '''

ts_content += json.dumps(questions, indent=2)
ts_content += ";\n"

output_path = r"c:\Users\Parth Verma\wordwise-english-learning-a3fa59a6\src\data\capgeminiQuestions.ts"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Written {len(questions)} questions to {output_path}")
