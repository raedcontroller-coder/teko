import sys
import json
import numpy as np
from scipy.optimize import curve_fit

def piecewise_linear(x, knot, y_knot, beta1, beta3):
    """
    x: vetor de rodadas
    knot: rodada de inflexão
    y_knot: tempo de reação na rodada de inflexão
    beta1: slope 1
    beta3: slope 2
    """
    return np.piecewise(x, [x < knot], [
        lambda x: beta1 * x + (y_knot - beta1 * knot), 
        lambda x: beta3 * x + (y_knot - beta3 * knot)
    ])

def main():
    try:
        # Recebe os dados via string JSON do primeiro argumento
        if len(sys.argv) < 2:
            print(json.dumps({"error": "Nenhum dado fornecido."}))
            return

        input_data = sys.argv[1]
        reaction_times = json.loads(input_data)

        if len(reaction_times) < 5:
            print(json.dumps({
                "error": "A criança não conseguiu responder pelo menos 5 vezes. Dados insuficientes para regressão segmentada."
            }))
            return

        y = np.array(reaction_times, dtype=float)
        x = np.arange(1, len(y) + 1, dtype=float)

        # Chute inicial (p0):
        # knot = meio do array, y_knot = média, beta1 = 0, beta3 = 0
        p0 = [len(y) / 2.0, np.mean(y), 0, 0]

        # Limites (bounds):
        # knot: entre 2 e len(y) - 1
        # y_knot, beta1, beta3: sem limites (-inf, inf)
        bounds = (
            [2.0, -np.inf, -np.inf, -np.inf],
            [float(len(y) - 1), np.inf, np.inf, np.inf]
        )

        popt, pcov = curve_fit(piecewise_linear, x, y, p0=p0, bounds=bounds, method='trf')

        knot_val = popt[0]
        y_knot_val = popt[1]
        beta1 = popt[2]
        beta3 = popt[3]
        beta2 = beta3 - beta1 # Slope change (magnitude da mudança)

        print(json.dumps({
            "beta1": round(beta1, 4),
            "beta2": round(beta2, 4),
            "beta3": round(beta3, 4),
            "knot": round(knot_val, 2)
        }))

    except Exception as e:
        print(json.dumps({"error": f"Erro interno no Python: {str(e)}"}))

if __name__ == "__main__":
    main()
