import sys
import json
import numpy as np

def main():
    try:
        data_str = sys.argv[1]
        data = json.loads(data_str)
        
        telemetry = data.get("telemetry", [])
        
        if not telemetry:
            print(json.dumps({"error": "No telemetry data provided"}))
            sys.exit(1)
            
        phase1_rt = []
        phase2_rt = []
        
        for t in telemetry:
            time_sec = t.get("spawnTimeGameSeconds", 0)
            res = t.get("result", "")
            rt = t.get("reactionTimeMs")
            
            if time_sec <= 180:
                if res == "success" and rt is not None:
                    phase1_rt.append(rt)
            else:
                if res == "success" and rt is not None:
                    phase2_rt.append(rt)
                    
        p1_mean_rt = float(np.mean(phase1_rt)) if phase1_rt else 0.0
        p2_mean_rt = float(np.mean(phase2_rt)) if phase2_rt else 0.0
        
        # Variação = MediaRT2 - MediaRT1
        variacao = p2_mean_rt - p1_mean_rt
        
        print("\n" + "="*60, file=sys.stderr)
        print("📸 CÁLCULO PSICOMÉTRICO: FOTÓGRAFO DA FLORESTA (VARIAÇÃO RT) 📸", file=sys.stderr)
        print("="*60, file=sys.stderr)
        print("=> DADOS BRUTOS COLETADOS:", file=sys.stderr)
        print(f"   - FASE 1: RT Médio={p1_mean_rt:.2f}ms", file=sys.stderr)
        print(f"   - FASE 2: RT Médio={p2_mean_rt:.2f}ms", file=sys.stderr)
        print(f"   - Variação Final: {variacao:+.2f}ms", file=sys.stderr)
        print("="*60 + "\n", file=sys.stderr)
        
        result = {
            "media_rt_fase1": round(p1_mean_rt, 2),
            "media_rt_fase2": round(p2_mean_rt, 2),
            "variacao": round(variacao, 2)
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
