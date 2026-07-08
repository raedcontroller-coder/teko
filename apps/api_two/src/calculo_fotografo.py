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
            
        # Phase 1: <= 120s (first 2 mins)
        # Phase 2: > 120s (last 2 mins)
        # Note: spawnTimeGameSeconds counts from 240 down to 0, or 0 to 240?
        # In FotografoGame.tsx: spawnTimeGameSeconds = GAME_DURATION - timeLeft
        # So 0 means start of the game, 240 means end of the game.
        # Phase 1: <= 120
        # Phase 2: > 120
        
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
        
        # Queda_Atenção (Lentidão) = Média Fase 2 - Média Fase 1
        qa_lentidao_ms = p2_mean_rt - p1_mean_rt if phase1_rt and phase2_rt else 0.0
        
        # Queda_Atenção (Omissões) = Omissões Fase 2 - Omissões Fase 1
        qa_omissao = phase2_omissions - phase1_omissions
        
        print("\n" + "="*50, file=sys.stderr)
        print("📸 CÁLCULO PSICOMÉTRICO: FOTÓGRAFO DA FLORESTA 📸", file=sys.stderr)
        print("="*50, file=sys.stderr)
        print("=> FASE 1 (Primeiros 2 minutos):", file=sys.stderr)
        print(f"   - Média de Tempo de Reação: {p1_mean_rt:.2f} ms", file=sys.stderr)
        print(f"   - Lista (Tempos Corretos): {phase1_rt}", file=sys.stderr)
        print(f"   - Omissões (Pássaros perdidos): {phase1_omissions}", file=sys.stderr)
        print(f"   - Fotos Incorretas (Comissão): {phase1_commissions}", file=sys.stderr)
        print("\n=> FASE 2 (Últimos 2 minutos):", file=sys.stderr)
        print(f"   - Média de Tempo de Reação: {p2_mean_rt:.2f} ms", file=sys.stderr)
        print(f"   - Lista (Tempos Corretos): {phase2_rt}", file=sys.stderr)
        print(f"   - Omissões (Pássaros perdidos): {phase2_omissions}", file=sys.stderr)
        print(f"   - Fotos Incorretas (Comissão): {phase2_commissions}", file=sys.stderr)
        print("\n=> LAUDO DE QUEDA DE ATENÇÃO (QA):", file=sys.stderr)
        print(f"   - QA (Lentidão): {qa_lentidao_ms:+.2f} ms", file=sys.stderr)
        print(f"   - QA (Omissões): {qa_omissao:+} pássaro(s)", file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)
        
        result = {
            "media_tempo_fase1": round(p1_mean_rt, 2),
            "media_tempo_fase2": round(p2_mean_rt, 2),
            "diferenca_tempo": round(qa_lentidao_ms, 2),
            "absoluto_omissoes_fase1": phase1_omissions,
            "absoluto_omissoes_fase2": phase2_omissions,
            "diferenca_omissoes": phase2_omissions - phase1_omissions,
            "absoluto_comissoes_fase1": phase1_commissions,
            "absoluto_comissoes_fase2": phase2_commissions,
            "diferenca_comissoes": phase2_commissions - phase1_commissions
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
