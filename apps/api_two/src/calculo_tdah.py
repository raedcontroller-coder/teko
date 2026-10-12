#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TEKO - Script de Inferência Psicométrica e Probabilística de TDAH
==================================================================

Este script aplica o modelo estatístico calibrado (persistido em ai_model/modelo_calibrado.json)
para calcular a pontuação z, a probabilidade P(TDAH) e a faixa de risco de um paciente a partir
dos marcadores de neuropsicologia gamificada: VTRI, QA, IMP e Idade.
"""

import sys
import json
import math
from pathlib import Path

def sigmoid(z: float) -> float:
    return 1.0 / (1.0 + math.exp(-z))

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "Nenhum payload fornecido para inferência."}))
            sys.exit(1)

        input_data = json.loads(sys.argv[1])
        
        # Leitura das variáveis obrigatórias
        vtri = float(input_data.get("VTRI", input_data.get("vtri", 0)))
        qa = float(input_data.get("QA", input_data.get("qa", 0)))
        imp = float(input_data.get("IMP", input_data.get("imp", 0)))
        idade = float(input_data.get("Idade", input_data.get("idade", 0)))

        # Carrega o modelo calibrado
        model_path = Path(__file__).parent / "ai_model" / "modelo_calibrado.json"
        
        if not model_path.exists():
            print(json.dumps({"error": f"Modelo calibrado não encontrado em: {model_path}"}))
            sys.exit(1)

        with open(model_path, "r", encoding="utf-8") as f:
            model_info = json.load(f)

        coefs = model_info.get("coefficients", {})
        c_const = float(coefs.get("const", 0.0))
        c_vtri = float(coefs.get("VTRI", 0.0))
        c_qa = float(coefs.get("QA", 0.0))
        c_imp = float(coefs.get("IMP", 0.0))
        c_idade = float(coefs.get("Idade", 0.0))

        # Cálculo do Score Z
        contrib_vtri = c_vtri * vtri
        contrib_qa = c_qa * qa
        contrib_imp = c_imp * imp
        contrib_idade = c_idade * idade

        z = c_const + contrib_vtri + contrib_qa + contrib_imp + contrib_idade
        prob = sigmoid(z)
        pct = prob * 100.0

        threshold = float(model_info.get("default_threshold", 0.50))
        tem_tendencia = prob >= threshold

        if pct < 35.0:
            risco = "Baixo"
            rotulo_risco = "Baixa Probabilidade de TDAH"
        elif pct < 50.0:
            risco = "Moderado"
            rotulo_risco = "Atenção / Probabilidade Borderline"
        else:
            risco = "Elevado"
            rotulo_risco = "Elevada Probabilidade de TDAH"

        result = {
            "status": "success",
            "modelo_versao": model_info.get("version", "1.0.0-beta"),
            "entradas": {
                "VTRI": round(vtri, 2),
                "QA": round(qa, 2),
                "IMP": round(imp, 2),
                "Idade": round(idade, 1)
            },
            "z_score": round(z, 6),
            "probabilidade": round(prob, 6),
            "percentual": round(pct, 2),
            "tem_tendencia_tdah": tem_tendencia,
            "faixa_risco": risco,
            "classificacao": rotulo_risco,
            "contribuicao_variaveis": {
                "intercepto": round(c_const, 6),
                "VTRI": round(contrib_vtri, 6),
                "QA": round(contrib_qa, 6),
                "IMP": round(contrib_imp, 6),
                "Idade": round(contrib_idade, 6)
            }
        }

        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
