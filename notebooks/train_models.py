"""
NASA C-MAPSS FD001 Turbofan Engine Predictive Maintenance (PdM)
End-to-End Machine Learning & Deep Learning Training Script
"""

import os
import urllib.request
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# Set seeds
np.random.seed(42)
torch.manual_seed(42)

def download_data():
    os.makedirs("data", exist_ok=True)
    base_url = "https://raw.githubusercontent.com/Azure/azure-sdk-for-python/main/sdk/ml/azure-ai-ml/tests/test_configs/dataset/cmapss/"
    fallback_url = "https://raw.githubusercontent.com/hankroark/Turbofan-Engine-Degradation/master/"
    files = ["train_FD001.txt", "test_FD001.txt", "RUL_FD001.txt"]
    for f in files:
        dest = os.path.join("data", f)
        if not os.path.exists(dest):
            try:
                print(f"Downloading {f}...")
                urllib.request.urlretrieve(f"{base_url}{f}", dest)
            except Exception:
                try:
                    urllib.request.urlretrieve(f"{fallback_url}{f}", dest)
                except Exception as e:
                    print(f"Could not download {f}: {e}")

def calculate_nasa_score(y_true, y_pred):
    d = y_pred - y_true
    penalty = np.where(d < 0, np.exp(-d / 13.0) - 1.0, np.exp(d / 10.0) - 1.0)
    return float(np.sum(penalty))

def evaluate_model(y_true, y_pred, model_name="Model"):
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    nasa_score = calculate_nasa_score(y_true, y_pred)
    print(f"\n{'='*20} {model_name} {'='*20}")
    print(f"  RMSE:        {rmse:8.3f} cycles")
    print(f"  MAE:         {mae:8.3f} cycles")
    print(f"  R^2 Score:   {r2:8.3f}")
    print(f"  NASA Score:  {nasa_score:8.2f}")
    return {"model": model_name, "rmse": rmse, "mae": mae, "r2": r2, "nasa_score": nasa_score}

