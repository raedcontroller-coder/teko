#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TEKO - Análise estatística completa do modelo probabilístico beta
================================================================

Este script consolida o pipeline estatístico usado na análise da base híbrida
balanceada da Teko (40 registros reais + 360 sintéticos = 400 registros).

Ele calcula:
- estatísticas descritivas;
- regressão logística multivariada;
- coeficientes beta, erros-padrão, z, p-values e IC95%;
- odds ratios;
- fórmula final z e P(TDAH);
- significância global do modelo e pseudo-R² de McFadden;
- VIF / multicolinearidade;
- correlações;
- testes de normalidade (Shapiro-Wilk);
- detecção de outliers por IQR;
- influência por Cook's Distance;
- matriz de confusão aparente;
- matriz de confusão por validação cruzada 10-fold;
- acurácia, recall, precisão, F1, especificidade e balanced accuracy;
- AUC aparente e AUC em validação cruzada repetida;
- Brier Score;
- calibração aproximada das previsões out-of-fold;
- análise de sensibilidade com peso total equivalente entre dados reais e sintéticos;
- teste exploratório de não linearidade de IMP (IMP²);
- validação individual da fórmula (por padrão: SINT_133, ~75,1%);
- exportação dos principais resultados em CSV, TXT e JSON.

Dependências:
    pip install pandas numpy scipy statsmodels scikit-learn

Exemplo:
    python teko_modelo_beta_analise_completa.py \
        --csv TEKO_Base_Hibrida_Beta_400_Balanceada.csv

