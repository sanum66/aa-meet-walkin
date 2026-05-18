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

        /* Button Styling */
        .stButton>button {background-color: #2d6cdf; color: white; font-weight: 600; border-radius: 8px; transition: all 0.3s ease;}
        .stButton>button:hover {background-color: #1f4fa8; transform: translateY(-2px);}

        /* Alert and Container Styling */
        .stAlert {border-radius: 12px;}
        .metric-container {background: rgba(255,255,255,0.04); padding: 18px; border-radius: 18px;}

        /* Card Styling */
        .card {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 24px;
            margin: 12px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        /* Form Styling */
        .stForm {background: rgba(255,255,255,0.02); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);}

        /* Section Dividers */
        .section-divider {margin: 24px 0; border-bottom: 2px solid rgba(255,255,255,0.1);}

        /* Total Amount Highlight */
        .total-amount {
            background: linear-gradient(135deg, rgba(45,108,223,0.15) 0%, rgba(45,108,223,0.05) 100%);
            border-left: 4px solid #2d6cdf;
            padding: 16px;
            border-radius: 8px;
            margin: 12px 0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .main .block-container {max-width: 100%; padding: 0.5rem;}
            .stForm {padding: 16px; margin: 8px 0;}
            .card {padding: 16px; margin: 8px 0;}
            .metric-container {padding: 12px; font-size: 0.9rem;}
            .stButton>button {font-size: 0.95rem; padding: 8px 12px;}
        }

        /* Typography */
        h1 {font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;}
        h2 {font-size: 1.8rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 1rem;}
        h3 {font-size: 1.3rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.8rem;}

        /* Input Focus State */
        .stTextInput>div>div>input:focus,
        .stNumberInput>div>div>input:focus {
            border-color: #2d6cdf;
            box-shadow: 0 0 0 2px rgba(45,108,223,0.1);
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def generate_attendee_id(full_name: str, mobile: str) -> str:
    base = f"{full_name.strip().upper()}_{mobile[-4:]}"
    timestamp = datetime.utcnow().strftime("%y%m%d%H%M%S")
    return f"IRTTAA-{timestamp}-{abs(hash(base)) % 10000:04d}"


def generate_qr_code(attendee_id: str, output_dir: str = "qrcodes") -> str:
    # Reserved for future QR feature re-implementation
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


def calculate_total_amount(membership_amount: float, contribution_amount: float) -> float:
    return float(membership_amount or 0) + float(contribution_amount or 0)


def render_payment_section(membership_options: dict, section_key: str = "payment"):
    """
    Renders payment input section with membership and contribution amounts.
    Returns dict with 'membership_amount', 'contribution_amount', 'total_amount', 'membership_key'
    """
    col1, col2, col3 = st.columns(3)

    with col1:
        membership_choice = st.selectbox(
            "Membership",
            list(membership_options.keys()),
            key=f"{section_key}_membership_choice"
        )
        membership_amount = membership_options[membership_choice]

    with col2:
        contribution_amount = st.number_input(
            "Contribution Amount",
            min_value=0,
            step=100,
            value=0,
            key=f"{section_key}_contribution"
        )

    with col3:
        total_amount = calculate_total_amount(membership_amount, contribution_amount)
        st.metric("Total Amount", f"₹{total_amount}")

    return {
        "membership_amount": membership_amount,
        "contribution_amount": contribution_amount,
        "total_amount": total_amount,
        "membership_choice": membership_choice
    }

