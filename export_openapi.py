# ARQUIVO: export_openapi.py
import json
from app.main import app

# Gera o esquema JSON
openapi_data = app.openapi()

# Salva no arquivo
with open("openapi.json", "w") as f:
    json.dump(openapi_data, f, indent=2)

print("✅ openapi.json exportado com sucesso!")