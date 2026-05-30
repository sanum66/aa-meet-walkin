import io
import os

from datetime import datetime

import pandas as pd
import qrcode
import streamlit as st

from theme import load_theme


# ---------------------------------------------------
# GLOBAL CSS
# ---------------------------------------------------

def inject_custom_css():

    st.markdown(

        load_theme(),

        unsafe_allow_html=True

    )


# ---------------------------------------------------
# ATTENDEE ID
# ---------------------------------------------------

def generate_attendee_id(

    name: str,

    mobile: str

) -> str:

    timestamp = datetime.utcnow().strftime(

        "%y%m%d%H%M%S"

    )

    suffix = mobile[-4:]

    return (

        f"IRTTAA-"
        f"{timestamp}-"
        f"{suffix}"

    )


# ---------------------------------------------------
# QR CODE
# ---------------------------------------------------

def generate_qr_code(

    attendee_id: str,

    output_dir: str = "qrcodes"

):

    if not os.path.exists(output_dir):

        os.makedirs(

            output_dir,

            exist_ok=True

        )

    qr = qrcode.QRCode(

        version=1,

        box_size=10,

        border=2

    )

    qr.add_data(attendee_id)

    qr.make(fit=True)

    image = qr.make_image(

        fill_color="black",

        back_color="white"

    )

    file_path = os.path.join(

        output_dir,

        f"{attendee_id}.png"

    )

    image.save(file_path)

    return file_path


# ---------------------------------------------------
# DATAFRAME
# ---------------------------------------------------

def dataframe_from_records(records):

    if not records:

        return pd.DataFrame()

    return pd.DataFrame(records)


# ---------------------------------------------------
# EXPORT EXCEL
# ---------------------------------------------------

def export_to_excel(df):

    output = io.BytesIO()

    with pd.ExcelWriter(

        output,

        engine="openpyxl"

    ) as writer:

        df.to_excel(

            writer,

            index=False,

            sheet_name="Attendees"

        )

    return output.getvalue()


# ---------------------------------------------------
# EXPORT CSV
# ---------------------------------------------------

def export_to_csv(df):

    return df.to_csv(

        index=False

    ).encode("utf-8")


# ---------------------------------------------------
# SAFE FLOAT
# ---------------------------------------------------

def safe_float(value):

    try:

        return float(value)

    except Exception:

        return 0.0


# ---------------------------------------------------
# SAFE INT
# ---------------------------------------------------

def safe_int(value):

    try:

        return int(value)

    except Exception:

        return 0


# ---------------------------------------------------
# BATCH OPTIONS
# ---------------------------------------------------

def batch_select_options():

    current_year = datetime.now().year

    return [

        str(year)

        for year in range(

            current_year + 1,

            1987,

            -1

        )

    ]


# ---------------------------------------------------
# MEMBERSHIP OPTIONS
# ---------------------------------------------------

MEMBERSHIP_OPTIONS = {

    "No Membership": 0,

    "Life Membership": 1000,

    "Patron Membership": 5000,

    "Patron Upgrade": 4000,

}


# ---------------------------------------------------
# TOTAL CALCULATION
# ---------------------------------------------------

def calculate_total_amount(

    contribution_amount,

    membership_amount

):

    return (

        safe_float(contribution_amount)

        +

        safe_float(membership_amount)

    )

# ---------------------------------------------------
# PAYMENT SECTION
# ---------------------------------------------------

def render_payment_section():

    membership_type = st.selectbox(

        "Membership Type",

        list(MEMBERSHIP_OPTIONS.keys())

    )

    membership_amount = MEMBERSHIP_OPTIONS[
        membership_type
    ]

    contribution_amount = st.number_input(

        "Contribution Amount",

        min_value=0.0,

        step=100.0,

        value=0.0

    )

    total_amount = calculate_total_amount(

        contribution_amount,

        membership_amount

    )

    st.markdown(

        f"""

        <div class="metric-card">

            <div style="
                font-size:16px;
                color:#64748B;
                margin-bottom:10px;
            ">
                Total Collection
            </div>

            <div style="
                font-size:40px;
                font-weight:800;
                color:#1E5EFF;
            ">
                ₹{total_amount:,.0f}
            </div>

        </div>

        """,

        unsafe_allow_html=True

    )

    return {

        "membership_type":
        membership_type,

        "membership_amount":
        membership_amount,

        "contribution_amount":
        contribution_amount,

        "total_amount":
        total_amount,

    }