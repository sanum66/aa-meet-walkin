import os
import io
from datetime import datetime

import pandas as pd
import qrcode
import streamlit as st


def inject_custom_css():
    st.markdown(
        """
        <style>
        .css-1d391kg {padding-top: 1rem;}
        .css-1d391kg .block-container {padding-top: 1rem;}
        .main .block-container {max-width: 1400px;}
        .stButton>button {background-color: #2d6cdf; color: white;}
        .stAlert {border-radius: 12px;}
        .metric-container {background: rgba(255,255,255,0.04); padding: 18px; border-radius: 18px;}
        </style>
        """,
        unsafe_allow_html=True,
    )


def generate_attendee_id(full_name: str, mobile: str) -> str:
    base = f"{full_name.strip().upper()}_{mobile[-4:]}"
    timestamp = datetime.utcnow().strftime("%y%m%d%H%M%S")
    return f"IRTTAA-{timestamp}-{abs(hash(base)) % 10000:04d}"


def generate_qr_code(attendee_id: str, output_dir: str = "qrcodes") -> str:
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, f"{attendee_id}.png")
    qr = qrcode.QRCode(version=2, box_size=8, border=2)
    qr.add_data(attendee_id)
    qr.make(fit=True)
    image = qr.make_image(fill_color="#212121", back_color="white")
    image.save(file_path)
    return file_path


def dataframe_from_records(records):
    if not records:
        return pd.DataFrame()
    return pd.DataFrame([dict(row) for row in records])


def export_to_excel(df, filename="attendees.xlsx") -> bytes:
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Attendees")
        writer.save()
    return output.getvalue()


def export_to_csv(df) -> bytes:
    return df.to_csv(index=False).encode("utf-8")


def parse_int(value, fallback=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def safe_float(value, fallback=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def batch_select_options():
    current_year = datetime.now().year
    return [str(year) for year in range(current_year, 1950, -1)]
