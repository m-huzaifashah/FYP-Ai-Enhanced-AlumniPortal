import re

text = "html5 RESTful APIs"
aliases = {
    "ml": "Machine Learning",
    "tf": "TensorFlow",
}

for alias, can in aliases.items():
    pattern = r'(?<![A-Za-z0-9_])' + re.escape(alias) + r'(?![A-Za-z0-9_])'
    if re.search(pattern, text, re.IGNORECASE):
        print("Matched:", alias, "->", can)