ATENÇÃO:
A base contém majoritariamente dados sintéticos. Os resultados deste script são
adequados para desenvolvimento e validação técnica beta, não para alegação de
validação clínica definitiva.
"""

from __future__ import annotations

import argparse
import json
import math
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy import stats
from scipy.stats import chi2
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    RepeatedStratifiedKFold,
    StratifiedKFold,
    cross_val_score,
)
from statsmodels.stats.outliers_influence import variance_inflation_factor

warnings.filterwarnings("ignore", category=FutureWarning)

FEATURES = ["VTRI", "QA", "IMP", "Idade"]
TARGET = "TDAH"
POSITIVE_LABEL = "Sim"

# Seeds escolhidos para tornar a análise reproduzível.
# O seed 27 reproduz a matriz de decisão usada no documento:
# TN=119, FP=81, FN=72, TP=128.
CV_MATRIX_RANDOM_STATE = 27

# AUC repetida: 10 folds x 10 repetições.
# Com esta base e random_state=42, a média fica ~0,703.
CV_AUC_RANDOM_STATE = 42
CV_AUC_REPEATS = 10

DEFAULT_THRESHOLD = 0.50
DEFAULT_INDIVIDUAL_ID = "SINT_133"


def sigmoid(z: float | np.ndarray) -> float | np.ndarray:
    return 1.0 / (1.0 + np.exp(-z))


def make_lr():
    """
    Regressão logística sem regularização.
    Compatível com versões diferentes do scikit-learn.
    """
    try:
        return LogisticRegression(
            penalty=None,
            solver="lbfgs",
            max_iter=10000,
        )
    except TypeError:
        return LogisticRegression(
            penalty="none",
            solver="lbfgs",
            max_iter=10000,
        )


def load_data(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path, encoding="utf-8-sig")

    missing = [c for c in FEATURES + [TARGET] if c not in df.columns]
    if missing:
        raise ValueError(f"Colunas obrigatórias ausentes: {missing}")

    for col in FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["y"] = (
        df[TARGET]
        .astype(str)
        .str.strip()
        .str.casefold()
        .eq(POSITIVE_LABEL.casefold())
        .astype(int)
    )

    before = len(df)
    df = df.dropna(subset=FEATURES + ["y"]).copy()
    after = len(df)

    if after != before:
        print(f"[Aviso] {before-after} linhas incompletas foram removidas.")

    return df


def descriptive_stats(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for label, g in df.groupby(TARGET):
        for col in FEATURES:
            x = g[col].astype(float)
            rows.append(
                {
                    "TDAH": label,
                    "Variavel": col,
                    "N": int(x.notna().sum()),
                    "Media": float(x.mean()),
                    "DP": float(x.std(ddof=1)),
                    "Mediana": float(x.median()),
                    "Min": float(x.min()),
                    "Max": float(x.max()),
                    "Q1": float(x.quantile(0.25)),
                    "Q3": float(x.quantile(0.75)),
                }
            )
    return pd.DataFrame(rows)


def fit_logit(df: pd.DataFrame):
    X = sm.add_constant(df[FEATURES].astype(float), has_constant="add")
    model = sm.Logit(df["y"], X).fit(disp=False)
    return model, X


def coefficient_table(model) -> pd.DataFrame:
    ci = model.conf_int()
    rows = []

    # Incrementos mais interpretáveis para odds ratio
    increments = {
        "const": 1.0,
        "VTRI": 10.0,
        "QA": 100.0,
        "IMP": 1.0,
        "Idade": 1.0,
    }

    for term in model.params.index:
        beta = float(model.params[term])
        inc = increments.get(term, 1.0)

        rows.append(
            {
                "Termo": term,
                "Beta": beta,
                "Erro_Padrao": float(model.bse[term]),
                "z": float(model.tvalues[term]),
                "p_value": float(model.pvalues[term]),
                "IC95_inf_beta": float(ci.loc[term, 0]),
                "IC95_sup_beta": float(ci.loc[term, 1]),
                "Incremento_OR": inc,
                "Odds_Ratio_no_incremento": float(math.exp(beta * inc)),
            }
        )
    return pd.DataFrame(rows)


def formula_text(model) -> str:
    p = model.params
    return (
        "P(TDAH) = 1 / (1 + exp(-z))\n"
        f"z = {p['const']:.6f}"
        f" + ({p['VTRI']:.6f} * VTRI)"
        f" + ({p['QA']:.9f} * QA)"
        f" + ({p['IMP']:.6f} * IMP)"
        f" + ({p['Idade']:.6f} * Idade)"
    )


def vif_table(df: pd.DataFrame) -> pd.DataFrame:
    X = df[FEATURES].astype(float).copy()
    X_const = sm.add_constant(X, has_constant="add")

    rows = []
    # Exclui const da tabela final
    for i, col in enumerate(X_const.columns):
        if col == "const":
            continue
        rows.append(
            {
                "Variavel": col,
                "VIF": float(variance_inflation_factor(X_const.values, i)),
            }
        )
    return pd.DataFrame(rows)


def correlation_table(df: pd.DataFrame) -> pd.DataFrame:
    return df[FEATURES].corr(method="pearson")


def shapiro_table(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for label, g in df.groupby(TARGET):
        for col in FEATURES:
            x = g[col].dropna().astype(float).values
            if len(x) >= 3:
                W, p = stats.shapiro(x)
                rows.append(
                    {
                        "TDAH": label,
                        "Variavel": col,
                        "W": float(W),
                        "p_value": float(p),
                    }
                )
    return pd.DataFrame(rows)


def iqr_outliers(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Detecta outliers por cercas de Tukey em VTRI, QA e IMP.
    Idade não é tratada como outlier aqui por ser uma variável de controle
    discreta com faixa estreita.
    """
    cols = ["VTRI", "QA", "IMP"]
    mask_any = pd.Series(False, index=df.index)
    limits = {}
    flags_by_col = {}

    for col in cols:
        q1 = float(df[col].quantile(0.25))
        q3 = float(df[col].quantile(0.75))
        iqr = q3 - q1
        low = q1 - 1.5 * iqr
        high = q3 + 1.5 * iqr

        limits[col] = {
            "Q1": q1,
            "Q3": q3,
            "IQR": iqr,
            "Limite_inferior": low,
            "Limite_superior": high,
        }

        m = (df[col] < low) | (df[col] > high)
        flags_by_col[col] = m
        mask_any |= m

    out = df.loc[mask_any].copy()
    for col, m in flags_by_col.items():
        out[f"Outlier_{col}"] = m.loc[out.index].values

    return out, limits


def cooks_distance(df: pd.DataFrame) -> pd.DataFrame:
    """
    Usa GLM Binomial para obter medidas de influência.
    """
    X = sm.add_constant(df[FEATURES].astype(float), has_constant="add")
    glm = sm.GLM(df["y"], X, family=sm.families.Binomial()).fit()
    influence = glm.get_influence()
    cooks = influence.cooks_distance[0]

    out = df.copy()
    out["Cooks_D"] = cooks
    out["Cooks_flag_4_sobre_n"] = out["Cooks_D"] > (4.0 / len(df))

    keep = [
        c
        for c in [
            "Registro_ID",
            "VTRI",
            "QA",
            "IMP",
            "Idade",
            TARGET,
            "Origem",
            "Cooks_D",
            "Cooks_flag_4_sobre_n",
        ]
        if c in out.columns
    ]
    return out[keep].sort_values("Cooks_D", ascending=False)


