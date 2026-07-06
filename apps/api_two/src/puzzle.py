import sys
import json
import numpy as np
from scipy.stats import linregress

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "Nenhum dado fornecido."}))
            return

        input_data = sys.argv[1]
        levels = json.loads(input_data)

        if len(levels) < 2:
            print(json.dumps({"error": "Dados insuficientes para regressão (mínimo de 2 níveis)."}))
            return

        # O eixo X é simplesmente a contagem dos níveis: 1, 2, 3...
        x = np.arange(1, len(levels) + 1)
        
        idle_times = np.array([l.get("maxIdleTime", 0) for l in levels])
        handling_times = np.array([l.get("maxHandlingTime", 0) for l in levels])
        invalid_attempts = np.array([l.get("invalidAttempts", 0) for l in levels])

        # Função de ajuda para calcular a regressão linear de forma limpa
        def get_regression_metrics(y_array):
            # linregress retorna (slope, intercept, rvalue, pvalue, stderr, intercept_stderr)
            res = linregress(x, y_array)
            return {
                "beta": round(res.slope, 4),
                "r_value": round(res.rvalue, 4),
                "p_value": round(res.pvalue, 4) if res.pvalue is not None else None
            }

        idle_metrics = get_regression_metrics(idle_times)
        handling_metrics = get_regression_metrics(handling_times)
        invalid_metrics = get_regression_metrics(invalid_attempts)

        print(json.dumps({
            "idleTime": idle_metrics,
            "handlingTime": handling_metrics,
            "invalidAttempts": invalid_metrics
        }))

    except Exception as e:
        print(json.dumps({"error": f"Erro interno no Python: {str(e)}"}))

if __name__ == "__main__":
    main()
