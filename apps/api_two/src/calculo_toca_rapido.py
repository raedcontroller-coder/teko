import sys
import json

def main():
    try:
        data_str = sys.argv[1]
        data = json.loads(data_str)
        
        # TelemetryLogger returns properties like falseAlarms, totalNoGoStimuli
        false_alarms = data.get("falseAlarms", 0)
        total_nogo = data.get("totalNoGoStimuli", 0)
        
        # Erro_NoGo (Impulsividade) = false_alarms (absolute count)
        erro_nogo = false_alarms
        
        # Opcional para contexto visual:
        failure_rate = (false_alarms / total_nogo * 100) if total_nogo > 0 else 0
        
        print("\n" + "="*50, file=sys.stderr)
        print("⚡ CÁLCULO PSICOMÉTRICO: TOCA RÁPIDO (GO/NO-GO) ⚡", file=sys.stderr)
        print("="*50, file=sys.stderr)
        print(f"Total de Estímulos Proibidos (No-Go): {total_nogo}", file=sys.stderr)
        print("\n=> LAUDO DE CONTROLE INIBITÓRIO:", file=sys.stderr)
        print(f"   - Erro_NoGo (Impulsividade): {erro_nogo} erro(s)", file=sys.stderr)
        print(f"   - Taxa de Falha Inibitória: {failure_rate:.1f}%", file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)
        
        result = {
            "erro_nogo": erro_nogo,
            "failure_rate_pct": failure_rate,
            "total_nogo": total_nogo
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