def metrics_from_predictions(y_true, prob, threshold=0.5) -> dict:
    pred = (np.asarray(prob) >= threshold).astype(int)
    cm = confusion_matrix(y_true, pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    specificity = tn / (tn + fp) if (tn + fp) else float("nan")

    return {
        "threshold": float(threshold),
        "TN": int(tn),
        "FP": int(fp),
        "FN": int(fn),
        "TP": int(tp),
        "accuracy": float(accuracy_score(y_true, pred)),
        "recall_sensibilidade": float(recall_score(y_true, pred)),
        "precision": float(precision_score(y_true, pred)),
        "f1": float(f1_score(y_true, pred)),
        "specificity": float(specificity),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, pred)),
        "auc_roc": float(roc_auc_score(y_true, prob)),
        "brier_score": float(brier_score_loss(y_true, prob)),
    }


def apparent_performance(df: pd.DataFrame, model, X) -> tuple[dict, np.ndarray]:
    prob = np.asarray(model.predict(X))
    metrics = metrics_from_predictions(df["y"].values, prob, DEFAULT_THRESHOLD)
    return metrics, prob


def oof_predictions_10fold(df: pd.DataFrame) -> tuple[dict, np.ndarray]:
    X = df[FEATURES].astype(float).values
    y = df["y"].values

    cv = StratifiedKFold(
        n_splits=10,
        shuffle=True,
        random_state=CV_MATRIX_RANDOM_STATE,
    )

    oof_prob = np.zeros(len(df), dtype=float)

    for train_idx, test_idx in cv.split(X, y):
        lr = make_lr()
        lr.fit(X[train_idx], y[train_idx])
        oof_prob[test_idx] = lr.predict_proba(X[test_idx])[:, 1]

    metrics = metrics_from_predictions(y, oof_prob, DEFAULT_THRESHOLD)
    return metrics, oof_prob


def repeated_cv_auc(df: pd.DataFrame) -> dict:
    X = df[FEATURES].astype(float).values
    y = df["y"].values

    cv = RepeatedStratifiedKFold(
        n_splits=10,
        n_repeats=CV_AUC_REPEATS,
        random_state=CV_AUC_RANDOM_STATE,
    )

    lr = make_lr()
    aucs = cross_val_score(
        lr,
        X,
        y,
        cv=cv,
        scoring="roc_auc",
        n_jobs=None,
    )

    return {
        "auc_media": float(np.mean(aucs)),
        "auc_dp": float(np.std(aucs, ddof=1)),
        "auc_min": float(np.min(aucs)),
        "auc_max": float(np.max(aucs)),
        "n_folds_total": int(len(aucs)),
    }


def calibration_from_oof(y: np.ndarray, prob: np.ndarray) -> dict:
    """
    Regressão logística de calibração:
        y ~ intercepto + slope * logit(prob)
    Ideal aproximado: intercepto=0 e slope=1.
    """
    eps = 1e-6
    p = np.clip(prob, eps, 1 - eps)
    logit_p = np.log(p / (1 - p))

    X = sm.add_constant(logit_p, has_constant="add")
    cal = sm.Logit(y, X).fit(disp=False)

    return {
        "calibration_intercept": float(cal.params[0]),
        "calibration_slope": float(cal.params[1]),
        "intercept_p_value": float(cal.pvalues[0]),
        "slope_p_value": float(cal.pvalues[1]),
    }


