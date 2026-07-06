import sys
import json
from scipy.stats import norm

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "Nenhum dado fornecido."}))
            return

        input_data = sys.argv[1]
        data = json.loads(input_data)

        hits = float(data.get("hits", 0))
        misses = float(data.get("misses", 0))
        false_alarms = float(data.get("falseAlarms", 0))
        correct_rejections = float(data.get("correctRejections", 0))

        total_go = data.get("totalGoStimuli", int(hits + misses))
        total_nogo = data.get("totalNoGoStimuli", int(false_alarms + correct_rejections))
        reaction_times_hits = data.get("reactionTimesHits", [])
        reaction_times_commissions = data.get("reactionTimesCommissions", [])

        # Log-linear correction (blindagem matemática contra infinitos)
        h_corrected = (hits + 0.5) / (hits + misses + 1.0)
        fa_corrected = (false_alarms + 0.5) / (false_alarms + correct_rejections + 1.0)

        # scipy.stats.norm.ppf -> Percent Point Function (Inverse of CDF) (Z-Score puro)
        z_h = norm.ppf(h_corrected)
        z_fa = norm.ppf(fa_corrected)

        # d' = Z(H) - Z(FA)
        d_prime = z_h - z_fa

        # C = -(Z(H) + Z(FA)) / 2
        criterion_c = -(z_h + z_fa) / 2.0

        print(json.dumps({
            "totalGoStimuli": total_go,
            "totalNoGoStimuli": total_nogo,
            "hits": int(hits),
            "misses": int(misses),
            "falseAlarms": int(false_alarms),
            "correctRejections": int(correct_rejections),
            "reactionTimesHits": reaction_times_hits,
            "reactionTimesCommissions": reaction_times_commissions,
            "hitRate": round(h_corrected, 4),
            "falseAlarmRate": round(fa_corrected, 4),
            "dPrime": round(d_prime, 4),
            "criterionC": round(criterion_c, 4)
        }))

    except Exception as e:
        print(json.dumps({"error": f"Erro interno no Python: {str(e)}"}))

if __name__ == "__main__":
    main()