def main():
    download_data()
    columns = ['unit_nr', 'time_cycles', 'op_setting_1', 'op_setting_2', 'op_setting_3'] + [f's_{i}' for i in range(1, 22)]
    train_df = pd.read_csv('data/train_FD001.txt', sep=r'\s+', header=None, names=columns)
    test_df = pd.read_csv('data/test_FD001.txt', sep=r'\s+', header=None, names=columns)
    rul_df = pd.read_csv('data/RUL_FD001.txt', sep=r'\s+', header=None, names=['RUL_ground_truth'])

    # 1. Piecewise Linear Target (125-cycle cap)
    RUL_CAP = 125
    train_df['RUL'] = train_df.groupby('unit_nr')['time_cycles'].transform('max') - train_df['time_cycles']
    train_df['RUL_clipped'] = train_df['RUL'].clip(upper=RUL_CAP)

    # 2. Prune Zero-Variance Sensors
    sensor_cols = [f's_{i}' for i in range(1, 22)]
    low_var_sensors = [col for col in sensor_cols if train_df[col].std() < 1e-4]
    active_sensors = [col for col in sensor_cols if col not in low_var_sensors]
    print(f"Pruned 7 flatline sensors: {low_var_sensors}")
    print(f"Retained {len(active_sensors)} active sensors: {active_sensors}")

    # 3. Rolling Features (window = 5)
    def add_rolling(df):
        out = df.copy()
        for s in active_sensors:
            out[f'{s}_mean'] = out.groupby('unit_nr')[s].rolling(5, min_periods=1).mean().reset_index(0, drop=True)
            out[f'{s}_std'] = out.groupby('unit_nr')[s].rolling(5, min_periods=1).std().fillna(0).reset_index(0, drop=True)
        return out

    train_feat = add_rolling(train_df)
    test_feat = add_rolling(test_df)

    feature_cols = active_sensors + [f'{s}_mean' for s in active_sensors] + [f'{s}_std' for s in active_sensors]
    scaler = MinMaxScaler()
    train_feat[feature_cols] = scaler.fit_transform(train_feat[feature_cols])
    test_feat[feature_cols] = scaler.transform(test_feat[feature_cols])

    X_train = train_feat[feature_cols].values
    y_train = train_feat['RUL_clipped'].values

    test_last = test_feat.groupby('unit_nr').last().reset_index()
    X_test = test_last[feature_cols].values
    y_test = np.clip(rul_df['RUL_ground_truth'].values, 0, RUL_CAP)

    # Model 1: Random Forest
    rf = RandomForestRegressor(n_estimators=120, max_depth=12, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_pred = np.clip(rf.predict(X_test), 0, RUL_CAP)
    evaluate_model(y_test, rf_pred, "Random Forest")

    # Model 2: XGBoost
    xgb_reg = xgb.XGBRegressor(n_estimators=150, max_depth=5, learning_rate=0.05, random_state=42)
    xgb_reg.fit(X_train, y_train)
    xgb_pred = np.clip(xgb_reg.predict(X_test), 0, RUL_CAP)
    evaluate_model(y_test, xgb_pred, "XGBoost Regressor")

    # Model 3: PyTorch LSTM
    SEQ_LEN = 30
    def create_seq(df):
        seq_list, target_list = [], []
        for _, u_df in df.groupby('unit_nr'):
            feats = u_df[feature_cols].values
            targets = u_df['RUL_clipped'].values
            if len(feats) < SEQ_LEN:
                pad = SEQ_LEN - len(feats)
                feats = np.pad(feats, ((pad, 0), (0, 0)), mode='edge')
                targets = np.pad(targets, (pad, 0), mode='edge')
            for i in range(len(feats) - SEQ_LEN + 1):
                seq_list.append(feats[i : i + SEQ_LEN])
                target_list.append(targets[i + SEQ_LEN - 1])
        return np.array(seq_list, dtype=np.float32), np.array(target_list, dtype=np.float32)

    X_seq_tr, y_seq_tr = create_seq(train_feat)
    X_seq_te = []
    for _, u_df in test_feat.groupby('unit_nr'):
        feats = u_df[feature_cols].values
        if len(feats) < SEQ_LEN:
            pad = SEQ_LEN - len(feats)
            feats = np.pad(feats, ((pad, 0), (0, 0)), mode='edge')
        X_seq_te.append(feats[-SEQ_LEN:])
    X_seq_te = np.array(X_seq_te, dtype=np.float32)

    class TurbofanLSTM(nn.Module):
        def __init__(self, in_dim):
            super().__init__()
            self.lstm = nn.LSTM(in_dim, 64, 2, batch_first=True, dropout=0.2)
            self.fc = nn.Sequential(nn.Linear(64, 32), nn.ReLU(), nn.Linear(32, 1))
        def forward(self, x):
            out, _ = self.lstm(x)
            return self.fc(out[:, -1, :]).squeeze()

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    net = TurbofanLSTM(len(feature_cols)).to(device)
    crit = nn.MSELoss()
    opt = optim.Adam(net.parameters(), lr=0.002)

    loader = DataLoader(TensorDataset(torch.tensor(X_seq_tr), torch.tensor(y_seq_tr)), batch_size=128, shuffle=True)
    net.train()
    for ep in range(1, 16):
        for bx, by in loader:
            bx, by = bx.to(device), by.to(device)
            opt.zero_grad()
            crit(net(bx), by).backward()
            opt.step()
        print(f"Epoch {ep}/15 finished")

    net.eval()
    with torch.no_grad():
        lstm_pred = np.clip(net(torch.tensor(X_seq_te).to(device)).cpu().numpy(), 0, RUL_CAP)
    evaluate_model(y_test, lstm_pred, "PyTorch LSTM")

if __name__ == "__main__":
    main()
