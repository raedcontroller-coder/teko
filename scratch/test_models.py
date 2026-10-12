import time
import json
import urllib.request
from pathlib import Path

def load_api_key() -> str:
    local_env = Path("apps/api_two/src/generate_content/.env")
    if local_env.exists():
        with open(local_env, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("TEKO_RELATORIO_FINAL_API_KEY="):
                    return line.split("=", 1)[1].strip()
    return ""

api_key = load_api_key()

models_to_test = [
    "google/gemini-2.0-flash-lite-001",
    "google/gemini-flash-1.5-8b",
    "meta-llama/llama-3.1-8b-instruct:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "deepseek/deepseek-r1:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free"
]

prompt = "Gere um JSON com a chave 'objetivo': 'Avaliar o paciente'."

for model in models_to_test:
    start_time = time.time()
    print(f"\n--- Testing model: {model} ---", flush=True)
    body = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://teko.app",
            "X-Title": "Teko Test"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            elapsed = time.time() - start_time
            msg = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"SUCCESS in {elapsed:.2f}s! Length: {len(msg)}", flush=True)
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"FAILED in {elapsed:.2f}s: {e}", flush=True)
