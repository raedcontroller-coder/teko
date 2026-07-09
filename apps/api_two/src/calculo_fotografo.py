import sys
import json
import numpy as np
from scipy.stats import zscore

def safe_zscore(values):
    if values[0] == values[1]:
        return [0.0, 0.0]
    return list(zscore(values))

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
        
        phase1_omissions = 0
        phase2_omissions = 0
        
        phase1_commissions = 0
        phase2_commissions = 0
        
        for t in telemetry:
            time_sec = t.get("spawnTimeGameSeconds", 0)
            res = t.get("result", "")
            rt = t.get("reactionTimeMs")
            
            if time_sec <= 120:
                if res == "success" and rt is not None:
                    phase1_rt.append(rt)
                elif res == "omission":
                    phase1_omissions += 1
                elif res == "commission":
                    phase1_commissions += 1
            else:
                if res == "success" and rt is not None:
                    phase2_rt.append(rt)
                elif res == "omission":
                    phase2_omissions += 1
                elif res == "commission":
                    phase2_commissions += 1
                    
        p1_mean_rt = float(np.mean(phase1_rt)) if phase1_rt else 0.0
        p2_mean_rt = float(np.mean(phase2_rt)) if phase2_rt else 0.0
        
        # Estruturando os vetores (Índice 0 = Fase 1, Índice 1 = Fase 2)
        rt_values = [p1_mean_rt, p2_mean_rt]
        om_values = [phase1_omissions, phase2_omissions]
        com_values = [phase1_commissions, phase2_commissions]
        
        # Aplicando Z-Score individualmente para cada uma das 3 variáveis
        z_rt = safe_zscore(rt_values)
        z_om = safe_zscore(om_values)
        z_com = safe_zscore(com_values)
        
        # Média dos Z-Scores por fase
        media_z_fase1 = (z_rt[0] + z_om[0] + z_com[0]) / 3.0
        media_z_fase2 = (z_rt[1] + z_om[1] + z_com[1]) / 3.0
        
        # Queda_Atenção = Média_Z_Fase2 - Média_Z_Fase1
        qa_score_final = media_z_fase2 - media_z_fase1
        
        print("\n" + "="*60, file=sys.stderr)
        print("📸 CÁLCULO PSICOMÉTRICO: FOTÓGRAFO DA FLORESTA (Z-SCORE) 📸", file=sys.stderr)
        print("="*60, file=sys.stderr)
        print("=> DADOS BRUTOS COLETADOS:", file=sys.stderr)
        print(f"   - FASE 1: RT={p1_mean_rt:.2f}ms | Omissões={phase1_omissions} | Comissões={phase1_commissions}", file=sys.stderr)
        print(f"   - FASE 2: RT={p2_mean_rt:.2f}ms | Omissões={phase2_omissions} | Comissões={phase2_commissions}", file=sys.stderr)
        
        print("\n=> RESULTADOS DO Z-SCORE (Fase1 vs Fase2):", file=sys.stderr)
        print(f"   - Z-Score RT        : [{z_rt[0]:.2f}, {z_rt[1]:.2f}]", file=sys.stderr)
        print(f"   - Z-Score Omissão   : [{z_om[0]:.2f}, {z_om[1]:.2f}]", file=sys.stderr)
        print(f"   - Z-Score Comissão  : [{z_com[0]:.2f}, {z_com[1]:.2f}]", file=sys.stderr)
        
        print("\n=> MÉDIAS DOS Z-SCORES E LAUDO FINAL:", file=sys.stderr)
        print(f"   - Média Z-Score Fase 1: {media_z_fase1:+.2f}", file=sys.stderr)
        print(f"   - Média Z-Score Fase 2: {media_z_fase2:+.2f}", file=sys.stderr)
        print(f"   - QA Final (Variação) : {qa_score_final:+.2f}", file=sys.stderr)
        print("="*60 + "\n", file=sys.stderr)
        
        result = {
            "media_z_score_fase1": round(media_z_fase1, 2),
            "media_z_score_fase2": round(media_z_fase2, 2),
            "qa_score_final": round(qa_score_final, 2),
            "detalhes_brutos": {
                "rt": [round(p1_mean_rt, 2), round(p2_mean_rt, 2)],
                "omissoes": om_values,
                "comissoes": com_values
            }
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
