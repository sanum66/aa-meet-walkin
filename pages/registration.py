import streamlit as st
from datetime import datetime

from database import Database
from utils import generate_attendee_id, generate_qr_code, batch_select_options, safe_float

REGISTRATION_TYPES = ["Pre-Registered", "Spot Registration"]
PAYMENT_STATUSES = ["Paid", "Pending", "Waived"]
PAYMENT_MODES = ["Cash", "UPI", "Card", "Online", "Wallet", "Not Paid"]
FOOD_PREFERENCES = ["Vegetarian", "Non-Vegetarian", "Vegan", "No Preference"]


def render_registration_page(db: Database):
    st.header("Walk-In Registration")
    st.write("Capture attendee details instantly and generate a QR-based badge for quick check-in.")

    with st.form(key="registration_form"):
        col1, col2 = st.columns(2)
        with col1:
            full_name = st.text_input("Full Name")
            batch_year = st.selectbox("Batch Year", batch_select_options())
            department = st.text_input("Department")
            mobile = st.text_input("Mobile Number")
            email = st.text_input("Email ID")
        with col2:
            city = st.text_input("City")
            company = st.text_input("Company / Profession")
            registration_type = st.selectbox("Registration Type", REGISTRATION_TYPES)
            payment_status = st.selectbox("Payment Status", PAYMENT_STATUSES)
            payment_mode = st.selectbox("Payment Mode", PAYMENT_MODES)
            amount_paid = st.text_input("Amount Paid", value="0")
            food_preference = st.selectbox("Food Preference", FOOD_PREFERENCES)
            remarks = st.text_area("Remarks", height=100)

        submitted = st.form_submit_button("Register Attendee")

    if submitted:
        if not full_name.strip() or not mobile.strip() or not batch_year.strip() or not department.strip():
            st.error("Please provide full name, mobile number, batch year, and department.")
            return

        if db.duplicate_mobile_exists(mobile.strip()):
            st.error("An attendee with this mobile number has already been registered.")
            return

        attendee_id = generate_attendee_id(full_name, mobile)
        attendee_data = {
            "attendee_id": attendee_id,
            "full_name": full_name.strip().title(),
            "batch_year": batch_year,
            "department": department.strip().title(),
            "mobile": mobile.strip(),
            "email": email.strip(),
            "city": city.strip().title(),
            "company": company.strip().title(),
            "registration_type": registration_type,
            "payment_status": payment_status,
            "payment_mode": payment_mode,
            "amount_paid": safe_float(amount_paid),
            "food_preference": food_preference,
            "remarks": remarks.strip(),
            "created_at": __import__("datetime").datetime.utcnow().isoformat(),
            "checked_in": 0,
        }

        qr_code_path = generate_qr_code(attendee_id)
        attendee_data["qr_code_path"] = qr_code_path
        db.add_attendee(**attendee_data)

        st.success("✅ Registration completed successfully.")
        st.markdown(f"**Attendee ID:** {attendee_id}")
        st.markdown(f"**Payment Status:** {payment_status}")
        st.image(qr_code_path, width=220, caption="Scan this QR for quick check-in")
        st.balloons()
