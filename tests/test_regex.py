import re

text = "html5 RESTful APIs node.js c++ .net c# reactjs vuejs tf ml"
aliases = {
    "node": "Node.js",
    "reactjs": "React",
    "vuejs": "Vue.js",
    "js": "JavaScript",
    "ts": "TypeScript",
    "py": "Python",
    "ml": "Machine Learning",
    "tf": "TensorFlow",
    "k8s": "Kubernetes",
    "cplusplus": "C++",
    "c sharp": "C#",
    "csharp": "C#",
    "dotnet": ".NET",
    "dot net": ".NET",
    "asp.net core": "ASP.NET",
    "asp net": "ASP.NET",
}

for alias, can in aliases.items():
    pattern = r'(?<![A-Za-z0-9_])' + re.escape(alias) + r'(?![A-Za-z0-9_])'
    if re.search(pattern, text, re.IGNORECASE):
        print("Matched:", alias, "->", can)
