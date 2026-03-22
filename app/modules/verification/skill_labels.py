"""
StackPair – Allowed skill labels for normalisation.

Claude is instructed to always return one of these labels and never
invent new ones.  This list can be extended without a code change.
"""

ALLOWED_SKILL_LABELS: list[str] = [
    "Python Backend",
    "Frontend (React)",
    "Frontend (Vue)",
    "Frontend (Angular)",
    "Full Stack",
    "Data Science",
    "Machine Learning",
    "Competitive Programming",
    "DevOps / Infrastructure",
    "Cloud Architecture",
    "Android Development",
    "iOS Development",
    "Java Backend",
    "Go Backend",
    "Rust",
    "Embedded Systems",
    "Blockchain",
    "Data Engineering",
    "Cybersecurity",
    "Game Development",
]
