import json
import re
import os

transcript_path = r"C:\Users\Parth Verma\.gemini\antigravity-ide\brain\f1d56986-7709-4a1f-a638-dfb01ae9b3a7\.system_generated\logs\transcript_full.jsonl"

pdf_text = ""
with open(transcript_path, "r", encoding="utf-8") as f:
    lines = f.readlines()
    for line in reversed(lines):
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            content = data.get("content", "")
            if "==Start of PDF==" in content:
                pdf_text = content
                break

if not pdf_text:
    print("Could not find PDF text in transcript.")
    exit(1)

# Extract answers from Answer Key
answers = {}
answer_key_match = re.search(r"Answer Key 320 Qs(.*)", pdf_text, re.DOTALL)
if answer_key_match:
    answer_text = answer_key_match.group(1)
    # Match patterns like "1-C", "102-B", etc.
    matches = re.findall(r"(\d+)-([A-D])", answer_text)
    for q_num, ans in matches:
        answers[q_num] = ans

# Parse Questions
questions = []
# Question pattern: Q<num>. <question text> \n (A) <opt1> \n (B) <opt2> \n (C) <opt3> \n (D) <opt4>
q_pattern = re.compile(r"Q(\d+)\.\s*(.*?)(?=\n\(A\))(.*?)(?=\nQ\d+\.|\n==End|\Z)", re.DOTALL)

# Keep track of the current category by looking at headers before the question
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
    # Find all occurrences of the category in the text
    for match in re.finditer(re.escape(cat), pdf_text):
        category_spans.append((match.start(), cat))

category_spans.sort(key=lambda x: x[0])

def get_category_for_pos(pos):
    current_cat = categories[0]
    for start_pos, cat in category_spans:
        if start_pos < pos:
            # Avoid matching the index page entries if possible, usually the real sections are followed by 'Qs' or appear later
            current_cat = cat
    return current_cat

for match in q_pattern.finditer(pdf_text):
    q_num = match.group(1)
    q_text = match.group(2).strip()
    options_text = match.group(3)
    
    # Clean up q_text (remove newlines etc)
    q_text = re.sub(r'\s+', ' ', q_text).strip()
    
    # Parse options
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
    # Clean category if it matched index page
    for c in categories:
        if c in cat:
            cat = c
            break
            
    # Reading comprehension has passages, we could optionally extract passage text, 
    # but for simplicity, we'll just include the passage reference if it's there.
    
    questions.append({
        "id": f"q{q_num}",
        "category": cat,
        "question": q_text,
        "options": options,
        "answer": answer_text
    })

print(f"Parsed {len(questions)} questions.")

# Generate TS file
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

print(f"Written to {output_path}")
