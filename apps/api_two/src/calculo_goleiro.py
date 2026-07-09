import sys
import json
import numpy as np

def main():
    try:
        # Read the JSON payload from the first argument
        data_str = sys.argv[1]
        data = json.loads(data_str)
        
        reaction_times = data.get("reaction_times_ms", [])
        
        if not reaction_times:
            print(json.dumps({"error": "No reaction times provided"}))
            sys.exit(1)
            
        # Calculate standard deviation (VTR) using numpy
        vtr = float(np.std(reaction_times))
        mean_rt = float(np.mean(reaction_times))
        
        # Log to terminal for the user to evaluate
        print("\n" + "="*50, file=sys.stderr)
        print("⚽ CÁLCULO PSICOMÉTRICO: JOGO DO GOLEIRO ⚽", file=sys.stderr)
        print("="*50, file=sys.stderr)
        print(f"Foram recebidos {len(reaction_times)} tempos de reação exatos de defesas obrigatórias.", file=sys.stderr)
        print(f"Dados Recebidos (Milissegundos): {reaction_times}", file=sys.stderr)
        print(f"Média de Tempo de Reação: {mean_rt:.2f} ms", file=sys.stderr)
        print(f"VTR (Desvio Padrão): {vtr:.2f} ms", file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)
        
        # Return the payload back to the Node app
        result = {
            "media_reacao_ms": round(mean_rt, 2),
            "vtr_ms": round(vtr, 2),
            "total_chutes": len(reaction_times)
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