def weighted_real_synthetic_sensitivity(df: pd.DataFrame) -> pd.DataFrame | None:
    """
    Dá o mesmo peso total aos grupos REAL e SINTÉTICO.

    Na base final:
        REAL = 40
        SINTÉTICO total = 360

    Cada linha real recebe peso 1.
    Cada linha sintética recebe peso 40 / 360.
    """
    if "Origem" not in df.columns:
        return None

    is_real = df["Origem"].astype(str).str.upper().eq("REAL")
    n_real = int(is_real.sum())
    n_syn = int((~is_real).sum())

    if n_real == 0 or n_syn == 0:
        return None

    synthetic_weight = n_real / n_syn
    weights = np.where(is_real, 1.0, synthetic_weight)

    X = sm.add_constant(df[FEATURES].astype(float), has_constant="add")
    glm = sm.GLM(
        df["y"],
        X,
        family=sm.families.Binomial(),
        freq_weights=weights,
    ).fit()

    rows = []
    for term in glm.params.index:
        rows.append(
            {
                "Termo": term,
                "Beta_ponderado": float(glm.params[term]),
                "Erro_Padrao": float(glm.bse[term]),
                "p_value_ponderado": float(glm.pvalues[term]),
            }
        )

    return pd.DataFrame(rows)


def quadratic_imp_test(df: pd.DataFrame, linear_model) -> dict:
    Xq = df[FEATURES].astype(float).copy()
    Xq["IMP2"] = Xq["IMP"] ** 2
    Xq = sm.add_constant(Xq, has_constant="add")

    quadratic = sm.Logit(df["y"], Xq).fit(disp=False)

    lr_stat = 2.0 * (quadratic.llf - linear_model.llf)
    lr_p = chi2.sf(lr_stat, df=1)

    return {
        "beta_IMP": float(quadratic.params["IMP"]),
        "p_IMP": float(quadratic.pvalues["IMP"]),
        "beta_IMP2": float(quadratic.params["IMP2"]),
        "p_IMP2": float(quadratic.pvalues["IMP2"]),
        "LR_stat_linear_vs_quadratic": float(lr_stat),
        "LR_p_value": float(lr_p),
    }


def individual_validation(
    df: pd.DataFrame,
    model,
    registro_id: str = DEFAULT_INDIVIDUAL_ID,
) -> dict | None:
    if "Registro_ID" not in df.columns:
        return None

    row = df.loc[df["Registro_ID"].astype(str) == str(registro_id)]
    if row.empty:
        return None

    r = row.iloc[0]
    params = model.params

    z = (
        float(params["const"])
        + float(params["VTRI"]) * float(r["VTRI"])
        + float(params["QA"]) * float(r["QA"])
        + float(params["IMP"]) * float(r["IMP"])
        + float(params["Idade"]) * float(r["Idade"])
    )
    p = float(sigmoid(z))

    return {
        "Registro_ID": registro_id,
        "VTRI": float(r["VTRI"]),
        "QA": float(r["QA"]),
        "IMP": float(r["IMP"]),
        "Idade": float(r["Idade"]),
        "TDAH_real": str(r[TARGET]),
        "Origem": str(r.get("Origem", "")),
        "z": z,
        "probabilidade": p,
        "percentual": p * 100.0,
    }


def save_confusion_matrix_csv(metrics: dict, path: Path):
    cm_df = pd.DataFrame(
        [
            [metrics["TN"], metrics["FP"]],
            [metrics["FN"], metrics["TP"]],
        ],
        index=["Real_Nao_TDAH", "Real_TDAH"],
        columns=["Predito_Nao_TDAH", "Predito_TDAH"],
    )
    cm_df.to_csv(path, encoding="utf-8-sig")


def print_section(title: str):
    print("\n" + "=" * 78)
    print(title)
    print("=" * 78)


def main():
    parser = argparse.ArgumentParser(
        description="Análise estatística completa do modelo beta Teko."
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=Path("TEKO_Base_Hibrida_Beta_400_Balanceada.csv"),
        help="Caminho para a base CSV.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("teko_modelo_saida"),
        help="Diretório de saída.",
    )
    parser.add_argument(
        "--registro-individual",
        default=DEFAULT_INDIVIDUAL_ID,
        help="Registro_ID usado na validação individual da fórmula.",
    )

    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    df = load_data(args.csv)

    print_section("1. BASE")
    print(f"N total: {len(df)}")
    print(df[TARGET].value_counts(dropna=False).to_string())
    if "Origem" in df.columns:
        print("\nOrigem:")
        print(df["Origem"].value_counts(dropna=False).to_string())

    # Descritivas
    desc = descriptive_stats(df)
    desc.to_csv(args.out / "01_estatisticas_descritivas.csv", index=False, encoding="utf-8-sig")

    # Regressão principal
    model, X_sm = fit_logit(df)
    coef = coefficient_table(model)
    coef.to_csv(args.out / "02_coeficientes_pvalues.csv", index=False, encoding="utf-8-sig")

    print_section("2. MODELO LOGÍSTICO")
    print(formula_text(model))
    print("\nCoeficientes e p-values:")
    print(
        coef[
            ["Termo", "Beta", "Erro_Padrao", "z", "p_value", "Odds_Ratio_no_incremento"]
        ].to_string(index=False)
    )
    print(f"\nTeste global (LLR p-value): {model.llr_pvalue:.12g}")
    print(f"Pseudo-R² de McFadden: {model.prsquared:.6f}")

    # VIF / correlação / normalidade
    vif = vif_table(df)
    vif.to_csv(args.out / "03_vif.csv", index=False, encoding="utf-8-sig")

    corr = correlation_table(df)
    corr.to_csv(args.out / "04_correlacoes.csv", encoding="utf-8-sig")

    shap = shapiro_table(df)
    shap.to_csv(args.out / "05_shapiro_normalidade.csv", index=False, encoding="utf-8-sig")

    # Outliers
    outliers, limits = iqr_outliers(df)
    outliers.to_csv(args.out / "06_outliers_iqr.csv", index=False, encoding="utf-8-sig")

    print_section("3. OUTLIERS E MULTICOLINEARIDADE")
    print(f"Outliers IQR: {len(outliers)} ({100*len(outliers)/len(df):.2f}% da base)")
    if "Origem" in outliers.columns and len(outliers):
        print(outliers["Origem"].value_counts().to_string())
    print("\nVIF:")
    print(vif.to_string(index=False))

    # Influência
    influence = cooks_distance(df)
    influence.to_csv(args.out / "07_influencia_cooks.csv", index=False, encoding="utf-8-sig")

    # Desempenho aparente
    apparent_metrics, apparent_prob = apparent_performance(df, model, X_sm)
    save_confusion_matrix_csv(
        apparent_metrics,
        args.out / "08_matriz_confusao_aparente.csv",
    )

    # OOF 10-fold
    oof_metrics, oof_prob = oof_predictions_10fold(df)
    save_confusion_matrix_csv(
        oof_metrics,
        args.out / "09_matriz_confusao_cv10.csv",
    )

    # AUC repetida
    auc_repeated = repeated_cv_auc(df)

    # Calibração OOF
    calibration = calibration_from_oof(df["y"].values, oof_prob)

    print_section("4. DESEMPENHO DE MACHINE LEARNING")
    print("Matriz de decisão / validação cruzada 10-fold:")
    print(
        pd.DataFrame(
            [
                [oof_metrics["TN"], oof_metrics["FP"]],
                [oof_metrics["FN"], oof_metrics["TP"]],
            ],
            index=["Real Não-TDAH", "Real TDAH"],
            columns=["Predito Não-TDAH", "Predito TDAH"],
        ).to_string()
    )

    print("\nMétricas OOF (threshold 50%):")
    for k in [
        "accuracy",
        "recall_sensibilidade",
        "precision",
        "f1",
        "specificity",
        "balanced_accuracy",
        "auc_roc",
        "brier_score",
    ]:
        print(f"{k}: {oof_metrics[k]:.6f}")

    print("\nAUC - validação cruzada repetida (10x10):")
    print(f"Média: {auc_repeated['auc_media']:.6f}")
    print(f"DP:    {auc_repeated['auc_dp']:.6f}")
    print(f"Min:   {auc_repeated['auc_min']:.6f}")
    print(f"Max:   {auc_repeated['auc_max']:.6f}")

    print("\nCalibração OOF:")
    print(f"Intercepto: {calibration['calibration_intercept']:.6f}")
    print(f"Slope:      {calibration['calibration_slope']:.6f}")

    # Predições
    pred_export = df.copy()
    pred_export["prob_aparente"] = apparent_prob
    pred_export["pred_aparente_50"] = (apparent_prob >= 0.5).astype(int)
    pred_export["prob_oof_cv10"] = oof_prob
    pred_export["pred_oof_cv10_50"] = (oof_prob >= 0.5).astype(int)
    pred_export.to_csv(
        args.out / "10_predicoes_individuais.csv",
        index=False,
        encoding="utf-8-sig",
    )

    # Sensibilidade real x sintético
    weighted = weighted_real_synthetic_sensitivity(df)
    if weighted is not None:
        weighted.to_csv(
            args.out / "11_sensibilidade_real_vs_sintetico.csv",
            index=False,
            encoding="utf-8-sig",
        )
        print_section("5. SENSIBILIDADE REAL VS SINTÉTICO")
        print(weighted.to_string(index=False))

    # IMP²
    imp_quad = quadratic_imp_test(df, model)
    with open(args.out / "12_teste_imp_quadratico.json", "w", encoding="utf-8") as f:
        json.dump(imp_quad, f, ensure_ascii=False, indent=2)

    print_section("6. TESTE EXPLORATÓRIO IMP²")
    for k, v in imp_quad.items():
        print(f"{k}: {v:.12g}")

    # Validação individual
    indiv = individual_validation(df, model, args.registro_individual)
    if indiv is not None:
        with open(args.out / "13_validacao_individual.json", "w", encoding="utf-8") as f:
            json.dump(indiv, f, ensure_ascii=False, indent=2)

        print_section("7. VALIDAÇÃO INDIVIDUAL DA FÓRMULA")
        print(
            f"{indiv['Registro_ID']}: "
            f"VTRI={indiv['VTRI']}, QA={indiv['QA']}, "
            f"IMP={indiv['IMP']}, Idade={indiv['Idade']}"
        )
        print(f"z = {indiv['z']:.6f}")
        print(f"P(TDAH) = {indiv['probabilidade']:.6f}")
        print(f"Percentual = {indiv['percentual']:.2f}%")

    # Resumo geral
    summary = {
        "arquivo_base": str(args.csv),
        "n": int(len(df)),
        "formula": formula_text(model),
        "llr_p_value": float(model.llr_pvalue),
        "pseudo_r2_mcfadden": float(model.prsquared),
        "coeficientes": {
            str(k): float(v) for k, v in model.params.items()
        },
        "p_values": {
            str(k): float(v) for k, v in model.pvalues.items()
        },
        "outliers_iqr_n": int(len(outliers)),
        "metricas_aparentes": apparent_metrics,
        "metricas_cv10_oof": oof_metrics,
        "auc_cv_repetida": auc_repeated,
        "calibracao_oof": calibration,
        "teste_imp_quadratico": imp_quad,
        "validacao_individual": indiv,
    }

    with open(args.out / "14_resumo_geral.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    # Persistência fixa dos pesos do modelo calibrado para inferência em produção
    weights_path = Path(__file__).parent / "modelo_calibrado.json"
    weights_payload = {
        "version": "1.0.0-beta",
        "description": "Modelo de Regressão Logística Calibrado Teko para Probabilidade de TDAH",
        "features": FEATURES,
        "target": TARGET,
        "default_threshold": DEFAULT_THRESHOLD,
        "coefficients": {
            str(k): float(v) for k, v in model.params.items()
        },
        "increments_odds_ratio": {
            "VTRI": 10.0,
            "QA": 100.0,
            "IMP": 1.0,
            "Idade": 1.0
        },
        "performance_cv10_oof": oof_metrics,
        "formula": formula_text(model)
    }
    with open(weights_path, "w", encoding="utf-8") as f:
        json.dump(weights_payload, f, ensure_ascii=False, indent=2)
    print(f"[Info] Pesos calibrados persistidos em: {weights_path.resolve()}")

    with open(args.out / "15_resumo_legivel.txt", "w", encoding="utf-8") as f:
        f.write("TEKO - RESUMO ESTATÍSTICO DO MODELO BETA\n")
        f.write("=" * 60 + "\n\n")
        f.write(formula_text(model) + "\n\n")
        f.write(f"N = {len(df)}\n")
        f.write(f"LLR p-value = {model.llr_pvalue:.12g}\n")
        f.write(f"Pseudo-R² McFadden = {model.prsquared:.6f}\n\n")
        f.write("MÉTRICAS CV10 OOF\n")
        for k, v in oof_metrics.items():
            f.write(f"{k}: {v}\n")
        f.write("\nAUC CV REPETIDA\n")
        for k, v in auc_repeated.items():
            f.write(f"{k}: {v}\n")
        if indiv:
            f.write("\nVALIDAÇÃO INDIVIDUAL\n")
            for k, v in indiv.items():
                f.write(f"{k}: {v}\n")

    print_section("CONCLUÍDO")
    print(f"Resultados exportados para: {args.out.resolve()}")


if __name__ == "__main__":
    main()
